'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RotateCcw,
  BookOpen,
  Filter,
  GraduationCap,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Users,
  Calendar,
} from 'lucide-react';

interface ProgramItem {
  id: string;
  programCode: string;
  programName: string;
  profession: string;
  educationLevel: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    requests: number;
    quotas: number;
  };
}

const PRESET_EDUCATION_LEVELS = [
  'ปริญญาตรี',
  'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)',
  'ประกาศนียบัตรวิชาชีพ (ปวช.)',
  'ปริญญาโท',
  'ประกาศนียบัตรเฉพาะทาง',
];

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [submitting, setSubmitting] = useState(false);
  const [isCustomLevel, setIsCustomLevel] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    programCode: '',
    programName: '',
    profession: '',
    educationLevelPreset: 'ปริญญาตรี',
    educationLevelCustom: '',
    active: true,
  });

  const fetchProgramsAndUser = async () => {
    try {
      setLoading(true);
      const [resProg, resMe] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/auth/me'),
      ]);

      const dataProg = await resProg.json();
      const dataMe = await resMe.json();

      if (dataProg.success) {
        setPrograms(dataProg.data || []);
      }
      if (dataMe.success && dataMe.data?.user) {
        setCurrentUser(dataMe.data.user);
      }
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramsAndUser();
  }, []);

  const isAuthorized =
    currentUser && ['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(currentUser.role);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setIsCustomLevel(false);
    setFormData({
      id: '',
      programCode: '',
      programName: '',
      profession: '',
      educationLevelPreset: 'ปริญญาตรี',
      educationLevelCustom: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prog: ProgramItem) => {
    setModalMode('EDIT');
    const isPreset = PRESET_EDUCATION_LEVELS.includes(prog.educationLevel);
    setIsCustomLevel(!isPreset);
    setFormData({
      id: prog.id,
      programCode: prog.programCode,
      programName: prog.programName,
      profession: prog.profession,
      educationLevelPreset: isPreset ? prog.educationLevel : 'CUSTOM',
      educationLevelCustom: isPreset ? '' : prog.educationLevel,
      active: prog.active,
    });
    setIsModalOpen(true);
  };

  // Toggle Active Status directly from table
  const handleToggleActive = async (prog: ProgramItem) => {
    const nextStatus = !prog.active;
    const actionText = nextStatus ? 'เปิดรับฝึก' : 'ปิดรับฝึก';

    const confirm = await Swal.fire({
      title: `ยืนยัน${actionText}?`,
      text: `คุณต้องการปรับสถานะหลักสูตร "${prog.programName}" เป็น "${actionText}" หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nextStatus ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: `ยืนยัน${actionText}`,
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch('/api/programs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prog.id,
          active: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: `ปรับสถานะเป็น "${actionText}" สำเร็จ`,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchProgramsAndUser();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถเปลี่ยนสถานะได้',
          text: data.error?.message || 'เกิดข้อผิดพลาด',
        });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  // Delete Program
  const handleDelete = async (prog: ProgramItem) => {
    const reqCount = prog._count?.requests || 0;
    const quotaCount = prog._count?.quotas || 0;

    let warningText = `คุณต้องการลบหลักสูตร "${prog.programName}" (${prog.programCode}) ออกจากระบบหรือไม่?`;
    if (reqCount > 0 || quotaCount > 0) {
      warningText = `หลักสูตรนี้มีข้อมูลเกี่ยวข้องในระบบ (${reqCount} คำขอ, ${quotaCount} รอบโควต้า) ระบบจะทำการ "ปิดรับฝึก" อัตโนมัติเพื่อป้องกันข้อมูลสูญหาย`;
    }

    const confirm = await Swal.fire({
      title: 'ยืนยันการลบหลักสูตร?',
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/programs?id=${prog.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: data.data?.action === 'DEACTIVATED' ? 'ปรับเป็นปิดรับฝึกแล้ว' : 'ลบหลักสูตรสำเร็จ',
          text: data.data?.message || 'ดำเนินการเรียบร้อย',
        });
        fetchProgramsAndUser();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถลบได้',
          text: data.error?.message || 'เกิดข้อผิดพลาด',
        });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  // Submit Form (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalEducationLevel = isCustomLevel
      ? formData.educationLevelCustom.trim()
      : formData.educationLevelPreset;

    if (!formData.programCode.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณาระบุรหัสหลักสูตร' });
      return;
    }
    if (!formData.programName.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณาระบุชื่อหลักสูตร' });
      return;
    }
    if (!formData.profession.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณาระบุวิชาชีพเป้าหมาย' });
      return;
    }
    if (!finalEducationLevel) {
      Swal.fire({ icon: 'warning', title: 'กรุณากำหนดระดับการศึกษา' });
      return;
    }

    try {
      setSubmitting(true);
      const isCreate = modalMode === 'CREATE';
      const url = '/api/programs';
      const method = isCreate ? 'POST' : 'PUT';

      const payload: any = {
        programCode: formData.programCode.trim().toUpperCase(),
        programName: formData.programName.trim(),
        profession: formData.profession.trim(),
        educationLevel: finalEducationLevel,
        active: formData.active,
      };

      if (!isCreate) {
        payload.id = formData.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: isCreate ? 'เพิ่มหลักสูตรสำเร็จ' : 'แก้ไขหลักสูตรสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
        setIsModalOpen(false);
        fetchProgramsAndUser();
      } else {
        Swal.fire({
          icon: 'error',
          title: isCreate ? 'ไม่สามารถเพิ่มหลักสูตรได้' : 'ไม่สามารถแก้ไขได้',
          text: data.error?.message || 'เกิดข้อผิดพลาดในการบันทึก',
        });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Programs
  const filtered = programs.filter((p) => {
    const matchSearch =
      p.programName.toLowerCase().includes(search.toLowerCase()) ||
      p.programCode.toLowerCase().includes(search.toLowerCase()) ||
      p.profession.toLowerCase().includes(search.toLowerCase()) ||
      p.educationLevel.toLowerCase().includes(search.toLowerCase());

    const matchLevel =
      filterLevel === 'ALL' || p.educationLevel === filterLevel;

    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && p.active) ||
      (filterStatus === 'INACTIVE' && !p.active);

    return matchSearch && matchLevel && matchStatus;
  });

  // Calculate stats
  const totalCount = programs.length;
  const activeCount = programs.filter((p) => p.active).length;
  const inactiveCount = programs.filter((p) => !p.active).length;

  // Distinct education levels for filtering
  const existingLevels = Array.from(
    new Set([...PRESET_EDUCATION_LEVELS, ...programs.map((p) => p.educationLevel)])
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-sky-600" />
            <span>หลักสูตรและสาขาวิชาชีพ (Programs & Professions)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            กำหนดระดับการศึกษาและสาขาวิชาชีพที่เปิดรับฝึกปฏิบัติงาน (ปริญญาตรี, ปวส., ปวช. ฯลฯ) โรงพยาบาลปลวกแดง
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มหลักสูตรที่เปิดรับ</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              หลักสูตรทั้งหมด
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</div>
            <span className="text-[11px] text-slate-400">สาขาวิชาชีพในระบบ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              เปิดรับฝึกปฏิบัติงาน
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{activeCount}</div>
            <span className="text-[11px] text-slate-400">พร้อมรับคำขอฝึกงาน</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              ปิดรับฝึกชั่วคราว
            </span>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{inactiveCount}</div>
            <span className="text-[11px] text-slate-400">ปิดรับสมัครในขณะนี้</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="w-full md:flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหลักสูตร, รหัสหลักสูตร, วิชาชีพ หรือระดับการศึกษา..."
            className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Education Level Filter */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 hidden md:block" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full md:w-56 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="ALL">ทุกระดับการศึกษา (All Levels)</option>
            {existingLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-44 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="ALL">สถานะทั้งหมด (All)</option>
            <option value="ACTIVE">เปิดรับฝึกเท่านั้น</option>
            <option value="INACTIVE">ปิดรับฝึกเท่านั้น</option>
          </select>
        </div>

        {(search || filterLevel !== 'ALL' || filterStatus !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setFilterLevel('ALL');
              setFilterStatus('ALL');
            }}
            className="w-full md:w-auto text-xs text-sky-600 hover:text-sky-800 font-semibold px-2 py-1"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">รหัสหลักสูตร</th>
                <th className="px-5 py-3.5">ชื่อหลักสูตร / สาขาวิชา</th>
                <th className="px-5 py-3.5">วิชาชีพเป้าหมาย</th>
                <th className="px-5 py-3.5">ระดับกำหนด / ระดับการศึกษา</th>
                <th className="px-5 py-3.5 text-center">ประวัติคำขอ / โควต้า</th>
                <th className="px-5 py-3.5 text-center">สถานะรับฝึก</th>
                <th className="px-5 py-3.5 text-right">จัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโหลดข้อมูลหลักสูตร...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">ไม่พบหลักสูตรตามเงื่อนไขที่เลือก</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      สามารถคลิกปุ่ม &quot;+ เพิ่มหลักสูตรที่เปิดรับ&quot; ด้านบนเพื่อเพิ่มหลักสูตรใหม่ได้
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const reqCount = p._count?.requests || 0;
                  const quotaCount = p._count?.quotas || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code */}
                      <td className="px-5 py-3.5 font-mono font-bold text-sky-800">
                        <span className="px-2 py-1 rounded-md bg-sky-50 border border-sky-200">
                          {p.programCode}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{p.programName}</div>
                      </td>

                      {/* Profession */}
                      <td className="px-5 py-3.5 text-slate-700 font-semibold">
                        {p.profession}
                      </td>

                      {/* Education Level */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {p.educationLevel}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2 text-[11px] text-slate-600">
                          <span title="คำขอฝึกงาน" className="bg-slate-100 px-2 py-0.5 rounded-md">
                            {reqCount} คำขอ
                          </span>
                          <span title="รอบโควต้า" className="bg-slate-100 px-2 py-0.5 rounded-md">
                            {quotaCount} โควต้า
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            เปิดรับฝึก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            ปิดรับฝึก
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active Status */}
                          <button
                            onClick={() => handleToggleActive(p)}
                            title={p.active ? 'คลิกเพื่อปิดรับฝึก' : 'คลิกเพื่อเปิดรับฝึก'}
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              p.active
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="แก้ไขหลักสูตรและระดับการศึกษา"
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(p)}
                            title="ลบหลักสูตร"
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit Program */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {modalMode === 'CREATE' ? 'เพิ่มหลักสูตรที่เปิดรับฝึกใหม่' : 'แก้ไขหลักสูตรและระดับการศึกษา'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {modalMode === 'CREATE'
                      ? 'บันทึกข้อมูลหลักสูตรและกำหนดระดับการศึกษาที่เปิดรับ'
                      : `แก้ไขข้อมูลรหัส ${formData.programCode}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Program Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รหัสหลักสูตร (Program Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.programCode}
                  onChange={(e) =>
                    setFormData({ ...formData, programCode: e.target.value.toUpperCase() })
                  }
                  placeholder="เช่น PROG-EMT, PROG-DENT, PROG-PHARM"
                  className="w-full p-2.5 font-mono uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ระบุรหัสภาษาอังกฤษตัวพิมพ์ใหญ่ เช่น PROG-MED, PROG-NURSE
                </span>
              </div>

              {/* Program Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อหลักสูตร / สาขาวิชา <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                  placeholder="เช่น ปฏิบัติการฉุกเฉินการแพทย์, เภสัชศาสตรบัณฑิต, พยาบาลศาสตร์"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Target Profession */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  วิชาชีพเป้าหมาย (Profession) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="เช่น นักปฏิบัติการฉุกเฉินการแพทย์, เภสัชกร, พยาบาลวิชาชีพ"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Education Level (ระดับกำหนด) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-sky-600" />
                    <span>ระดับการศึกษาที่กำหนดรับ (Education Level)</span>
                    <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={isCustomLevel ? 'CUSTOM' : formData.educationLevelPreset}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomLevel(true);
                      } else {
                        setIsCustomLevel(false);
                        setFormData({
                          ...formData,
                          educationLevelPreset: e.target.value,
                          educationLevelCustom: '',
                        });
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    {PRESET_EDUCATION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                    <option value="CUSTOM">-- กำหนดเอง (พิมพ์ระบุเอง) --</option>
                  </select>

                  {isCustomLevel && (
                    <input
                      type="text"
                      required
                      value={formData.educationLevelCustom}
                      onChange={(e) =>
                        setFormData({ ...formData, educationLevelCustom: e.target.value })
                      }
                      placeholder="ระบุระดับการศึกษา เช่น ป.โท, ประกาศนียบัตร..."
                      className="w-full p-2.5 rounded-xl border border-sky-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  ระบบจะใช้ระดับการศึกษานี้ในการตรวจสอบและจับคู่คำขอฝึกงานจากสถาบันการศึกษา
                </p>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                <div>
                  <div className="font-bold text-slate-800">สถานะเปิดรับฝึกปฏิบัติงาน</div>
                  <div className="text-[11px] text-slate-400">
                    {formData.active
                      ? 'เปิดรับสถาบันการศึกษาและนักศึกษาเข้ามาฝึกงาน'
                      : 'ปิดรับชั่วคราว (จะไม่ปรากฏในตัวเลือกคำขอฝึกงานใหม่)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    formData.active ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      formData.active ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{modalMode === 'CREATE' ? 'บันทึกหลักสูตรใหม่' : 'บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
