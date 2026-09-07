import { prisma } from '@/lib/db/prisma';
import { QuotaStatus, PlacementStatus, RequestStatus, Prisma } from '@prisma/client';

export interface QuotaCalculation {
  id: string;
  departmentId: string;
  departmentName: string;
  programId?: string | null;
  programName?: string | null;
  academicYear: number;
  term?: string | null;
  startDate: Date;
  endDate: Date;
  maxStudents: number;
  approvedCount: number;
  pendingCount: number;
  availableCount: number;
  occupancyPercent: number;
  status: QuotaStatus;
  notes?: string | null;
}

export function computeQuotaStatus(maxStudents: number, approvedCount: number, manualStatus: QuotaStatus): QuotaStatus {
  if (manualStatus === QuotaStatus.CLOSED) return QuotaStatus.CLOSED;
  const remaining = maxStudents - approvedCount;
  if (remaining <= 0) return QuotaStatus.FULL;
  const ratio = remaining / maxStudents;
  if (ratio <= 0.3) return QuotaStatus.LIMITED;
  return QuotaStatus.AVAILABLE;
}

export async function getQuotaPeriodWithMetrics(quotaPeriodId: string): Promise<QuotaCalculation | null> {
  const period = await prisma.quotaPeriod.findUnique({
    where: { id: quotaPeriodId },
    include: {
      department: true,
      program: true,
      placements: {
        where: {
          status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] },
        },
      },
      allocations: {
        include: {
          request: true,
        },
      },
    },
  });

  if (!period) return null;

  const approvedCount = period.placements.length;
  const availableCount = Math.max(0, period.maxStudents - approvedCount);
  const occupancyPercent = period.maxStudents > 0 ? Math.min(100, Math.round((approvedCount / period.maxStudents) * 100)) : 100;
  const computedStatus = computeQuotaStatus(period.maxStudents, approvedCount, period.status);

  // Pending count from active submitted requests
  const pendingRequests = await prisma.trainingRequest.findMany({
    where: {
      departmentId: period.departmentId,
      status: { in: [RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW, RequestStatus.WAITING_DEPARTMENT, RequestStatus.WAITING_APPROVAL] },
      requestedStartDate: { lte: period.endDate },
      requestedEndDate: { gte: period.startDate },
    },
    select: { requestedStudents: true },
  });
  const pendingCount = pendingRequests.reduce((sum, r) => sum + r.requestedStudents, 0);

  return {
    id: period.id,
    departmentId: period.departmentId,
    departmentName: period.department.nameThai,
    programId: period.programId,
    programName: period.program?.programName || 'ทุกสาขาวิชา',
    academicYear: period.academicYear,
    term: period.term,
    startDate: period.startDate,
    endDate: period.endDate,
    maxStudents: period.maxStudents,
    approvedCount,
    pendingCount,
    availableCount,
    occupancyPercent,
    status: computedStatus,
    notes: period.notes,
  };
}

export interface ApprovalPlacementInput {
  requestId: string;
  quotaPeriodId: string;
  approvedStudentIds: string[];
  waitlistStudentIds?: string[];
  approvedBy: string;
  notes?: string;
}

