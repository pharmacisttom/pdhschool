import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(session.role)) {
    return errorResponse('ไม่มีสิทธิ์เข้าถึง Audit Log', 'FORBIDDEN', 403);
  }

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const action = searchParams.get('action');
  const limit = parseInt(searchParams.get('limit') || '100');

  const whereClause: any = {};
  if (entity) whereClause.entity = entity;
  if (action) whereClause.action = action;

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return successResponse(logs);
}
