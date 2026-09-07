import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  try {
    const body = await req.json();
    const {
      type = 'ACCEPTANCE', // ACCEPTANCE, REJECTION, CERTIFICATE, ROSTER
      requestId,
      studentId,
      customNote,
    } = body;

    const currentYear = new Date().getFullYear() + 543;
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const verificationCode = `VER-PDH-${currentYear}-${randomHex}`;

    let documentNo = `รย 0032.2/ว${Math.floor(1000 + Math.random() * 9000)}`;
    let docTypeThai = 'หนังสือตอบรับนักศึกษาเข้าฝึกปฏิบัติงาน';
    let docTitle = 'การรับนักศึกษาเข้าฝึกปฏิบัติงาน โรงพยาบาลปลวกแดง';

    let requestData: any = null;
    let studentData: any = null;

    if (requestId) {
      requestData = await prisma.trainingRequest.findUnique({
        where: { id: requestId },
        include: {
          institution: true,
          department: true,
          program: true,
          requestStudents: { include: { student: true } },
        },
      });
    }

    if (studentId) {
      studentData = await prisma.student.findUnique({
        where: { id: studentId },
        include: { institution: true, department: true },
      });
    }

    if (type === 'REJECTION') {
      docTypeThai = 'หนังสือแจ้งไม่สามารถรับนักศึกษาเข้าฝึกปฏิบัติงาน';
      docTitle = `แจ้งผลการพิจารณาคำขอฝึกปฏิบัติงาน (${requestData?.requestNo || '-'})`;
    } else if (type === 'CERTIFICATE') {
      docTypeThai = 'หนังสือรับรองการผ่านการฝึกปฏิบัติงาน';
      docTitle = `หนังสือรับรองการฝึกงาน ${studentData ? `${studentData.prefix} ${studentData.firstName} ${studentData.lastName}` : ''}`;
    }

    // Save verification entry
    const verification = await prisma.documentVerification.create({
      data: {
        verificationCode,
        documentNo,
        documentType: docTypeThai,
        hospitalName: 'โรงพยาบาลปลวกแดง จังหวัดระยอง',
        title: docTitle,
        issueDate: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
      },
    });

    // Generate QR Code data URL linking to public verification page
    const appUrl = process.env.APP_URL || 'https://school.pluakdaenghospital.cloud';
    const verifyUrl = `${appUrl}/verify/${verificationCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 160,
    });

    return successResponse({
      verificationCode,
      verifyUrl,
      qrCodeDataUrl,
      documentNo,
      documentType: docTypeThai,
      issueDate: verification.issueDate,
      hospitalName: verification.hospitalName,
      title: docTitle,
      request: requestData,
      student: studentData,
      customNote,
    });
  } catch (error) {
    console.error('Document generation failed:', error);
    return errorResponse('เกิดข้อผิดพลาดในการสร้างเอกสาร', 'GENERATE_FAILED', 500);
  }
}
