import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const programs = await prisma.program.findMany({
    orderBy: { programCode: 'asc' },
    include: {
      _count: {
        select: {
          requests: true,
          quotas: true,
        },
      },
    },
  });
  return successResponse(programs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return errorResponse('ไม่มีสิทธิ์เพิ่มหลักสูตร', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { programCode, programName, profession, educationLevel = 'ปริญญาตรี' } = body;

    if (!programCode || !programName || !profession) {
      return errorResponse('กรุณากรอกข้อมูลหลักสูตรให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const prog = await prisma.program.create({
      data: {
        programCode: programCode.trim(),
        programName: programName.trim(),
        profession: profession.trim(),
        educationLevel,
      },
    });

    return successResponse(prog, 201);
  } catch (error) {
    console.error('Error creating program:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกหลักสูตร', 'INTERNAL_ERROR', 500);
  }
}
