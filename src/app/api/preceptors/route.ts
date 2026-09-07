import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');

  const whereClause: any = { active: true };
  if (departmentId) whereClause.departmentId = departmentId;

  const preceptors = await prisma.preceptor.findMany({
    where: whereClause,
    include: {
      department: true,
      placements: {
        where: { status: 'ACTIVE' },
        include: { student: true },
      },
      _count: {
        select: {
          placements: true,
          evaluations: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return successResponse(preceptors);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'TRAINING_ADMIN', 'DEPARTMENT_ADMIN'].includes(session.role)) {
    return errorResponse('ไม่มีสิทธิ์เพิ่มอาจารย์พี่เลี้ยง', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { employeeCode, name, profession, departmentId, email, phone } = body;

    if (!employeeCode || !name || !profession || !departmentId) {
      return errorResponse('กรุณาระบุข้อมูลอาจารย์พี่เลี้ยงให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const preceptor = await prisma.preceptor.create({
      data: {
        employeeCode: employeeCode.trim(),
        name: name.trim(),
        profession: profession.trim(),
        departmentId,
        email,
        phone,
      },
    });

    return successResponse(preceptor, 201);
  } catch (error) {
    console.error('Error creating preceptor:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกอาจารย์พี่เลี้ยง (รหัสพนักงานอาจซ้ำ)', 'INTERNAL_ERROR', 500);
  }
}
