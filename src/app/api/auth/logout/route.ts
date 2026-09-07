import { clearSession, getSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse } from '@/lib/api-response';

export async function POST() {
  const session = await getSession();
  if (session) {
    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'LOGOUT',
      entity: 'User',
      entityId: session.id,
    });
  }
  await clearSession();
  return successResponse({ message: 'ออกจากระบบเรียบร้อยแล้ว' });
}
