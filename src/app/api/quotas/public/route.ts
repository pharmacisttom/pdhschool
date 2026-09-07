import { prisma } from '@/lib/db/prisma';
import { PlacementStatus } from '@prisma/client';
import { computeQuotaStatus } from '@/lib/quota/engine';
import { successResponse } from '@/lib/api-response';

export async function GET() {
  const quotas = await prisma.quotaPeriod.findMany({
    include: {
      department: {
        select: {
          id: true,
          nameThai: true,
          code: true,
        },
      },
      program: {
        select: {
          id: true,
          programName: true,
          profession: true,
        },
      },
      placements: {
        where: {
          status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] },
        },
        select: { id: true },
      },
    },
    orderBy: [{ academicYear: 'desc' }, { startDate: 'asc' }],
  });

  const publicData = quotas.map((q) => {
    const approvedCount = q.placements.length;
    const remainingCount = Math.max(0, q.maxStudents - approvedCount);
    const computedStatus = computeQuotaStatus(q.maxStudents, approvedCount, q.status);

    return {
      id: q.id,
      departmentName: q.department.nameThai,
      departmentCode: q.department.code,
      programName: q.program?.programName || 'ทุกสาขาวิชาชีพ',
      profession: q.program?.profession || 'วิชาชีพสุขภาพและสายสนับสนุน',
      academicYear: q.academicYear,
      term: q.term,
      startDate: q.startDate,
      endDate: q.endDate,
      maxStudents: q.maxStudents,
      approvedCount,
      remainingCount,
      status: computedStatus,
      notes: q.notes,
    };
  });

  return successResponse(publicData);
}
