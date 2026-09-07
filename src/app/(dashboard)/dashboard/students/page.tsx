'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Building2,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { PLACEMENT_STATUS_META } from '@/lib/utils/formatters';
import { toThaiDate } from '@/lib/utils/date';
import { PlacementStatus } from '@prisma/client';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    studentCode: '',
    prefix: 'นาย',
    firstName: '',
    lastName: '',
    institutionId: '',
    faculty: '',
    program: '',
    yearLevel: 4,
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    departmentId: '',
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      if (selectedInst) params.set('institutionId', selectedInst);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data?.students || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/institutions').then((r) => r.json()).then((d) => setInstitutions(d.data || []));
    fetch('/api/departments').then((r) => r.json()).then((d) => setDepartments(d.data || []));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, selectedInst]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'เพิ่มนักศึกษาเรียบร้อย', timer: 1500, showConfirmButton: false });
        setShowAddModal(false);
        fetchStudents();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถเพิ่มได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ Excel (.xlsx)' });
      return;
    }
    if (!form.institutionId) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกสถาบันการศึกษา' });
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('institutionId', form.institutionId);

    try {
      setImporting(true);
      const res = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'นำเข้าข้อมูลสำเร็จ',
          text: `นำเข้านักศึกษาสำเร็จทั้งหมด ${data.data?.importedCount} รายการ`,
        });
        setShowImportModal(false);
        fetchStudents();
      } else {
        Swal.fire({ icon: 'error', title: 'นำเข้าไม่สำเร็จ', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-sky-600" />
            <span>ทะเบียนนักศึกษาฝึกงาน (Student Management)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ค้นหา ตรวจสอบสถานะการจัดสรรแหล่งฝึก นำเข้าและส่งออกข้อมูลนักศึกษาผ่าน Excel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/students/export"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </a>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4 text-sky-600" />
            <span>นำเข้า Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มนักศึกษา</span>
          </button>
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
            placeholder="ค้นหาตามรหัสนักศึกษา หรือชื่อ-นามสกุล..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedInst}
            onChange={(e) => setSelectedInst(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="">ทุกสถาบันการศึกษา</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nameThai}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="">ทุกสถานะการฝึก</option>
            {Object.entries(PLACEMENT_STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.labelTh}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">รหัสนักศึกษา</th>
                <th className="px-5 py-3.5">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3.5">สถาบันการศึกษา</th>
                <th className="px-5 py-3.5">กลุ่มงานที่ฝึก</th>
                <th className="px-5 py-3.5">เบอร์ติดต่อ</th>
                <th className="px-5 py-3.5">เลขบัตร (Masked)</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลนักศึกษา...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบข้อมูลนักศึกษาตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const meta = PLACEMENT_STATUS_META[s.placementStatus as PlacementStatus] || {
                    labelTh: s.placementStatus,
                    color: 'text-slate-700',
                    bg: 'bg-slate-100',
                  };

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-sky-800">
                        {s.studentCode}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {s.prefix} {s.firstName} {s.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ชั้นปีที่ {s.yearLevel} • {s.program || s.faculty || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{s.institution.nameThai}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {s.department?.nameThai || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div>{s.phone || '-'}</div>
                        <div className="text-[10px] text-slate-400">{s.email || '-'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        {s.nationalIdMasked || '1-XXXX-XXXXX-XX-X'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.color}`}
                        >
                          {meta.labelTh}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Manual Student Entry */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-sky-600" />
              <span>เพิ่มข้อมูลนักศึกษา</span>
            </h2>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">คำนำหน้า *</label>
                  <select
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ชื่อจริง *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสนักศึกษา *</label>
                  <input
                    type="text"
                    required
                    value={form.studentCode}
                    onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถาบันการศึกษา *</label>
                  <select
                    required
                    value={form.institutionId}
                    onChange={(e) => setForm({ ...form, institutionId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- เลือกสถาบัน --</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nameThai}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-600/20"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excel Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-600" />
              <span>นำเข้าข้อมูลนักศึกษาผ่าน Excel</span>
            </h2>

            <form onSubmit={handleImportExcel} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">เลือกสถาบันการศึกษา *</label>
                <select
                  required
                  value={form.institutionId}
                  onChange={(e) => setForm({ ...form, institutionId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- เลือกสถาบัน --</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nameThai}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">เลือกไฟล์ Excel (.xlsx, .xls) *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls"
                  required
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  หัวตารางที่รองรับ: รหัสนักศึกษา, คำนำหน้า, ชื่อ, นามสกุล, เบอร์โทร, อีเมล
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {importing ? 'กำลังนำเข้า...' : 'นำเข้าไฟล์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
