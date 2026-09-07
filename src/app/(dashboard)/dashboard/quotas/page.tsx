'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  PieChart,
  Plus,
  Filter,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import { QUOTA_STATUS_META } from '@/lib/utils/formatters';
import { toThaiDateRange } from '@/lib/utils/date';
import { QuotaStatus } from '@prisma/client';

export default function QuotasPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    departmentId: '',
    programId: '',
    academicYear: '2569',
    term: '1',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    maxStudents: '6',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resQ, resD, resP, resMe] = await Promise.all([
        fetch('/api/quotas'),
        fetch('/api/departments'),
        fetch('/api/programs'),
        fetch('/api/auth/me'),
      ]);
      const dataQ = await resQ.json();
      const dataD = await resD.json();
      const dataP = await resP.json();
      const dataMe = await resMe.json();

      if (dataMe.success && dataMe.data?.user) {
        const u = dataMe.data.user;
        setCurrentUser(u);
        if (u.role === 'DEPARTMENT_ADMIN' && u.departmentId) {
          setSelectedDept(u.departmentId);
          setForm((prev) => ({ ...prev, departmentId: u.departmentId }));
        }
      }

      if (dataQ.success) setQuotas(dataQ.data || []);
      if (dataD.success) setDepartments(dataD.data || []);
      if (dataP.success) setPrograms(dataP.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/quotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'สร้างรอบโควต้าสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        fetchData();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้างได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  const filteredQuotas = quotas.filter((q) => {
    return !selectedDept || q.departmentId === selectedDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <PieChart className="w-7 h-7 text-sky-600" />
            <span>จัดการโควต้าการรับฝึกงาน (Quota Management Engine)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            กำหนดและควบคุมความจุในการรับนักศึกษาแต่ละกลุ่มงาน ป้องกันการรับเกิน (Overbooking Prevention)
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>กำหนดรอบโควต้าใหม่</span>
        </button>
      </div>

      {/* Role & Scope Indicator Banner */}
      {currentUser?.role === 'DEPARTMENT_ADMIN' && (
        <div className="bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 font-semibold">
            <Lock className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              มุมมองเฉพาะกลุ่มงาน: คุณมีสิทธิ์ตรวจสอบและเปิดรับโควต้าเฉพาะ <strong>{currentUser.departmentName}</strong> เท่านั้น
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-mono font-bold text-[11px] border border-teal-200">
            DEPARTMENT_ADMIN
          </span>
        </div>
      )}

      {['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(currentUser?.role) && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 font-semibold">
            <Unlock className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              มุมมองผู้ดูแลระบบส่วนกลาง (Central Admin): คุณสามารถตรวจสอบและปรับปรุงโควต้าได้ทุกกลุ่มงานทั่วทั้งโรงพยาบาล (16 กลุ่มงาน)
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-mono font-bold text-[11px] border border-sky-200">
            {currentUser?.role}
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        {currentUser?.role === 'DEPARTMENT_ADMIN' ? (
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50/80 px-3 py-2 rounded-xl border border-teal-200">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>กลุ่มงานของคุณ: {currentUser.departmentName}</span>
          </div>
        ) : (
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">ทุกกลุ่มงาน/แผนก (16 กลุ่มงาน)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameThai}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-slate-400">
          แสดง {filteredQuotas.length} รอบโควต้า
        </span>
      </div>

      {/* Quota Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            กำลังโหลดข้อมูลโควต้า...
          </div>
        ) : filteredQuotas.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            ไม่พบข้อมูลโควต้าตามเงื่อนไข
          </div>
        ) : (
          filteredQuotas.map((q) => {
            const meta = QUOTA_STATUS_META[q.status as QuotaStatus] || {
              labelTh: q.status,
              color: 'text-slate-700',
              bg: 'bg-slate-100',
            };

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{q.departmentName}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.bg} ${meta.color}`}
                    >
                      {meta.labelTh}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-sky-700 mb-1">{q.programName}</div>
                  <div className="text-xs text-slate-500 mb-3">
                    ปีการศึกษา {q.academicYear} • {q.term}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-4 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{toThaiDateRange(q.startDate, q.endDate)}</span>
                  </div>

                  {q.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 italic">
                      &quot;{q.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500">ความจุสูงสุด: {q.maxStudents}</span>
                    <span className="text-slate-500">อนุมัติแล้ว: {q.approvedCount}</span>
                    <span className="font-bold text-slate-900">ว่าง: {q.availableCount}</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        q.availableCount <= 0
                          ? 'bg-rose-500'
                          : q.availableCount <= 2
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${q.occupancyPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>ครองโควต้า {q.occupancyPercent}%</span>
                    <span className="text-sky-700 font-semibold">
                      จัดสรรแล้ว {q.placements?.length || 0} คน
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Quota Period */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-sky-600" />
              <span>กำหนดรอบโควต้าใหม่</span>
            </h2>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">กลุ่มงาน/แผนก *</label>
                {currentUser?.role === 'DEPARTMENT_ADMIN' ? (
                  <div className="p-2.5 rounded-xl border border-teal-300 bg-teal-50/80 text-teal-900 font-bold text-xs flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{currentUser.departmentName}</span>
                  </div>
                ) : (
                  <select
                    required
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- เลือกกลุ่มงาน (16 กลุ่มงาน) --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameThai}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หลักสูตร/วิชาชีพ (ถ้าเฉพาะเจาะจง)</label>
                <select
                  value={form.programId}
                  onChange={(e) => setForm({ ...form, programId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">ทุกสาขาวิชา</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.programName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ปีการศึกษา (พ.ศ.)</label>
                  <input
                    type="number"
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จำนวนรับสูงสุด (คน) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.maxStudents}
                    onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วันที่เริ่มต้น *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วันที่สิ้นสุด *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="เช่น ฝึกเฉพาะผลัดที่ 1 หรือรับเฉพาะนักศึกษาชั้นปีที่ 4-5"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-600/20"
                >
                  บันทึกโควต้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
