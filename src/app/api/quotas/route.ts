import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { canManageQuotas } from '@/lib/auth/rbac';
import { PlacementStatus, QuotaStatus } from '@prisma/client';
import { computeQuotaStatus } from '@/lib/quota/engine';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  const academicYear = searchParams.get('academicYear');

  const whereClause: any = {};
  if (departmentId) whereClause.departmentId = departmentId;
  if (academicYear) whereClause.academicYear = parseInt(academicYear);

  // If department admin, restrict to their department unless super/training admin
  if (session.role === 'DEPARTMENT_ADMIN' && session.departmentId) {
    whereClause.departmentId = session.departmentId;
  }

  const quotas = await prisma.quotaPeriod.findMany({
    where: whereClause,
    include: {
      department: true,
      program: true,
      placements: {
        where: {
          status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] },
        },
        include: {
          student: {
            include: { institution: true },
          },
        },
      },
      allocations: {
        include: {
          request: {
            include: { institution: true },
          },
        },
      },
    },
    orderBy: [{ academicYear: 'desc' }, { startDate: 'asc' }],
  });

  const detailedData = quotas.map((q) => {
    const approvedCount = q.placements.length;
    const availableCount = Math.max(0, q.maxStudents - approvedCount);
    const occupancyPercent = q.maxStudents > 0 ? Math.min(100, Math.round((approvedCount / q.maxStudents) * 100)) : 100;
    const computedStatus = computeQuotaStatus(q.maxStudents, approvedCount, q.status);

    return {
      id: q.id,
      departmentId: q.departmentId,
      departmentName: q.department.nameThai,
      departmentCode: q.department.code,
      programId: q.programId,
      programName: q.program?.programName || 'ทุกสาขาวิชา',
      academicYear: q.academicYear,
      term: q.term,
      startDate: q.startDate,
      endDate: q.endDate,
      maxStudents: q.maxStudents,
      approvedCount,
      availableCount,
      occupancyPercent,
      status: computedStatus,
      rawStatus: q.status,
      notes: q.notes,
      placements: q.placements.map((p) => ({
        id: p.id,
        studentName: `${p.student.prefix} ${p.student.firstName} ${p.student.lastName}`,
        institutionName: p.student.institution.nameThai,
        status: p.status,
      })),
      allocations: q.allocations.map((a) => ({
        id: a.id,
        requestNo: a.request.requestNo,
        institutionName: a.request.institution.nameThai,
        studentCount: a.studentCount,
        allocatedAt: a.allocatedAt,
      })),
    };
  });

  return successResponse(detailedData);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);
  if (!canManageQuotas(session)) return errorResponse('ไม่มีสิทธิ์จัดการโควต้า', 'FORBIDDEN', 403);

  try {
    const body = await req.json();
    const { departmentId, programId, academicYear, term, startDate, endDate, maxStudents, notes } = body;

    if (!departmentId || !startDate || !endDate || !maxStudents) {
      return errorResponse('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const quota = await prisma.quotaPeriod.create({
      data: {
        departmentId,
        programId: programId || null,
        academicYear: parseInt(academicYear) || 2569,
        term: term || '1',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxStudents: parseInt(maxStudents),
        status: QuotaStatus.AVAILABLE,
        notes: notes || null,
      },
    });

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'CREATE_QUOTA_PERIOD',
      entity: 'QuotaPeriod',
      entityId: quota.id,
      newValue: JSON.stringify(quota),
    });

    return successResponse(quota, 201);
  } catch (error) {
    console.error('Error creating quota:', error);
    return errorResponse('เกิดข้อผิดพลาดในการสร้างโควต้า', 'INTERNAL_ERROR', 500);
  }
}
