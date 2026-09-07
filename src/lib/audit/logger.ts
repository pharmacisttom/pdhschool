import { prisma } from '@/lib/db/prisma';

export interface AuditLogParams {
  userId?: string | null;
  username: string;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        username: params.username,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        oldValue: params.oldValue ? (typeof params.oldValue === 'string' ? params.oldValue : JSON.stringify(params.oldValue)) : null,
        newValue: params.newValue ? (typeof params.newValue === 'string' ? params.newValue : JSON.stringify(params.newValue)) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
  }
}
