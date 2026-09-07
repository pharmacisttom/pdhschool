import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import * as XLSX from 'xlsx';
import { PlacementStatus } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const institutionIdParam = formData.get('institutionId') as string | null;

    if (!file) {
      return errorResponse('กรุณาแนบไฟล์ Excel (.xlsx หรือ .xls)', 'NO_FILE', 400);
    }

    const institutionId = session.role === 'INSTITUTION' ? session.institutionId : institutionIdParam;
    if (!institutionId) {
      return errorResponse('กรุณาระบุสถาบันการศึกษา', 'MISSING_INSTITUTION', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (!rows || rows.length === 0) {
      return errorResponse('ไม่พบข้อมูลในไฟล์ Excel ที่อัปโหลด', 'EMPTY_FILE', 400);
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Support Thai and English column headers
      const studentCode = String(row['รหัสนักศึกษา'] || row['studentCode'] || row['รหัส'] || '').trim();
      const prefix = String(row['คำนำหน้า'] || row['prefix'] || 'นาย/นางสาว').trim();
      const firstName = String(row['ชื่อ'] || row['firstName'] || '').trim();
      const lastName = String(row['นามสกุล'] || row['lastName'] || '').trim();
      const faculty = String(row['คณะ'] || row['faculty'] || '').trim();
      const program = String(row['สาขาวิชา'] || row['program'] || '').trim();
      const yearLevel = parseInt(row['ชั้นปี'] || row['yearLevel'] || '4');
      const phone = String(row['เบอร์โทร'] || row['phone'] || '').trim();
      const email = String(row['อีเมล'] || row['email'] || '').trim();

      if (!studentCode || !firstName || !lastName) {
        errors.push(`แถวที่ ${i + 2}: ข้อมูลรหัสนักศึกษาหรือชื่อ-นามสกุลไม่ครบถ้วน`);
        continue;
      }

      await prisma.student.upsert({
        where: {
          institutionId_studentCode: {
            institutionId,
            studentCode,
          },
        },
        update: {
          prefix,
          firstName,
          lastName,
          faculty: faculty || undefined,
          program: program || undefined,
          yearLevel: isNaN(yearLevel) ? 4 : yearLevel,
          phone: phone || undefined,
          email: email || undefined,
        },
        create: {
          studentCode,
          prefix,
          firstName,
          lastName,
          institutionId,
          faculty: faculty || null,
          program: program || null,
          yearLevel: isNaN(yearLevel) ? 4 : yearLevel,
          phone: phone || null,
          email: email || null,
          placementStatus: PlacementStatus.PENDING,
        },
      });

      importedCount++;
    }

    return successResponse({
      importedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    console.error('Excel import failed:', error);
    return errorResponse('เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel', 'IMPORT_FAILED', 500);
  }
}
