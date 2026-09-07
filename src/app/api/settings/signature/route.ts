import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { saveUploadedFile } from '@/lib/security/file-storage';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'HOSPITAL_DIRECTOR_NAME',
            'HOSPITAL_DIRECTOR_POSITION',
            'HOSPITAL_DIRECTOR_SIGNATURE_URL',
            'HOSPITAL_DIRECTOR_SHOW_SIGNATURE',
          ],
        },
      },
    });

    const config: Record<string, string> = {
      HOSPITAL_DIRECTOR_NAME: 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง',
      HOSPITAL_DIRECTOR_POSITION: 'ผู้อำนวยการโรงพยาบาลปลวกแดง',
      HOSPITAL_DIRECTOR_SIGNATURE_URL: '/signatures/director_signature.svg',
      HOSPITAL_DIRECTOR_SHOW_SIGNATURE: 'true',
    };

    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    return successResponse({
      directorName: config.HOSPITAL_DIRECTOR_NAME,
      directorPosition: config.HOSPITAL_DIRECTOR_POSITION,
      signatureUrl: config.HOSPITAL_DIRECTOR_SIGNATURE_URL,
      showSignature: config.HOSPITAL_DIRECTOR_SHOW_SIGNATURE === 'true',
    });
  } catch (error: any) {
    console.error('Error fetching director signature setting:', error);
    return errorResponse('ไม่สามารถดึงข้อมูลลายเซ็นต์ผู้อำนวยการได้', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(session.role)) {
    return errorResponse('ไม่มีสิทธิ์แก้ไขลายเซ็นต์ผู้อำนวยการ', 'FORBIDDEN', 403);
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let signatureUrl = '';
    let directorName: string | undefined;
    let directorPosition: string | undefined;
    let showSignature: boolean | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      directorName = (formData.get('directorName') as string) || undefined;
      directorPosition = (formData.get('directorPosition') as string) || undefined;
      const showSigRaw = formData.get('showSignature');
      if (showSigRaw !== null) {
        showSignature = showSigRaw === 'true' || showSigRaw === '1';
      }

      if (file && file.size > 0) {
        // Validate MIME type is image
        const allowedImages = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
        if (!allowedImages.includes(file.type)) {
          return errorResponse('กรุณาอัปโหลดไฟล์ภาพลายเซ็นต์ (PNG, JPG, WebP หรือ SVG)', 'INVALID_IMAGE', 400);
        }

        const saved = await saveUploadedFile(file, 'signatures');
        signatureUrl = saved.fileUrl;
      }
    } else {
      const json = await req.json();
      signatureUrl = json.signatureUrl;
      directorName = json.directorName;
      directorPosition = json.directorPosition;
      showSignature = json.showSignature;
    }

    const updates: Promise<any>[] = [];

    if (signatureUrl) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: 'HOSPITAL_DIRECTOR_SIGNATURE_URL' },
          update: { value: signatureUrl },
          create: {
            key: 'HOSPITAL_DIRECTOR_SIGNATURE_URL',
            value: signatureUrl,
            description: 'URL ไฟล์ภาพลายเซ็นต์ผู้อำนวยการโรงพยาบาล',
            category: 'BRANDING',
          },
        })
      );
    }

    if (directorName !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: 'HOSPITAL_DIRECTOR_NAME' },
          update: { value: directorName.trim() },
          create: {
            key: 'HOSPITAL_DIRECTOR_NAME',
            value: directorName.trim(),
            description: 'ชื่อผู้อำนวยการโรงพยาบาล',
            category: 'BRANDING',
          },
        })
      );
    }

    if (directorPosition !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: 'HOSPITAL_DIRECTOR_POSITION' },
          update: { value: directorPosition.trim() },
          create: {
            key: 'HOSPITAL_DIRECTOR_POSITION',
            value: directorPosition.trim(),
            description: 'ตำแหน่งผู้อำนวยการโรงพยาบาล',
            category: 'BRANDING',
          },
        })
      );
    }

    if (showSignature !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: 'HOSPITAL_DIRECTOR_SHOW_SIGNATURE' },
          update: { value: showSignature ? 'true' : 'false' },
          create: {
            key: 'HOSPITAL_DIRECTOR_SHOW_SIGNATURE',
            value: showSignature ? 'true' : 'false',
            description: 'แสดงลายเซ็นต์ดิจิทัลในใบประกาศและเอกสารราชการ',
            category: 'BRANDING',
          },
        })
      );
    }

    await Promise.all(updates);

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'UPDATE_DIRECTOR_SIGNATURE',
      entity: 'SystemSetting',
      newValue: JSON.stringify({
        signatureUrl,
        directorName,
        directorPosition,
        showSignature,
      }),
    });

    return successResponse({
      message: 'บันทึกการตั้งค่าลายเซ็นต์ผู้อำนวยการโรงพยาบาลสำเร็จ',
      signatureUrl,
      directorName,
      directorPosition,
      showSignature,
    });
  } catch (error: any) {
    console.error('Error saving director signature:', error);
    return errorResponse(error.message || 'เกิดข้อผิดพลาดในการบันทึกภาพลายเซ็นต์', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return errorResponse('ไม่มีสิทธิ์ลบลายเซ็นต์', 'FORBIDDEN', 403);
  }

  try {
    await prisma.systemSetting.upsert({
      where: { key: 'HOSPITAL_DIRECTOR_SIGNATURE_URL' },
      update: { value: '' },
      create: {
        key: 'HOSPITAL_DIRECTOR_SIGNATURE_URL',
        value: '',
        description: 'URL ไฟล์ภาพลายเซ็นต์ผู้อำนวยการโรงพยาบาล',
        category: 'BRANDING',
      },
    });

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'DELETE_DIRECTOR_SIGNATURE',
      entity: 'SystemSetting',
    });

    return successResponse({ message: 'ลบภาพลายเซ็นต์ผู้อำนวยการเรียบร้อยแล้ว' });
  } catch (error: any) {
    console.error('Error deleting signature:', error);
    return errorResponse('เกิดข้อผิดพลาดในการลบลายเซ็นต์', 'INTERNAL_ERROR', 500);
  }
}
