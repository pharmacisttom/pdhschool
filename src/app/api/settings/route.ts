import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  });
  return successResponse(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return errorResponse('ไม่มีสิทธิ์แก้ไขการตั้งค่าระบบ', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json(); // Array of { key, value }
    if (!Array.isArray(body)) {
      return errorResponse('รูปแบบข้อมูลไม่ถูกต้อง', 'INVALID_FORMAT', 400);
    }

    for (const item of body) {
      if (item.key && item.value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: item.key },
          update: { value: String(item.value) },
          create: { key: item.key, value: String(item.value) },
        });
      }
    }

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'UPDATE_SYSTEM_SETTINGS',
      entity: 'SystemSetting',
      newValue: JSON.stringify(body),
    });

    return successResponse({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'INTERNAL_ERROR', 500);
  }
}
