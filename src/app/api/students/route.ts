import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { PlacementStatus } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.trim();
  const departmentId = searchParams.get('departmentId');
  const institutionId = searchParams.get('institutionId');
  const status = searchParams.get('status') as PlacementStatus | null;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const whereClause: any = {};
  if (departmentId) whereClause.departmentId = departmentId;
  if (status) whereClause.placementStatus = status;

  if (session.role === 'INSTITUTION' && session.institutionId) {
    whereClause.institutionId = session.institutionId;
  } else if (institutionId) {
    whereClause.institutionId = institutionId;
  }

  // Department admin isolation: only see students placed or assigned in their department
  if (session.role === 'DEPARTMENT_ADMIN' && session.departmentId) {
    whereClause.AND = [
      ...(whereClause.AND || []),
      {
        OR: [
          { departmentId: session.departmentId },
          { placements: { some: { departmentId: session.departmentId } } },
        ],
      },
    ];
  }

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { studentCode: { contains: search } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where: whereClause,
      include: {
        institution: true,
        department: true,
        placements: {
          include: {
            preceptor: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.student.count({ where: whereClause }),
  ]);

  return successResponse({
    students,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  try {
    const body = await req.json();
    const {
      studentCode,
      prefix,
      firstName,
      lastName,
      institutionId,
      faculty,
      program,
      educationLevel = 'ปริญญาตรี',
      yearLevel = 4,
      phone,
      email,
      emergencyContact,
      emergencyPhone,
      departmentId,
    } = body;

    const actualInstitutionId = session.role === 'INSTITUTION' ? session.institutionId : institutionId;
    if (!actualInstitutionId || !studentCode || !firstName || !lastName) {
      return errorResponse('กรุณาระบุข้อมูลนักศึกษาให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const student = await prisma.student.upsert({
      where: {
        institutionId_studentCode: {
          institutionId: actualInstitutionId,
          studentCode: studentCode.trim(),
        },
      },
      update: {
        prefix,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        faculty,
        program,
        educationLevel,
        yearLevel: parseInt(yearLevel),
        phone,
        email,
        emergencyContact,
        emergencyPhone,
        departmentId: departmentId || undefined,
      },
      create: {
        studentCode: studentCode.trim(),
        prefix: prefix || 'นาย',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        institutionId: actualInstitutionId,
        faculty,
        program,
        educationLevel,
        yearLevel: parseInt(yearLevel),
        phone,
        email,
        emergencyContact,
        emergencyPhone,
        departmentId: departmentId || null,
        placementStatus: PlacementStatus.PENDING,
      },
    });

    return successResponse(student, 201);
  } catch (error) {
    console.error('Error creating student:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกข้อมูลนักศึกษา', 'INTERNAL_ERROR', 500);
  }
}
