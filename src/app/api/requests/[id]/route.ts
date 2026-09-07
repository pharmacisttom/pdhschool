import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { RequestStatus } from '@prisma/client';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { id } = await context.params;

  const request = await prisma.trainingRequest.findUnique({
    where: { id },
    include: {
      institution: true,
      department: true,
      program: true,
      requestStudents: {
        include: {
          student: true,
        },
      },
      placements: {
        include: {
          preceptor: true,
        },
      },
      allocations: {
        include: {
          quotaPeriod: true,
        },
      },
      documents: true,
    },
  });

  if (!request) {
    return errorResponse('ไม่พบคำขอฝึกงานที่ระบุ', 'NOT_FOUND', 404);
  }

  // Check institutional access
  if (session.role === 'INSTITUTION' && session.institutionId && request.institutionId !== session.institutionId) {
    return errorResponse('ไม่มีสิทธิ์เข้าถึงคำขอนี้', 'FORBIDDEN', 403);
  }

  return successResponse(request);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { id } = await context.params;
  const body = await req.json();
  const { status, notes, rejectionReason } = body;

  const existing = await prisma.trainingRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse('ไม่พบคำขอฝึกงาน', 'NOT_FOUND', 404);

  const updated = await prisma.trainingRequest.update({
    where: { id },
    data: {
      status: status || existing.status,
      notes: notes !== undefined ? notes : existing.notes,
      rejectionReason: rejectionReason !== undefined ? rejectionReason : existing.rejectionReason,
      reviewedBy: session.name,
      reviewedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: session.id,
    username: session.username,
    action: 'UPDATE_REQUEST_STATUS',
    entity: 'TrainingRequest',
    entityId: id,
    oldValue: `status: ${existing.status}`,
    newValue: `status: ${updated.status}, note: ${notes || ''}`,
  });

  return successResponse(updated);
}
