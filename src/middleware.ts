import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'pdhschool_super_secret_jwt_key_development_2026_pluakdaeng'
);

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/training-quota',
  '/register-institution',
  '/api/health',
  '/api/auth/login',
  '/api/auth/logout',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/quotas/public')
  ) {
    return NextResponse.next();
  }

  // 2. Allow explicitly public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. Check for session cookie
  const token = request.cookies.get('pdhschool_session')?.value;

  if (!token) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบ' } },
        { status: 401 }
      );
    }
    // Web pages redirect to /login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const role = payload.role as string;

    // Role-specific route boundaries
    if (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/settings')) {
      if (role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
      }
    }

    if (pathname.startsWith('/dashboard/audit')) {
      if (!['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
      }
    }

    // Pass validated session header
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id as string);
    response.headers.set('x-user-role', role);
    return response;
  } catch {
    // Invalid or expired token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_EXPIRED', message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' } },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
