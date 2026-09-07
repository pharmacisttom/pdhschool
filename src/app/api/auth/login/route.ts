import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/passwords';
import { setSessionCookie } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน', 'MISSING_CREDENTIALS', 400);
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // 1. Fetch user
    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
      include: {
        department: true,
        institution: true,
      },
    });

    if (!user) {
      await prisma.loginAttempt.create({
        data: { username: username.trim(), ipAddress, userAgent, success: false },
      });
      return errorResponse('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', 'INVALID_CREDENTIALS', 401);
    }

    // 2. Check if locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      return errorResponse(
        `บัญชีนี้ถูกระงับชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกินกำหนด กรุณาลองใหม่ในอีก ${remainingMinutes} นาที หรือติดต่อผู้ดูแลระบบ`,
        'ACCOUNT_LOCKED',
        403
      );
    }

    // 3. Check active
    if (!user.active) {
      return errorResponse('บัญชีผู้ใช้งานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 'ACCOUNT_INACTIVE', 403);
    }

    // 4. Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const newFailedCount = user.failedLoginAttempts + 1;
      let lockDate: Date | null = null;

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        lockDate = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedCount,
          lockedUntil: lockDate,
        },
      });

      await prisma.loginAttempt.create({
        data: { username: user.username, ipAddress, userAgent, success: false },
      });

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        return errorResponse(
          `ใส่รหัสผ่านผิดเกิน 5 ครั้ง บัญชีถูกระงับชั่วคราวเป็นเวลา ${LOCK_TIME_MINUTES} นาที`,
          'ACCOUNT_LOCKED',
          403
        );
      }

      return errorResponse(
        `รหัสผ่านไม่ถูกต้อง (ครั้งที่ ${newFailedCount}/${MAX_FAILED_ATTEMPTS})`,
        'INVALID_CREDENTIALS',
        401
      );
    }

    // 5. Successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await prisma.loginAttempt.create({
      data: { username: user.username, ipAddress, userAgent, success: true },
    });

    const sessionPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      institutionId: user.institutionId,
      preceptorId: user.preceptorId,
    };

    await setSessionCookie(sessionPayload);

    await createAuditLog({
      userId: user.id,
      username: user.username,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return successResponse({
      user: sessionPayload,
      departmentName: user.department?.nameThai || null,
      institutionName: user.institution?.nameThai || null,
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง', 'INTERNAL_ERROR', 500);
  }
}
