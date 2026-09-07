import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;

  const doc = await prisma.documentVerification.findUnique({
    where: { verificationCode: code },
  });

  if (!doc) {
    return errorResponse('ไม่พบเอกสารตามรหัสตรวจสอบนี้ หรือเอกสารอาจไม่ถูกต้อง', 'NOT_FOUND', 404);
  }

  // Strictly expose only non-PII verification metadata
  return successResponse({
    verificationCode: doc.verificationCode,
    documentNo: doc.documentNo,
    documentType: doc.documentType,
    title: doc.title,
    hospitalName: doc.hospitalName,
    issueDate: doc.issueDate,
    validUntil: doc.validUntil,
    isValid: !doc.validUntil || new Date(doc.validUntil) > new Date(),
  });
}
