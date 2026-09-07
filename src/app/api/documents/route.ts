import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { saveUploadedFile } from '@/lib/security/file-storage';
import { DocumentType } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');
  const studentId = searchParams.get('studentId');

  const whereClause: any = {};
  if (requestId) whereClause.requestId = requestId;
  if (studentId) whereClause.studentId = studentId;

  const docs = await prisma.document.findMany({
    where: whereClause,
    include: {
      request: true,
      student: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(docs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || 'เอกสารแนบ';
    const documentType = (formData.get('documentType') as DocumentType) || 'REQUEST_LETTER';
    const requestId = formData.get('requestId') as string | null;
    const studentId = formData.get('studentId') as string | null;

    if (!file) {
      return errorResponse('กรุณาแนบไฟล์ที่ต้องการอัปโหลด', 'NO_FILE', 400);
    }

    const saved = await saveUploadedFile(file, 'documents');

    const doc = await prisma.document.create({
      data: {
        title,
        documentType,
        fileUrl: saved.fileUrl,
        fileName: saved.fileName,
        originalFileName: saved.originalFileName,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        requestId: requestId || null,
        studentId: studentId || null,
        uploadedBy: session.name,
      },
    });

    return successResponse(doc, 201);
  } catch (error: any) {
    console.error('File upload failed:', error);
    return errorResponse(error?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 'UPLOAD_ERROR', 400);
  }
}
