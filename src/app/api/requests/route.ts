import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { RequestStatus, PlacementStatus, RoleType } from '@prisma/client';
import { createAuditLog } from '@/lib/audit/logger';
import { dispatchN8nWebhook } from '@/lib/webhooks/dispatcher';
import { successResponse, errorResponse } from '@/lib/api-response';

async function generateNextRequestNo(): Promise<string> {
  const currentYear = new Date().getFullYear() + 543;
  const count = await prisma.trainingRequest.count({
    where: { academicYear: currentYear },
  });
  const nextSeq = String(count + 1).padStart(6, '0');
  return `TR-${currentYear}-${nextSeq}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as RequestStatus | null;
  const departmentId = searchParams.get('departmentId');
  const institutionId = searchParams.get('institutionId');

  const whereClause: any = {};
  if (status) whereClause.status = status;
  if (departmentId) whereClause.departmentId = departmentId;
  if (institutionId) whereClause.institutionId = institutionId;

  // Institutional users can only see their own institution's requests
  if (session.role === RoleType.INSTITUTION && session.institutionId) {
    whereClause.institutionId = session.institutionId;
  }

  // Department admins see requests for their department
  if (session.role === RoleType.DEPARTMENT_ADMIN && session.departmentId) {
    whereClause.departmentId = session.departmentId;
  }

  const requests = await prisma.trainingRequest.findMany({
    where: whereClause,
    include: {
      institution: true,
      department: true,
      program: true,
      requestStudents: {
        include: {
          student: true,
        },
      },
      placements: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(requests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  try {
    const body = await req.json();
    const {
      institutionId,
      departmentId,
      programId,
      educationLevel = 'ปริญญาตรี',
      academicYear = 2569,
      semester = '1',
      requestedStartDate,
      requestedEndDate,
      coordinatorName,
      coordinatorPhone,
      coordinatorEmail,
      notes,
      students = [], // Array of { studentCode, prefix, firstName, lastName, yearLevel, phone, email }
    } = body;

    const actualInstitutionId = session.role === RoleType.INSTITUTION ? session.institutionId : institutionId;

    if (!actualInstitutionId || !departmentId || !requestedStartDate || !requestedEndDate || students.length === 0) {
      return errorResponse('กรุณาระบุข้อมูลคำขอ แผนกฝึก และรายชื่อนักศึกษาให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const requestNo = await generateNextRequestNo();

    // Create request with students in a transaction
    const newRequest = await prisma.$transaction(async (tx) => {
      const createdRequest = await tx.trainingRequest.create({
        data: {
          requestNo,
          institutionId: actualInstitutionId,
          departmentId,
          programId: programId || null,
          educationLevel,
          academicYear: parseInt(academicYear),
          semester,
          requestedStartDate: new Date(requestedStartDate),
          requestedEndDate: new Date(requestedEndDate),
          requestedStudents: students.length,
          coordinatorName,
          coordinatorPhone,
          coordinatorEmail,
          notes: notes || null,
          status: RequestStatus.SUBMITTED,
        },
      });

      // Upsert student profiles and link to this request
      for (const s of students) {
        let studentRecord = await tx.student.findUnique({
          where: {
            institutionId_studentCode: {
              institutionId: actualInstitutionId,
              studentCode: s.studentCode.trim(),
            },
          },
        });

        if (!studentRecord) {
          studentRecord = await tx.student.create({
            data: {
              studentCode: s.studentCode.trim(),
              prefix: s.prefix || 'นาย/นางสาว',
              firstName: s.firstName.trim(),
              lastName: s.lastName.trim(),
              institutionId: actualInstitutionId,
              departmentId,
              yearLevel: s.yearLevel ? parseInt(s.yearLevel) : 4,
              phone: s.phone || null,
              email: s.email || null,
              placementStatus: PlacementStatus.PENDING,
            },
          });
        }

        await tx.trainingRequestStudent.create({
          data: {
            requestId: createdRequest.id,
            studentId: studentRecord.id,
            allocatedStatus: PlacementStatus.PENDING,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.id,
          username: session.username,
          action: 'SUBMIT_TRAINING_REQUEST',
          entity: 'TrainingRequest',
          entityId: createdRequest.id,
          newValue: `RequestNo: ${requestNo}, Students: ${students.length}`,
        },
      });

      return createdRequest;
    });

    // Fire outbound n8n event
    await dispatchN8nWebhook('training_request.created', {
      requestId: newRequest.id,
      requestNo: newRequest.requestNo,
      institutionId: actualInstitutionId,
      departmentId,
      studentCount: students.length,
      requestedStartDate,
      requestedEndDate,
    });

    return successResponse(newRequest, 201);
  } catch (error) {
    console.error('Error creating training request:', error);
    return errorResponse('เกิดข้อผิดพลาดในการสร้างคำขอฝึกงาน', 'INTERNAL_ERROR', 500);
  }
}
