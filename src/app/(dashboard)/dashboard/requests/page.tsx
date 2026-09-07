'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Users,
  ChevronRight,
} from 'lucide-react';
import { REQUEST_STATUS_META } from '@/lib/utils/formatters';
import { toThaiDate, toThaiDateRange } from '@/lib/utils/date';
import { RequestStatus } from '@prisma/client';

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [selectedQuotaId, setSelectedQuotaId] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotas = async () => {
    try {
      const res = await fetch('/api/quotas');
      const data = await res.json();
      if (data.success) {
        setQuotas(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchQuotas();
  }, []);

  const handleApprove = async (request: any) => {
    // Find matching quotas for this department
    const matchingQuotas = quotas.filter((q) => q.departmentId === request.departmentId && q.availableCount > 0);

    if (matchingQuotas.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีโควต้าว่าง',
        text: `กลุ่มงาน ${request.department.nameThai} ไม่มีรอบโควต้าที่เหลือที่นั่งว่างในขณะนี้ กรุณาเปิดโควต้าใหม่หรือปรับปรุงจำนวนรับ`,
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    const quotaOptionsHtml = matchingQuotas
      .map(
        (q) =>
          `<option value="${q.id}">รอบ ${toThaiDateRange(q.startDate, q.endDate)} (ว่าง ${q.availableCount}/${q.maxStudents} ที่นั่ง)</option>`
      )
      .join('');

    const studentCheckboxesHtml = request.requestStudents
      .map(
        (rs: any) =>
          `<label class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 text-left text-xs cursor-pointer">
            <input type="checkbox" name="student_ids" value="${rs.student.id}" checked class="w-4 h-4 text-sky-600 rounded">
            <span><strong>${rs.student.studentCode}</strong> ${rs.student.prefix} ${rs.student.firstName} ${rs.student.lastName}</span>
          </label>`
      )
      .join('');

    const { value: formValues } = await Swal.fire({
      title: 'อนุมัติคำขอฝึกปฏิบัติงาน',
      html: `
        <div class="text-left text-xs space-y-4">
          <p class="text-slate-600">คำขอเลขที่: <strong>${request.requestNo}</strong></p>
          <p class="text-slate-600">สถาบัน: <strong>${request.institution.nameThai}</strong></p>
          
          <div>
            <label class="block font-bold text-slate-700 mb-1">เลือกรอบโควต้าที่ต้องการจัดสรร:</label>
            <select id="swal_quota_select" class="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
              ${quotaOptionsHtml}
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">เลือกนักศึกษาที่อนุมัติ (${request.requestStudents.length} คน):</label>
            <div class="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
              ${studentCheckboxesHtml}
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการอนุมัติโควต้า',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      preConfirm: () => {
        const quotaSelect = document.getElementById('swal_quota_select') as HTMLSelectElement;
        const checkboxes = document.querySelectorAll('input[name="student_ids"]:checked') as NodeListOf<HTMLInputElement>;
        const studentIds = Array.from(checkboxes).map((cb) => cb.value);

        if (!quotaSelect.value) {
          Swal.showValidationMessage('กรุณาเลือกรอบโควต้า');
          return false;
        }
        if (studentIds.length === 0) {
          Swal.showValidationMessage('กรุณาเลือกนักศึกษาอย่างน้อย 1 คน');
          return false;
        }
        return {
          quotaPeriodId: quotaSelect.value,
          approvedStudentIds: studentIds,
        };
      },
    });

    if (formValues) {
      try {
        setApproving(true);
        const res = await fetch(`/api/requests/${request.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quotaPeriodId: formValues.quotaPeriodId,
            approvedStudentIds: formValues.approvedStudentIds,
          }),
        });

        const data = await res.json();

        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'อนุมัติเรียบร้อยแล้ว',
            text: `จัดสรรโควต้าสำเร็จ ${data.data?.approvedCount} คน พร้อมบันทึก Placement และ Audit Log`,
            confirmButtonColor: '#0284c7',
          });
          fetchRequests();
          fetchQuotas();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถอนุมัติได้',
            text: data.error?.message || 'เกิดข้อผิดพลาดในการตรวจสอบโควต้า',
            confirmButtonColor: '#0284c7',
          });
        }
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดเครือข่าย', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' });
      } finally {
        setApproving(false);
      }
    }
  };

  const handleReject = async (request: any) => {
    const { value: reason } = await Swal.fire({
      title: 'ปฏิเสธคำขอฝึกปฏิบัติงาน',
      input: 'textarea',
      inputLabel: 'ระบุเหตุผลที่ไม่สามารถรับนักศึกษาได้:',
      inputPlaceholder: 'เช่น โควต้าเต็มสำหรับช่วงเวลาดังกล่าว หรือไม่มีอาจารย์พี่เลี้ยงว่าง...',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันปฏิเสธคำขอ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        if (!value) return 'กรุณาระบุเหตุผลในการปฏิเสธ';
      },
    });

    if (reason) {
      try {
        const res = await fetch(`/api/requests/${request.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: RequestStatus.REJECTED, rejectionReason: reason }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'บันทึกสถานะเรียบร้อย', text: 'คำขอถูกเปลี่ยนเป็นไม่สามารถรับได้' });
          fetchRequests();
        }
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.requestNo.toLowerCase().includes(search.toLowerCase()) ||
      r.institution.nameThai.toLowerCase().includes(search.toLowerCase()) ||
      r.department.nameThai.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-sky-600" />
            <span>จัดการคำขอฝึกปฏิบัติงาน (Training Requests)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            พิจารณาและอนุมัติคำขอส่งนักศึกษาจากสถาบันการศึกษา พร้อมระบบตรวจสอบโควต้าแบบ Atomic
          </p>
        </div>

        <Link
          href="/dashboard/requests/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างคำขอใหม่</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามเลขที่คำขอ, สถาบันการศึกษา, กลุ่มงาน..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">ทุกสถานะคำขอ</option>
            {Object.entries(REQUEST_STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.labelTh}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">เลขที่คำขอ</th>
                <th className="px-5 py-3.5">สถาบันการศึกษา</th>
                <th className="px-5 py-3.5">กลุ่มงานที่ขอฝึก</th>
                <th className="px-5 py-3.5">ช่วงเวลาที่ขอ</th>
                <th className="px-5 py-3.5 text-center">จำนวน (ขอ/อนุมัติ)</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
                <th className="px-5 py-3.5 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลคำขอฝึกงาน...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบคำขอฝึกงานตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const statusMeta = REQUEST_STATUS_META[r.status as RequestStatus] || {
                    labelTh: r.status,
                    color: 'text-slate-700',
                    bg: 'bg-slate-100',
                  };

                  const canActOn = [
                    RequestStatus.SUBMITTED,
                    RequestStatus.UNDER_REVIEW,
                    RequestStatus.WAITING_DEPARTMENT,
                    RequestStatus.WAITING_APPROVAL,
                    RequestStatus.WAITLIST,
                  ].includes(r.status);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-sky-800 font-mono">
                        {r.requestNo}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{r.institution.nameThai}</div>
                        <div className="text-[11px] text-slate-400">{r.coordinatorName} ({r.coordinatorPhone})</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-800 font-semibold">{r.department.nameThai}</div>
                        <div className="text-[11px] text-sky-600">{r.program?.programName || 'สาขาวิชาชีพทั่วไป'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {toThaiDateRange(r.requestedStartDate, r.requestedEndDate)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-slate-800">{r.requestedStudents}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="font-bold text-emerald-600">{r.approvedStudents}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusMeta.bg} ${statusMeta.color}`}
                        >
                          {statusMeta.labelTh}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        {canActOn && (
                          <button
                            onClick={() => handleApprove(r)}
                            disabled={approving}
                            title="อนุมัติและจัดสรรโควต้า"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>อนุมัติ</span>
                          </button>
                        )}
                        {canActOn && (
                          <button
                            onClick={() => handleReject(r)}
                            title="ปฏิเสธคำขอ"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ปฏิเสธ</span>
                          </button>
                        )}
                        <Link
                          href={`/dashboard/requests/${r.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูรายละเอียด</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
