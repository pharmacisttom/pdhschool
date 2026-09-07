import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { code: 'asc' },
    include: {
      _count: {
        select: {
          students: true,
          placements: true,
          quotas: true,
          preceptors: true,
        },
      },
    },
  });
  return successResponse(departments);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return errorResponse('ไม่มีสิทธิ์เพิ่มกลุ่มงาน', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { code, nameThai, nameEnglish, defaultQuota = 4, contactPerson, phone, email } = body;

    if (!code || !nameThai) {
      return errorResponse('กรุณาระบุรหัสและชื่อกลุ่มงาน', 'INVALID_INPUT', 400);
    }

    const dept = await prisma.department.create({
      data: {
        code: code.trim(),
        nameThai: nameThai.trim(),
        nameEnglish: nameEnglish ? nameEnglish.trim() : null,
        defaultQuota: parseInt(defaultQuota),
        contactPerson,
        phone,
        email,
      },
    });

    return successResponse(dept, 201);
  } catch (error) {
    console.error('Error creating department:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกกลุ่มงาน', 'INTERNAL_ERROR', 500);
  }
}