export async function approvePlacementsWithTransaction(input: ApprovalPlacementInput) {
  const { requestId, quotaPeriodId, approvedStudentIds, waitlistStudentIds = [], approvedBy, notes } = input;

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Fetch quota period
    const quota = await tx.quotaPeriod.findUnique({
      where: { id: quotaPeriodId },
      include: { department: true },
    });

    if (!quota) {
      throw new Error('QUOTA_NOT_FOUND: ไม่พบข้อมูลช่วงเวลาโควต้าที่ระบุ');
    }

    if (quota.status === QuotaStatus.CLOSED) {
      throw new Error('QUOTA_CLOSED: โควต้านี้ถูกปิดการรับสมัครแล้ว');
    }

    // 2. Count current approved placements inside transaction for strict race condition prevention
    const currentApprovedCount = await tx.placement.count({
      where: {
        quotaPeriodId: quota.id,
        status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] },
      },
    });

    const remainingSlots = quota.maxStudents - currentApprovedCount;

    if (approvedStudentIds.length > remainingSlots) {
      throw new Error(`QUOTA_FULL: ไม่สามารถอนุมัติได้เนื่องจากโควต้าเต็ม (ขออนุมัติ ${approvedStudentIds.length} ที่นั่ง แต่เหลือเพียง ${remainingSlots} ที่นั่ง)`);
    }

    // 3. Fetch request details
    const request = await tx.trainingRequest.findUnique({
      where: { id: requestId },
      include: { requestStudents: true },
    });

    if (!request) {
      throw new Error('REQUEST_NOT_FOUND: ไม่พบคำขอฝึกงานที่ระบุ');
    }

    // 4. Create/update Placements for approved students
    for (const studentId of approvedStudentIds) {
      // Upsert placement
      const existing = await tx.placement.findFirst({
        where: { studentId, requestId },
      });

      if (existing) {
        await tx.placement.update({
          where: { id: existing.id },
          data: {
            quotaPeriodId: quota.id,
            departmentId: quota.departmentId,
            status: PlacementStatus.APPROVED,
            approvedBy,
            approvedAt: new Date(),
            notes: notes || existing.notes,
            startDate: quota.startDate,
            endDate: quota.endDate,
          },
        });
      } else {
        await tx.placement.create({
          data: {
            studentId,
            requestId,
            departmentId: quota.departmentId,
            quotaPeriodId: quota.id,
            status: PlacementStatus.APPROVED,
            approvedBy,
            approvedAt: new Date(),
            notes,
            startDate: quota.startDate,
            endDate: quota.endDate,
          },
        });
      }

      // Update student profile placementStatus
      await tx.student.update({
        where: { id: studentId },
        data: {
          placementStatus: PlacementStatus.APPROVED,
          departmentId: quota.departmentId,
          startDate: quota.startDate,
          endDate: quota.endDate,
        },
      });

      // Update request-student linkage
      await tx.trainingRequestStudent.updateMany({
        where: { requestId, studentId },
        data: { allocatedStatus: PlacementStatus.APPROVED },
      });
    }

    // 5. Handle waitlist students if any
    for (const waitStudentId of waitlistStudentIds) {
      await tx.student.update({
        where: { id: waitStudentId },
        data: { placementStatus: PlacementStatus.WAITLIST },
      });

      await tx.trainingRequestStudent.updateMany({
        where: { requestId, studentId: waitStudentId },
        data: { allocatedStatus: PlacementStatus.WAITLIST },
      });
    }

    // 6. Record quota allocation entry
    await tx.quotaAllocation.create({
      data: {
        quotaPeriodId: quota.id,
        requestId: request.id,
        studentCount: approvedStudentIds.length,
        allocatedBy: approvedBy,
      },
    });

    // 7. Update request status
    const totalApprovedSoFar = approvedStudentIds.length;
    const isPartial = waitlistStudentIds.length > 0 || totalApprovedSoFar < request.requestedStudents;
    const newStatus = isPartial ? RequestStatus.PARTIALLY_APPROVED : RequestStatus.APPROVED;

    await tx.trainingRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        approvedStudents: totalApprovedSoFar,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // 8. Update QuotaPeriod status if now full
    const newTotalApproved = currentApprovedCount + approvedStudentIds.length;
    const newStatusBadge = computeQuotaStatus(quota.maxStudents, newTotalApproved, quota.status);
    if (newStatusBadge !== quota.status) {
      await tx.quotaPeriod.update({
        where: { id: quota.id },
        data: { status: newStatusBadge },
      });
    }

    // 9. Create immutable AuditLog
    await tx.auditLog.create({
      data: {
        username: approvedBy,
        action: isPartial ? 'PARTIAL_APPROVE_REQUEST' : 'APPROVE_REQUEST',
        entity: 'TrainingRequest',
        entityId: requestId,
        oldValue: `status: ${request.status}`,
        newValue: `status: ${newStatus}, approvedCount: ${totalApprovedSoFar}, quotaPeriod: ${quota.id}`,
      },
    });

    return {
      success: true,
      approvedCount: approvedStudentIds.length,
      waitlistCount: waitlistStudentIds.length,
      newStatus,
      remainingSlots: quota.maxStudents - newTotalApproved,
    };
  });
}
