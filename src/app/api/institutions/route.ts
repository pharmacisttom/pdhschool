import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { InstitutionStatus } from '@prisma/client';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const institutions = await prisma.institution.findMany({
    include: {
      _count: {
        select: {
          students: true,
          requests: true,
        },
      },
    },
    orderBy: { nameThai: 'asc' },
  });
  return successResponse(institutions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      nameThai,
      nameEnglish,
      type = 'มหาวิทยาลัยรัฐ',
      faculty,
      address,
      province,
      postalCode,
      coordinatorName,
      coordinatorPhone,
      coordinatorEmail,
      officialEmail,
      notes,
      studentDetails,
    } = body;

    if (!code || !nameThai || !coordinatorName || !coordinatorPhone || !coordinatorEmail) {
      return errorResponse('กรุณาระบุข้อมูลจำเป็นของสถาบันและผู้ประสานงานให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    let finalNotes = notes || '';
    if (studentDetails) {
      finalNotes = JSON.stringify({
        notes: notes || studentDetails.additionalNotes || '',
        studentDetails: {
          educationLevel: studentDetails.educationLevel || '',
          faculty: faculty || studentDetails.faculty || '',
          major: studentDetails.major || '',
          classYear: studentDetails.classYear || '',
          studentCount: studentDetails.studentCount ? Number(studentDetails.studentCount) : null,
          targetDepartment: studentDetails.targetDepartment || '',
          startDate: studentDetails.startDate || '',
          endDate: studentDetails.endDate || '',
          trainingPeriod: studentDetails.trainingPeriod || '',
          estimatedHours: studentDetails.estimatedHours ? Number(studentDetails.estimatedHours) : null,
          additionalNotes: studentDetails.additionalNotes || notes || '',
        },
      });
    }

    const session = await getSession();
    // If admin creates, active by default; if public registration, status is PENDING
    const initialStatus = session && ['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(session.role)
      ? InstitutionStatus.ACTIVE
      : InstitutionStatus.PENDING;

    const institution = await prisma.institution.create({
      data: {
        code: code.trim(),
        nameThai: nameThai.trim(),
        nameEnglish: nameEnglish ? nameEnglish.trim() : null,
        type,
        faculty,
        address,
        province,
        postalCode,
        coordinatorName: coordinatorName.trim(),
        coordinatorPhone: coordinatorPhone.trim(),
        coordinatorEmail: coordinatorEmail.trim(),
        officialEmail,
        status: initialStatus,
        notes: finalNotes,
      },
    });

    if (session) {
      await createAuditLog({
        userId: session.id,
        username: session.username,
        action: 'CREATE_INSTITUTION',
        entity: 'Institution',
        entityId: institution.id,
        newValue: JSON.stringify(institution),
      });
    }

    return successResponse(institution, 201);
  } catch (error) {
    console.error('Error creating institution:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกข้อมูลสถาบันการศึกษา (รหัสสถาบันอาจซ้ำซ้อน)', 'INTERNAL_ERROR', 500);
  }
}
