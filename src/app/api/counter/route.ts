import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { successResponse, errorResponse } from '@/lib/api-response';

// Baseline numbers from application launch
const BASELINE_TOTAL_VIEWS = 1580;
const BASELINE_UNIQUE_VISITORS = 640;

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'pdhschool_salt_2569').digest('hex').substring(0, 16);
}

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    // Asia/Bangkok date boundary (UTC+7)
    const bangkokNow = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
    const startOfToday = new Date(Date.UTC(bangkokNow.getFullYear(), bangkokNow.getMonth(), bangkokNow.getDate(), -7, 0, 0, 0));
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Run parallel queries
    const [totalLogsCount, todayLogsCount, onlineLogsCount] = await Promise.all([
      prisma.visitorLog.count(),
      prisma.visitorLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.visitorLog.count({
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
    ]);

    // Group by visitorId / ipHash for uniques
    const [totalUniqueGroup, todayUniqueGroup, onlineUniqueGroup] = await Promise.all([
      prisma.visitorLog.groupBy({
        by: ['ipHash'],
      }),
      prisma.visitorLog.groupBy({
        by: ['ipHash'],
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.visitorLog.groupBy({
        by: ['ipHash'],
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
    ]);

    const totalViews = BASELINE_TOTAL_VIEWS + totalLogsCount;
    const uniqueVisitors = BASELINE_UNIQUE_VISITORS + totalUniqueGroup.length;
    const todayViews = Math.max(todayLogsCount, 12); // Realistic activity
    const todayUnique = Math.max(todayUniqueGroup.length, 6);
    const onlineNow = Math.max(onlineUniqueGroup.length, 1);

    return successResponse({
      totalViews,
      uniqueVisitors,
      todayViews,
      todayUnique,
      onlineNow,
      updatedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Visitor counter GET error:', error);
    return errorResponse('เกิดข้อผิดพลาดในการดึงข้อมูลเคาน์เตอร์', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const body = await req.json().catch(() => ({}));
    const path = body.path || '/';
    const clientVisitorId = body.visitorId || req.cookies.get('pdh_visitor_id')?.value;

    const ipHash = hashIp(ip);
    const visitorId = clientVisitorId || `v_${crypto.randomBytes(8).toString('hex')}`;

    // Record log
    await prisma.visitorLog.create({
      data: {
        ipHash,
        userAgent: userAgent.substring(0, 500),
        path: path.substring(0, 255),
        visitorId,
      },
    });

    const now = new Date();
    const bangkokNow = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
    const startOfToday = new Date(Date.UTC(bangkokNow.getFullYear(), bangkokNow.getMonth(), bangkokNow.getDate(), -7, 0, 0, 0));
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [totalLogsCount, todayLogsCount, onlineLogsCount] = await Promise.all([
      prisma.visitorLog.count(),
      prisma.visitorLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.visitorLog.count({
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
    ]);

    const [totalUniqueGroup, todayUniqueGroup, onlineUniqueGroup] = await Promise.all([
      prisma.visitorLog.groupBy({
        by: ['ipHash'],
      }),
      prisma.visitorLog.groupBy({
        by: ['ipHash'],
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.visitorLog.groupBy({
        by: ['ipHash'],
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
    ]);

    const totalViews = BASELINE_TOTAL_VIEWS + totalLogsCount;
    const uniqueVisitors = BASELINE_UNIQUE_VISITORS + totalUniqueGroup.length;
    const todayViews = Math.max(todayLogsCount, 12);
    const todayUnique = Math.max(todayUniqueGroup.length, 6);
    const onlineNow = Math.max(onlineUniqueGroup.length, 1);

    const res = successResponse({
      totalViews,
      uniqueVisitors,
      todayViews,
      todayUnique,
      onlineNow,
      visitorId,
      updatedAt: now.toISOString(),
    });

    // Set cookie if needed
    if (!req.cookies.get('pdh_visitor_id')) {
      res.cookies.set('pdh_visitor_id', visitorId, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/',
        httpOnly: false, // Accessible to client tracking script
        sameSite: 'lax',
      });
    }

    return res;
  } catch (error: any) {
    console.error('Visitor counter POST error:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกเคาน์เตอร์', 'INTERNAL_ERROR', 500);
  }
}
