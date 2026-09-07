import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { PlacementStatus } from '@prisma/client';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  const status = searchParams.get('status') as PlacementStatus | null;
  const preceptorId = searchParams.get('preceptorId');

  const whereClause: any = {};
  if (departmentId) whereClause.departmentId = departmentId;
  if (status) whereClause.status = status;
  if (preceptorId) whereClause.preceptorId = preceptorId;

  // Department admin isolation
  if (session.role === 'DEPARTMENT_ADMIN' && session.departmentId) {
    whereClause.departmentId = session.departmentId;
  }
  // Preceptor isolation
  if (session.role === 'PRECEPTOR' && session.preceptorId) {
    whereClause.preceptorId = session.preceptorId;
  }
  // Institution isolation
  if (session.role === 'INSTITUTION' && session.institutionId) {
    whereClause.student = { institutionId: session.institutionId };
  }

  const placements = await prisma.placement.findMany({
    where: whereClause,
    include: {
      student: {
        include: { institution: true },
      },
      department: true,
      quotaPeriod: true,
      preceptor: true,
      evaluations: true,
      _count: {
        select: { attendances: true },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  return successResponse(placements);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  try {
    const body = await req.json();
    const { placementId, preceptorId, status, notes } = body;

    if (!placementId) return errorResponse('กรุณาระบุ Placement ID', 'INVALID_INPUT', 400);

    const existing = await prisma.placement.findUnique({ where: { id: placementId } });
    if (!existing) return errorResponse('ไม่พบข้อมูลการจัดสรร', 'NOT_FOUND', 404);

    const updated = await prisma.placement.update({
      where: { id: placementId },
      data: {
        preceptorId: preceptorId !== undefined ? preceptorId : existing.preceptorId,
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    if (preceptorId) {
      await prisma.preceptorAssignment.upsert({
        where: {
          preceptorId_placementId: {
            preceptorId,
            placementId,
          },
        },
        update: { assignedDate: new Date() },
        create: {
          preceptorId,
          placementId,
          notes: 'Assigned via Placement Manager',
        },
      });
    }

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'UPDATE_PLACEMENT',
      entity: 'Placement',
      entityId: placementId,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating placement:', error);
    return errorResponse('เกิดข้อผิดพลาดในการอัปเดตการจัดสรร', 'INTERNAL_ERROR', 500);
  }
}
