'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { UserCheck, Search, Filter, ShieldCheck, CheckCircle2, UserPlus } from 'lucide-react';
import { PLACEMENT_STATUS_META } from '@/lib/utils/formatters';
import { toThaiDateRange } from '@/lib/utils/date';
import { PlacementStatus } from '@prisma/client';

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [preceptors, setPreceptors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resP, resPr, resD] = await Promise.all([
        fetch('/api/placements'),
        fetch('/api/preceptors'),
        fetch('/api/departments'),
      ]);
      const dataP = await resP.json();
      const dataPr = await resPr.json();
      const dataD = await resD.json();

      if (dataP.success) setPlacements(dataP.data || []);
      if (dataPr.success) setPreceptors(dataPr.data || []);
      if (dataD.success) setDepartments(dataD.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignPreceptor = async (placement: any) => {
    // Filter preceptors for this department
    const deptPreceptors = preceptors.filter((pr) => pr.departmentId === placement.departmentId);

    const optionsHtml = deptPreceptors.length > 0
      ? deptPreceptors.map((pr) => `<option value="${pr.id}">${pr.name} (${pr.profession})</option>`).join('')
      : '<option value="">ไม่มีอาจารย์พี่เลี้ยงในกลุ่มงานนี้</option>';

    const { value: preceptorId } = await Swal.fire({
      title: 'มอบหมายอาจารย์พี่เลี้ยง',
      html: `
        <div class="text-left text-xs space-y-3">
          <p>นักศึกษา: <strong>${placement.student.prefix} ${placement.student.firstName} ${placement.student.lastName}</strong></p>
          <p>กลุ่มงาน: <strong>${placement.department.nameThai}</strong></p>
          <div>
            <label class="block font-bold text-slate-700 mb-1">เลือกอาจารย์พี่เลี้ยง:</label>
            <select id="swal_preceptor_select" class="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
              ${optionsHtml}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึกการมอบหมาย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#0284c7',
      preConfirm: () => {
        const select = document.getElementById('swal_preceptor_select') as HTMLSelectElement;
        return select.value;
      },
    });

    if (preceptorId) {
      try {
        const res = await fetch('/api/placements', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placementId: placement.id, preceptorId }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'มอบหมายพี่เลี้ยงสำเร็จ', timer: 1200, showConfirmButton: false });
          fetchData();
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถมอบหมายได้' });
      }
    }
  };

  const filtered = placements.filter((p) => {
    const matchSearch =
      p.student.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.student.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.student.studentCode.toLowerCase().includes(search.toLowerCase());
    const matchDept = !selectedDept || p.departmentId === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-sky-600" />
            <span>การจัดสรรแหล่งฝึกและพี่เลี้ยง (Placements & Supervision)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ติดตามสถานะการฝึกรายบุคคล มอบหมายอาจารย์พี่เลี้ยงประจำกลุ่มงาน และตรวจสอบวันเข้าฝึก
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อนักศึกษา หรือรหัส..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white"
        >
          <option value="">ทุกกลุ่มงาน/แผนก</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nameThai}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">นักศึกษา</th>
                <th className="px-5 py-3.5">สถาบันการศึกษา</th>
                <th className="px-5 py-3.5">กลุ่มงานที่ฝึก</th>
                <th className="px-5 py-3.5">ช่วงเวลาการฝึก</th>
                <th className="px-5 py-3.5">อาจารย์พี่เลี้ยง</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลการจัดสรร...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบข้อมูลการจัดสรรตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const meta = PLACEMENT_STATUS_META[p.status as PlacementStatus] || {
                    labelTh: p.status,
                    color: 'text-slate-700',
                    bg: 'bg-slate-100',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {p.student.prefix} {p.student.firstName} {p.student.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {p.student.studentCode}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.student.institution.nameThai}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {p.department.nameThai}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {toThaiDateRange(p.startDate, p.endDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.preceptor ? (
                          <div className="font-semibold text-sky-800">{p.preceptor.name}</div>
                        ) : (
                          <span className="text-amber-600 text-[11px] font-medium">
                            ยังไม่ได้มอบหมาย
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.color}`}
                        >
                          {meta.labelTh}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleAssignPreceptor(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold border border-sky-200 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>มอบหมายพี่เลี้ยง</span>
                        </button>
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
