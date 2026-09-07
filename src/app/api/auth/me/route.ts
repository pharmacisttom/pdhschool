import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      department: true,
      institution: true,
      preceptor: true,
    },
  });

  if (!user || !user.active) {
    return errorResponse('ผู้ใช้งานไม่ถูกต้องหรือถูกระงับ', 'UNAUTHORIZED', 401);
  }

  return successResponse({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department?.nameThai || null,
      institutionId: user.institutionId,
      institutionName: user.institution?.nameThai || null,
      preceptorId: user.preceptorId,
      preceptorName: user.preceptor?.name || null,
    },
  });
}
