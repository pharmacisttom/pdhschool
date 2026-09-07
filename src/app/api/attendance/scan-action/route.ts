import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyDailyToken } from '@/lib/attendance/daily-qr';
import { createAuditLog } from '@/lib/audit/logger';
import { AttendanceStatus } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/api-response';

function getBangkokTimeString(): { timeStr: string; hours: number; minutes: number } {
  const now = new Date();
  const bangkokTime = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
  const hours = bangkokTime.getHours();
  const minutes = bangkokTime.getMinutes();
  const seconds = bangkokTime.getSeconds();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { timeStr, hours, minutes };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, token, placementId, studentId, action, note } = body;

    if (!date || !token || !placementId || !studentId || !action) {
      return errorResponse('ข้อมูลคำขอไม่ครบถ้วน', 'INVALID_INPUT', 400);
    }

    // 1. Verify dynamic QR token
    if (!verifyDailyToken(date, token)) {
      return errorResponse(
        'รหัส QR Code หมดอายุหรือไม่ถูกต้อง กรุณาสแกน QR Code ประจำวันใหม่อีกครั้ง',
        'INVALID_TOKEN',
        403
      );
    }

    // 2. Verify placement and student match
    const placement = await prisma.placement.findFirst({
      where: {
        id: placementId,
        studentId,
        status: 'APPROVED',
      },
      include: {
        student: true,
        department: true,
      },
    });

    if (!placement) {
      return errorResponse('ไม่พบข้อมูลการจัดสรรแหล่งฝึกที่ถูกต้องของนักศึกษานี้', 'PLACEMENT_NOT_FOUND', 404);
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);
    const { timeStr, hours, minutes } = getBangkokTimeString();

    // Check existing attendance record
    const existing = await prisma.attendance.findUnique({
      where: {
        placementId_date: {
          placementId,
          date: targetDate,
        },
      },
    });

    if (action === 'CHECK_IN') {
      if (existing?.checkIn) {
        return errorResponse(
          `คุณได้ทำการสแกนเข้าปฏิบัติงานแล้วเมื่อเวลา ${existing.checkIn} น.`,
          'ALREADY_CHECKED_IN',
          400
        );
      }

      // Determine on-time vs late (standard cutoff 08:30:00)
      const isLate = hours > 8 || (hours === 8 && minutes > 30);
      const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      const record = await prisma.attendance.upsert({
        where: {
          placementId_date: {
            placementId,
            date: targetDate,
          },
        },
        update: {
          checkIn: timeStr,
          status: existing?.status || status,
          note: note ? `${existing?.note ? existing.note + ' | ' : ''}${note}` : existing?.note,
          recordedBy: 'QR_STUDENT_SELF_SCAN',
        },
        create: {
          placementId,
          date: targetDate,
          checkIn: timeStr,
          status,
          note: note || null,
          recordedBy: 'QR_STUDENT_SELF_SCAN',
        },
      });

      await createAuditLog({
        username: `STUDENT:${placement.student.studentCode}`,
        action: 'ATTENDANCE_QR_CHECK_IN',
        entity: 'Attendance',
        entityId: record.id,
        newValue: {
          studentCode: placement.student.studentCode,
          studentName: `${placement.student.firstName} ${placement.student.lastName}`,
          department: placement.department.nameThai,
          checkIn: timeStr,
          status,
          date,
        },
      });

      return successResponse({
        action: 'CHECK_IN',
        time: timeStr,
        status,
        statusLabel: status === AttendanceStatus.PRESENT ? 'มาปกติ (ทันเวลา)' : 'มาสาย (หลัง 08:30 น.)',
        message: `บันทึกเวลาเข้าปฏิบัติงานสำเร็จ เวลา ${timeStr} น.`,
        record,
      });
    } else if (action === 'CHECK_OUT') {
      if (!existing?.checkIn) {
        return errorResponse(
          'ไม่สามารถสแกนออกได้ เนื่องจากยังไม่มีการสแกนเข้าปฏิบัติงานในวันนี้',
          'MISSING_CHECK_IN',
          400
        );
      }

      if (existing?.checkOut) {
        return errorResponse(
          `คุณได้ทำการสแกนออกปฏิบัติงานเรียบร้อยแล้วเมื่อเวลา ${existing.checkOut} น.`,
          'ALREADY_CHECKED_OUT',
          400
        );
      }

      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: timeStr,
          note: note ? `${existing.note ? existing.note + ' | ' : ''}${note}` : existing.note,
        },
      });

      await createAuditLog({
        username: `STUDENT:${placement.student.studentCode}`,
        action: 'ATTENDANCE_QR_CHECK_OUT',
        entity: 'Attendance',
        entityId: record.id,
        oldValue: { checkIn: existing.checkIn },
        newValue: {
          studentCode: placement.student.studentCode,
          studentName: `${placement.student.firstName} ${placement.student.lastName}`,
          department: placement.department.nameThai,
          checkIn: existing.checkIn,
          checkOut: timeStr,
          date,
        },
      });

      return successResponse({
        action: 'CHECK_OUT',
        time: timeStr,
        checkInTime: existing.checkIn,
        message: `บันทึกเวลาออกปฏิบัติงานสำเร็จ เวลา ${timeStr} น.`,
        record,
      });
    } else {
      return errorResponse('รูปแบบ Action ไม่ถูกต้อง (ต้องเป็น CHECK_IN หรือ CHECK_OUT)', 'INVALID_ACTION', 400);
    }
  } catch (error: any) {
    console.error('scan-action error:', error);
    return errorResponse(error.message || 'เกิดข้อผิดพลาดในการบันทึกเวลา', 'ACTION_ERROR', 500);
  }
}
