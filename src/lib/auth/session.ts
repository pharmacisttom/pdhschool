import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { RoleType } from '@prisma/client';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'pdhschool_super_secret_jwt_key_development_2026_pluakdaeng'
);

const COOKIE_NAME = 'pdhschool_session';
const SESSION_EXPIRATION_HOURS = 12;

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: RoleType;
  departmentId?: string | null;
  institutionId?: string | null;
  preceptorId?: string | null;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRATION_HOURS}h`)
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      username: payload.username as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as RoleType,
      departmentId: (payload.departmentId as string) || null,
      institutionId: (payload.institutionId as string) || null,
      preceptorId: (payload.preceptorId as string) || null,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRATION_HOURS * 60 * 60,
  });
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
