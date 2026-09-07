import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyDailyToken } from '@/lib/attendance/daily-qr';
import { toThaiDate } from '@/lib/utils/date';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, token, identifier } = body;

    if (!date || !token) {
      return errorResponse('พารามิเตอร์ QR Code ไม่ครบถ้วนหรือไม่ถูกต้อง', 'INVALID_QR_PARAMS', 400);
    }

    // Verify daily dynamic token
    const isValidToken = verifyDailyToken(date, token);
    if (!isValidToken) {
      return errorResponse(
        'QR Code นี้หมดอายุแล้วหรือเป็นของวันอื่น กรุณาสแกน QR Code ประจำวันใหม่อีกครั้ง',
        'EXPIRED_QR_TOKEN',
        403
      );
    }

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return errorResponse('กรุณาระบุรหัสนักศึกษา หรือเลขประจำตัวประชาชน', 'MISSING_IDENTIFIER', 400);
    }

    const cleanId = identifier.trim().replace(/[-\s]/g, '');

    // Look up student by studentCode, nationalId, phone, or id
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { studentCode: identifier.trim() },
          { studentCode: cleanId },
          { nationalIdMasked: { contains: cleanId.slice(-4) } },
          { phone: { contains: cleanId } },
          { id: identifier.trim() },
        ],
      },
      include: {
        institution: true,
        department: true,
      },
    });

    if (!student) {
      return errorResponse(
        'ไม่พบข้อมูลนักศึกษา กรุณาตรวจสอบรหัสนักศึกษาหรือติดต่อเจ้าหน้าที่งานพัฒนาบุคลากร',
        'STUDENT_NOT_FOUND',
        404
      );
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);

    // Look for active placement covering this date (or active placement in current term)
    let placement = await prisma.placement.findFirst({
      where: {
        studentId: student.id,
        status: 'APPROVED',
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
      include: {
        department: true,
        preceptor: true,
        quotaPeriod: true,
      },
      orderBy: { startDate: 'desc' },
    });

    // Fallback: if student has an approved placement within this semester
    if (!placement) {
      placement = await prisma.placement.findFirst({
        where: {
          studentId: student.id,
          status: 'APPROVED',
        },
        include: {
          department: true,
          preceptor: true,
          quotaPeriod: true,
        },
        orderBy: { startDate: 'desc' },
      });
    }

    if (!placement) {
      return errorResponse(
        `นักศึกษา ${student.prefix || ''}${student.firstName} ${student.lastName} ยังไม่มีการจัดสรรแหล่งฝึกที่ได้รับการอนุมัติ`,
        'NO_APPROVED_PLACEMENT',
        400
      );
    }

    // Look up existing attendance record for this date
    const attendance = await prisma.attendance.findFirst({
      where: {
        placementId: placement.id,
        date: targetDate,
      },
    });

    const hasCheckedIn = Boolean(attendance?.checkIn);
    const hasCheckedOut = Boolean(attendance?.checkOut);

    return successResponse({
      date,
      thaiDate: toThaiDate(targetDate, 'long'),
      student: {
        id: student.id,
        studentCode: student.studentCode,
        fullName: `${student.prefix || ''}${student.firstName} ${student.lastName}`,
        institutionName: student.institution?.nameThai || '-',
        faculty: student.faculty || '-',
        program: student.program || '-',
        yearLevel: student.yearLevel,
        departmentName: placement.department?.nameThai || student.department?.nameThai || '-',
        preceptorName: placement.preceptor?.name || 'ยังไม่ได้กำหนด',
      },
      placement: {
        id: placement.id,
        departmentName: placement.department?.nameThai,
        startDate: placement.startDate,
        endDate: placement.endDate,
      },
      attendance: attendance
        ? {
            id: attendance.id,
            checkIn: attendance.checkIn,
            checkOut: attendance.checkOut,
            status: attendance.status,
            note: attendance.note,
          }
        : null,
      flowState: !hasCheckedIn
        ? 'READY_FOR_CHECK_IN'
        : !hasCheckedOut
        ? 'READY_FOR_CHECK_OUT'
        : 'COMPLETED',
    });
  } catch (error: any) {
    console.error('scan-lookup error:', error);
    return errorResponse(error.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล', 'LOOKUP_ERROR', 500);
  }
}
