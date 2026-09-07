import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getDailyDateString, generateDailyQR } from '@/lib/attendance/daily-qr';
import { toThaiDate } from '@/lib/utils/date';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const dateStr = dateParam || getDailyDateString(new Date());

    // Host detection for QR URL
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '127.0.0.1:3003';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;

    const qrInfo = await generateDailyQR(dateStr, baseUrl);

    // Get live stats for today
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
    
    // Total approved placements covering this date
    const activePlacementsCount = await prisma.placement.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    // Attendance records for this date
    const attendances = await prisma.attendance.findMany({
      where: {
        date: targetDate,
      },
    });

    const checkedInCount = attendances.filter((a) => Boolean(a.checkIn)).length;
    const checkedOutCount = attendances.filter((a) => Boolean(a.checkOut)).length;

    return successResponse({
      ...qrInfo,
      thaiDate: toThaiDate(targetDate, 'long'),
      stats: {
        activeStudents: activePlacementsCount,
        checkedIn: checkedInCount,
        checkedOut: checkedOutCount,
        pendingCheckIn: Math.max(0, activePlacementsCount - checkedInCount),
      },
    });
  } catch (error: any) {
    console.error('daily-qr error:', error);
    return errorResponse(error.message || 'ไม่สามารถสร้าง QR Code ประจำวันได้', 'QR_ERROR', 500);
  }
}
