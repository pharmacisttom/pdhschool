import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import * as XLSX from 'xlsx';
import { toThaiDate } from '@/lib/utils/date';
import { PLACEMENT_STATUS_META } from '@/lib/utils/formatters';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  const institutionId = searchParams.get('institutionId');

  const whereClause: any = {};
  if (departmentId) whereClause.departmentId = departmentId;
  if (institutionId) whereClause.institutionId = institutionId;
  if (session.role === 'INSTITUTION' && session.institutionId) {
    whereClause.institutionId = session.institutionId;
  }

  const students = await prisma.student.findMany({
    where: whereClause,
    include: {
      institution: true,
      department: true,
      placements: {
        include: { preceptor: true },
      },
    },
    orderBy: { studentCode: 'asc' },
  });

  const exportRows = students.map((s, index) => {
    const activePlacement = s.placements[0];
    const statusMeta = PLACEMENT_STATUS_META[s.placementStatus];

    return {
      'ลำดับ': index + 1,
      'รหัสนักศึกษา': s.studentCode,
      'คำนำหน้า': s.prefix,
      'ชื่อ': s.firstName,
      'นามสกุล': s.lastName,
      'สถาบันการศึกษา': s.institution.nameThai,
      'คณะ': s.faculty || '-',
      'สาขาวิชา': s.program || '-',
      'ชั้นปี': s.yearLevel,
      'เบอร์โทร': s.phone || '-',
      'อีเมล': s.email || '-',
      'กลุ่มงานที่ฝึก': s.department?.nameThai || '-',
      'อาจารย์พี่เลี้ยง': activePlacement?.preceptor?.name || '-',
      'วันที่เริ่มฝึก': toThaiDate(s.startDate, 'date-only'),
      'วันที่สิ้นสุด': toThaiDate(s.endDate, 'date-only'),
      'สถานะการฝึก': statusMeta ? statusMeta.labelTh : s.placementStatus,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อนักศึกษาฝึกงาน');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="students_pdhschool_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
