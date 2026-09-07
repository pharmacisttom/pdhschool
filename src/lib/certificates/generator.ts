import QRCode from 'qrcode';
import { toThaiDate } from '@/lib/utils/date';

export interface CertificateData {
  verificationCode: string;
  documentNo: string;
  issueDate: Date;
  student: {
    id: string;
    studentCode: string;
    prefix: string;
    firstName: string;
    lastName: string;
    fullName: string;
    faculty?: string | null;
    program?: string | null;
    institutionName: string;
  };
  department: {
    id: string;
    nameThai: string;
    code: string;
  };
  placement: {
    id: string;
    startDate: Date;
    endDate: Date;
    thaiStartDate: string;
    thaiEndDate: string;
    totalDays: number;
    totalHours: number;
  };
  evaluation?: {
    grade?: string | null;
    totalScore?: number | null;
    percentageScore?: number | null;
  } | null;
  signers: {
    director: {
      name: string;
      position: string;
      title: string;
    };
    preceptor: {
      name: string;
      position: string;
      title: string;
    };
  };
  qrCodeDataUrl?: string;
}

/**
 * Generate a unique verification code for certificates: CERT-PDH-2569-XXXXXX
 */
export function generateCertificateCode(): string {
  const currentThaiYear = new Date().getFullYear() + 543;
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-PDH-${currentThaiYear}-${randomSuffix}`;
}

/**
 * Generate an official document number: รบ 0032.201/ว XXX/2569
 */
export function generateCertificateDocumentNo(sequence: number): string {
  const currentThaiYear = new Date().getFullYear() + 543;
  const seqStr = String(sequence).padStart(3, '0');
  return `รบ 0032.201/ว ${seqStr}/${currentThaiYear}`;
}

/**
 * Generate QR code data URL for verification
 */
export async function generateVerificationQR(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: '#0f766e', // Teal color matching Pluakdaeng brand
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}
