import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/passwords';
import { RoleType } from '@prisma/client';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return errorResponse('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งาน', 'FORBIDDEN', 403);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      active: true,
      departmentId: true,
      department: { select: { nameThai: true } },
      institutionId: true,
      institution: { select: { nameThai: true } },
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(users);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return errorResponse('ไม่มีสิทธิ์เพิ่มผู้ใช้งาน', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { username, password, name, email, role = RoleType.VIEWER, departmentId, institutionId } = body;

    if (!username || !password || !name || !email) {
      return errorResponse('กรุณาระบุข้อมูลผู้ใช้งานให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        name: name.trim(),
        email: email.trim(),
        role,
        departmentId: departmentId || null,
        institutionId: institutionId || null,
      },
    });

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      newValue: `Created user ${username} with role ${role}`,
    });

    return successResponse({ id: user.id, username: user.username, name: user.name, role: user.role }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse('เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน (ชื่อผู้ใช้หรืออีเมลอาจซ้ำ)', 'INTERNAL_ERROR', 500);
  }
}
