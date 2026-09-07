'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Building2, Search, Plus, CheckCircle2, XCircle, Phone, Mail, MapPin } from 'lucide-react';
import { InstitutionStatus } from '@prisma/client';

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/institutions');
      const data = await res.json();
      if (data.success) {
        setInstitutions(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const filtered = institutions.filter((inst) => {
    return (
      inst.nameThai.toLowerCase().includes(search.toLowerCase()) ||
      inst.code.toLowerCase().includes(search.toLowerCase()) ||
      inst.coordinatorName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-sky-600" />
            <span>สถาบันการศึกษาคู่ความร่วมมือ (Educational Institutions)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ทะเบียนมหาวิทยาลัย วิทยาลัย และสถาบันการศึกษาที่ส่งนักศึกษาฝึกอบรม ณ โรงพยาบาลปลวกแดง
          </p>
        </div>

        <LinkInstitutionsAction onCreated={fetchInstitutions} />
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อสถาบัน, รหัสสถาบัน, ผู้ประสานงาน..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            กำลังโหลดข้อมูลสถาบันการศึกษา...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            ไม่พบสถาบันการศึกษาตามเงื่อนไข
          </div>
        ) : (
          filtered.map((inst) => (
            <div
              key={inst.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {inst.code}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      inst.status === InstitutionStatus.ACTIVE
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {inst.status === InstitutionStatus.ACTIVE ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{inst.nameThai}</h3>
                {inst.nameEnglish && (
                  <p className="text-xs text-slate-400 mb-2 font-medium">{inst.nameEnglish}</p>
                )}

                <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl space-y-1">
                  <div><strong>ประเภท:</strong> {inst.type}</div>
                  {inst.faculty && <div><strong>คณะ/สาขา:</strong> {inst.faculty}</div>}
                  <div className="flex items-center gap-1.5 text-slate-600 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inst.province || 'ไม่ระบุจังหวัด'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800">
                  ผู้ประสานงาน: {inst.coordinatorName}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{inst.coordinatorPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-700 truncate">
                  <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">{inst.coordinatorEmail}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LinkInstitutionsAction({ onCreated }: { onCreated: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    nameThai: '',
    nameEnglish: '',
    type: 'มหาวิทยาลัยรัฐ',
    faculty: '',
    province: 'ระยอง',
    coordinatorName: '',
    coordinatorPhone: '',
    coordinatorEmail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'เพิ่มสถาบันสำเร็จ', timer: 1500, showConfirmButton: false });
        setShowModal(false);
        onCreated();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถเพิ่มได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>เพิ่มสถาบันการศึกษา</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <span>เพิ่มสถาบันการศึกษา</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสสถาบัน (เช่น INST-KU) *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อสถาบันการศึกษา *</label>
                <input
                  type="text"
                  required
                  value={form.nameThai}
                  onChange={(e) => setForm({ ...form, nameThai: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อผู้ประสานงาน *</label>
                <input
                  type="text"
                  required
                  value={form.coordinatorName}
                  onChange={(e) => setForm({ ...form, coordinatorName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    required
                    value={form.coordinatorPhone}
                    onChange={(e) => setForm({ ...form, coordinatorPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมล *</label>
                  <input
                    type="email"
                    required
                    value={form.coordinatorEmail}
                    onChange={(e) => setForm({ ...form, coordinatorEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
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
                  บันทึกสถาบัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
