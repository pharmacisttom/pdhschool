import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { AttendanceStatus } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date'); // YYYY-MM-DD
  const departmentId = searchParams.get('departmentId');
  const placementId = searchParams.get('placementId');

  const whereClause: any = {};
  if (placementId) whereClause.placementId = placementId;
  if (departmentId) whereClause.placement = { departmentId };

  // Department admin isolation
  if (session.role === 'DEPARTMENT_ADMIN' && session.departmentId) {
    whereClause.placement = { ...(whereClause.placement || {}), departmentId: session.departmentId };
  }
  // Preceptor isolation
  if (session.role === 'PRECEPTOR' && session.preceptorId) {
    whereClause.placement = { ...(whereClause.placement || {}), preceptorId: session.preceptorId };
  }

  if (dateStr) {
    const targetDate = new Date(dateStr);
    whereClause.date = targetDate;
  }

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      placement: {
        include: {
          student: { include: { institution: true } },
          department: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return successResponse(attendances);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  try {
    const body = await req.json();
    const { placementId, date, checkIn, checkOut, status = 'PRESENT', note } = body;

    if (!placementId || !date) {
      return errorResponse('กรุณาระบุ Placement ID และวันที่', 'INVALID_INPUT', 400);
    }

    const attendanceDate = new Date(date);

    const record = await prisma.attendance.upsert({
      where: {
        placementId_date: {
          placementId,
          date: attendanceDate,
        },
      },
      update: {
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        status: status as AttendanceStatus,
        note: note || undefined,
        recordedBy: session.name,
      },
      create: {
        placementId,
        date: attendanceDate,
        checkIn: checkIn || '08:00',
        checkOut: checkOut || '16:30',
        status: status as AttendanceStatus,
        note,
        recordedBy: session.name,
      },
    });

    return successResponse(record, 201);
  } catch (error) {
    console.error('Error recording attendance:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกเวลา', 'INTERNAL_ERROR', 500);
  }
}
