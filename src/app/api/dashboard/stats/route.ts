import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { PlacementStatus, RequestStatus, QuotaStatus } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  const academicYear = searchParams.get('academicYear') ? parseInt(searchParams.get('academicYear')!) : 2569;

  const whereStudent: any = {};
  const wherePlacement: any = {};
  const whereRequest: any = { academicYear };
  const whereQuota: any = { academicYear };

  if (departmentId) {
    whereStudent.departmentId = departmentId;
    wherePlacement.departmentId = departmentId;
    whereRequest.departmentId = departmentId;
    whereQuota.departmentId = departmentId;
  }

  // Institutional user scope
  if (session.role === 'INSTITUTION' && session.institutionId) {
    whereStudent.institutionId = session.institutionId;
    whereRequest.institutionId = session.institutionId;
  }

  // Department admin user scope
  if (session.role === 'DEPARTMENT_ADMIN' && session.departmentId) {
    whereStudent.departmentId = session.departmentId;
    wherePlacement.departmentId = session.departmentId;
    whereRequest.departmentId = session.departmentId;
    whereQuota.departmentId = session.departmentId;
  }

  // 1. KPI Cards
  const [
    totalStudentsThisYear,
    currentlyActiveCount,
    pendingRequestsCount,
    approvedRequestsCount,
    quotaPeriods,
    departmentsCount,
    institutionsCount,
    allPlacements,
    allRequests,
  ] = await Promise.all([
    prisma.student.count({ where: whereStudent }),
    prisma.placement.count({
      where: {
        ...wherePlacement,
        status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] },
      },
    }),
    prisma.trainingRequest.count({
      where: {
        ...whereRequest,
        status: { in: [RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW, RequestStatus.WAITING_DEPARTMENT, RequestStatus.WAITING_APPROVAL] },
      },
    }),
    prisma.trainingRequest.count({
      where: {
        ...whereRequest,
        status: { in: [RequestStatus.APPROVED, RequestStatus.PARTIALLY_APPROVED] },
      },
    }),
    prisma.quotaPeriod.findMany({
      where: whereQuota,
      include: {
        department: true,
        placements: { where: { status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] } } },
      },
    }),
    prisma.department.count({ where: { active: true } }),
    prisma.institution.count({ where: { status: 'ACTIVE' } }),
    prisma.placement.findMany({
      where: wherePlacement,
      include: {
        student: { include: { institution: true } },
        department: true,
      },
    }),
    prisma.trainingRequest.findMany({
      where: whereRequest,
      include: { department: true, institution: true, program: true },
    }),
  ]);

  // Calculate total remaining quota
  let totalMaxQuota = 0;
  let totalApprovedQuota = 0;
  quotaPeriods.forEach((q) => {
    totalMaxQuota += q.maxStudents;
    totalApprovedQuota += q.placements.length;
  });
  const remainingQuotaCount = Math.max(0, totalMaxQuota - totalApprovedQuota);

  // 2. Charts Data
  // Chart 1: Students by Month (Oct to Sep - Thai Fiscal Year)
  const monthNames = ['ต.ค.', 'พ.ย.', 'ธ.ค.', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'];
  const monthOrder = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8]; // 0-indexed JS month numbers
  const studentsByMonth = monthOrder.map((mIdx, i) => {
    const count = allPlacements.filter((p) => {
      const sMonth = new Date(p.startDate).getMonth();
      return sMonth === mIdx;
    }).length;
    return {
      month: monthNames[i],
      students: count,
    };
  });

  // Chart 2: Students by Department
  const deptCountMap: Record<string, number> = {};
  allPlacements.forEach((p) => {
    const deptName = p.department.nameThai.replace('กลุ่มงาน', '').replace('แผนก', '').trim();
    deptCountMap[deptName] = (deptCountMap[deptName] || 0) + 1;
  });
  const studentsByDepartment = Object.entries(deptCountMap).map(([name, count]) => ({
    name,
    count,
  })).slice(0, 8);

  // Chart 3: Students by Institution
  const instCountMap: Record<string, number> = {};
  allPlacements.forEach((p) => {
    const instName = p.student.institution.nameThai.replace('มหาวิทยาลัย', 'ม.').replace('วิทยาลัย', 'ว.');
    instCountMap[instName] = (instCountMap[instName] || 0) + 1;
  });
  const studentsByInstitution = Object.entries(instCountMap).map(([name, count]) => ({
    name,
    count,
  })).slice(0, 6);

  // Chart 4: Students by Profession/Program
  const progCountMap: Record<string, number> = {};
  allRequests.forEach((r) => {
    const progName = r.program?.profession || 'วิชาชีพสุขภาพ';
    progCountMap[progName] = (progCountMap[progName] || 0) + r.requestedStudents;
  });
  const studentsByProfession = Object.entries(progCountMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Chart 5: Quota Occupancy per Department
  const quotaOccupancy = quotaPeriods.slice(0, 6).map((q) => {
    const approved = q.placements.length;
    const remaining = Math.max(0, q.maxStudents - approved);
    return {
      name: q.department.nameThai.replace('กลุ่มงาน', '').replace('แผนก', '').trim(),
      approved,
      remaining,
      max: q.maxStudents,
    };
  });

  // Chart 6: Request Status Breakdown
  const statusCounts: Record<string, number> = {
    'อนุมัติแล้ว': 0,
    'รอพิจารณา': 0,
    'รอหน่วยงาน': 0,
    'รอคิวสำรอง': 0,
    'ไม่สามารถรับได้': 0,
  };
  allRequests.forEach((r) => {
    if (r.status === RequestStatus.APPROVED || r.status === RequestStatus.PARTIALLY_APPROVED) statusCounts['อนุมัติแล้ว']++;
    else if (r.status === RequestStatus.SUBMITTED || r.status === RequestStatus.UNDER_REVIEW) statusCounts['รอพิจารณา']++;
    else if (r.status === RequestStatus.WAITING_DEPARTMENT) statusCounts['รอหน่วยงาน']++;
    else if (r.status === RequestStatus.WAITLIST) statusCounts['รอคิวสำรอง']++;
    else if (r.status === RequestStatus.REJECTED) statusCounts['ไม่สามารถรับได้']++;
  });
  const requestStatusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return successResponse({
    kpis: {
      totalStudentsThisYear,
      currentlyActiveCount,
      pendingRequestsCount,
      approvedRequestsCount,
      remainingQuotaCount,
      totalMaxQuota,
      departmentsCount,
      institutionsCount,
    },
    charts: {
      studentsByMonth,
      studentsByDepartment,
      studentsByInstitution,
      studentsByProfession,
      quotaOccupancy,
      requestStatusData,
    },
  });
}
