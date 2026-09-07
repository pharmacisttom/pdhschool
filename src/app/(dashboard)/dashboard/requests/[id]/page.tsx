import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { toThaiDate, toThaiDateTime, toThaiDateRange } from '@/lib/utils/date';
import { REQUEST_STATUS_META, PLACEMENT_STATUS_META } from '@/lib/utils/formatters';
import {
  ArrowLeft,
  FileSpreadsheet,
  Building2,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { RequestStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function RequestDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getSession();

  const request = await prisma.trainingRequest.findUnique({
    where: { id },
    include: {
      institution: true,
      department: true,
      program: true,
      requestStudents: {
        include: {
          student: true,
        },
      },
      placements: {
        include: {
          preceptor: true,
        },
      },
      allocations: {
        include: {
          quotaPeriod: true,
        },
      },
      documents: true,
    },
  });

  if (!request) {
    notFound();
  }

  const statusMeta = REQUEST_STATUS_META[request.status as RequestStatus];

  // Workflow timeline steps definition
  const timelineSteps = [
    { key: 'SUBMITTED', title: 'ยื่นคำขอ', time: request.createdAt, done: true },
    {
      key: 'UNDER_REVIEW',
      title: 'ตรวจสอบเบื้องต้น',
      time: request.reviewedAt,
      done: !['DRAFT', 'SUBMITTED'].includes(request.status),
    },
    {
      key: 'WAITING_DEPARTMENT',
      title: 'กลุ่มงานพิจารณา',
      time: request.reviewedAt,
      done: [
        'WAITING_APPROVAL',
        'APPROVED',
        'PARTIALLY_APPROVED',
        'WAITLIST',
        'IN_TRAINING',
        'COMPLETED',
      ].includes(request.status),
    },
    {
      key: 'APPROVED',
      title: 'อนุมัติ/จัดสรรโควต้า',
      time: request.approvedAt,
      done: ['APPROVED', 'PARTIALLY_APPROVED', 'IN_TRAINING', 'COMPLETED'].includes(request.status),
    },
    {
      key: 'IN_TRAINING',
      title: 'ฝึกปฏิบัติงาน',
      time: null,
      done: ['IN_TRAINING', 'COMPLETED'].includes(request.status),
    },
    {
      key: 'COMPLETED',
      title: 'เสร็จสิ้นการฝึก',
      time: null,
      done: request.status === 'COMPLETED',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/requests"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {request.requestNo}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg} ${statusMeta.color}`}
              >
                {statusMeta.labelTh}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              ยื่นเมื่อ: {toThaiDateTime(request.createdAt)} • ปีการศึกษา {request.academicYear} (ภาคเรียนที่ {request.semester})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/documents?requestId=${request.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>ออกหนังสือ/พิมพ์</span>
          </Link>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-slate-900 text-sm mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>ลำดับขั้นตอนการพิจารณา (Status Timeline)</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
          {timelineSteps.map((step, idx) => (
            <div
              key={step.key}
              className={`p-3 rounded-xl border text-center relative ${
                step.done
                  ? 'bg-sky-50/70 border-sky-200 text-sky-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs font-bold ${
                  step.done ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                {step.done ? '✓' : idx + 1}
              </div>
              <div className="font-bold text-xs">{step.title}</div>
              {step.time && (
                <div className="text-[10px] text-slate-500 mt-1">{toThaiDate(step.time, 'short')}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Request Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>ข้อมูลสถาบันการศึกษาและผู้ประสานงาน</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">สถาบันการศึกษา:</span>
              <span className="font-bold text-slate-800">{request.institution.nameThai}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">ผู้ประสานงาน:</span>
              <span className="font-semibold text-slate-800">{request.coordinatorName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">เบอร์โทรศัพท์:</span>
              <span className="font-semibold text-slate-800">{request.coordinatorPhone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">อีเมลประสานงาน:</span>
              <span className="font-semibold text-sky-700">{request.coordinatorEmail}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>ข้อมูลกลุ่มงานและช่วงเวลาที่ขอฝึก</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">กลุ่มงานที่ขอฝึก:</span>
              <span className="font-bold text-slate-800">{request.department.nameThai}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">หลักสูตร/วิชาชีพ:</span>
              <span className="font-semibold text-sky-800">
                {request.program?.programName || 'สาขาวิชาชีพทั่วไป'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">ช่วงเวลาการฝึก:</span>
              <span className="font-semibold text-slate-800">
                {toThaiDateRange(request.requestedStartDate, request.requestedEndDate)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">จำนวนนักศึกษา:</span>
              <span className="font-bold text-slate-900">
                ขอ {request.requestedStudents} คน (อนุมัติ {request.approvedStudents} คน)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span>รายชื่อนักศึกษาในคำขอนี้ ({request.requestStudents.length} คน)</span>
          </h2>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="px-5 py-3">ลำดับ</th>
              <th className="px-5 py-3">รหัสนักศึกษา</th>
              <th className="px-5 py-3">ชื่อ - นามสกุล</th>
              <th className="px-5 py-3">ชั้นปี</th>
              <th className="px-5 py-3">เบอร์โทรศัพท์</th>
              <th className="px-5 py-3 text-center">สถานะการจัดสรร</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {request.requestStudents.map((rs, idx) => {
              const pMeta = PLACEMENT_STATUS_META[rs.allocatedStatus] || {
                labelTh: rs.allocatedStatus,
                color: 'text-slate-700',
                bg: 'bg-slate-100',
              };
              return (
                <tr key={rs.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-5 py-3 font-mono font-bold text-slate-800">
                    {rs.student.studentCode}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {rs.student.prefix} {rs.student.firstName} {rs.student.lastName}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{rs.student.yearLevel}</td>
                  <td className="px-5 py-3 text-slate-600">{rs.student.phone || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pMeta.bg} ${pMeta.color}`}
                    >
                      {pMeta.labelTh}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
