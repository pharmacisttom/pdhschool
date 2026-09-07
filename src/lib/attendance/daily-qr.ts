import crypto from 'crypto';
import QRCode from 'qrcode';

const SECRET_SALT = process.env.JWT_SECRET || 'pdhschool_attendance_daily_salt_2569';

/**
 * Get date string formatted as YYYY-MM-DD in Asia/Bangkok (UTC+7) timezone
 */
export function getDailyDateString(date: Date = new Date()): string {
  // Asia/Bangkok is UTC+7
  const bangkokTime = new Date(date.getTime() + (7 * 60 - date.getTimezoneOffset()) * 60000);
  const y = bangkokTime.getFullYear();
  const m = String(bangkokTime.getMonth() + 1).padStart(2, '0');
  const d = String(bangkokTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate a deterministic cryptographic HMAC-SHA256 token for a given day
 * This guarantees the QR code is dynamic and changes every day, preventing reusing previous days' codes.
 */
export function generateDailyToken(dateStr: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_SALT);
  hmac.update(`PDHSCHOOL_DAILY_ATTENDANCE_${dateStr}`);
  return hmac.digest('hex').substring(0, 16);
}

/**
 * Verify if the provided token matches the dynamic token for that date
 * and that date is today (or within acceptable timezone boundary)
 */
export function verifyDailyToken(dateStr: string, token: string): boolean {
  if (!dateStr || !token) return false;
  
  const expectedToken = generateDailyToken(dateStr);
  if (token !== expectedToken) return false;

  const todayStr = getDailyDateString(new Date());
  
  // Allow today and yesterday/tomorrow within 24-hr margin for midnight edge cases
  const targetTime = new Date(`${dateStr}T12:00:00Z`).getTime();
  const todayTime = new Date(`${todayStr}T12:00:00Z`).getTime();
  const diffHours = Math.abs(todayTime - targetTime) / (1000 * 60 * 60);

  return diffHours <= 36;
}

/**
 * Generate QR code data URL pointing to the student scan URL
 */
export async function generateDailyQR(dateStr?: string, baseUrl: string = ''): Promise<{
  dateStr: string;
  token: string;
  scanUrl: string;
  qrDataUrl: string;
}> {
  const date = dateStr || getDailyDateString(new Date());
  const token = generateDailyToken(date);

  const cleanBase = baseUrl.replace(/\/$/, '');
  const scanUrl = `${cleanBase}/attendance/scan?date=${date}&token=${token}`;

  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  return {
    dateStr: date,
    token,
    scanUrl,
    qrDataUrl,
  };
}
