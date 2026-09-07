'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Users2, Plus, Search, Phone, Mail, Building2, UserCheck, Award } from 'lucide-react';

export default function PreceptorsPage() {
  const [preceptors, setPreceptors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    employeeCode: '',
    name: '',
    profession: '',
    departmentId: '',
    phone: '',
    email: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPr, resD] = await Promise.all([
        fetch('/api/preceptors'),
        fetch('/api/departments'),
      ]);
      const dataPr = await resPr.json();
      const dataD = await resD.json();
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/preceptors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'เพิ่มอาจารย์พี่เลี้ยงสำเร็จ', timer: 1200, showConfirmButton: false });
        setShowModal(false);
        fetchData();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถเพิ่มได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  const filtered = preceptors.filter((pr) => {
    return (
      pr.name.toLowerCase().includes(search.toLowerCase()) ||
      pr.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      pr.profession.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users2 className="w-7 h-7 text-sky-600" />
            <span>อาจารย์ผู้ควบคุมและพี่เลี้ยงทางคลินิก (Clinical Preceptors)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ทะเบียนอาจารย์พี่เลี้ยงประจำกลุ่มงาน ผู้รับผิดชอบดูแลและประเมินผลนักศึกษาฝึกงาน
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มอาจารย์พี่เลี้ยง</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่ออาจารย์พี่เลี้ยง, รหัสพนักงาน, วิชาชีพ..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            กำลังโหลดข้อมูลอาจารย์พี่เลี้ยง...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            ไม่พบข้อมูลอาจารย์พี่เลี้ยงตามคำค้นหา
          </div>
        ) : (
          filtered.map((pr) => (
            <div
              key={pr.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    {pr.employeeCode}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ปฏิบัติหน้าที่
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{pr.name}</h3>
                <p className="text-xs font-semibold text-sky-700 mb-3">{pr.profession}</p>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 space-y-1">
                  <div className="font-semibold text-slate-800">{pr.department.nameThai}</div>
                  {pr.phone && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{pr.phone}</span>
                    </div>
                  )}
                  {pr.email && (
                    <div className="flex items-center gap-1.5 text-slate-500 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{pr.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>ดูแลแล้ว: {pr._count?.placements || 0} คน</span>
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>ประเมินแล้ว: {pr._count?.evaluations || 0} ครั้ง</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Preceptor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-sky-600" />
              <span>เพิ่มอาจารย์พี่เลี้ยงประจำกลุ่มงาน</span>
            </h2>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสพนักงาน/บุคลากร *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น EMP-PHARM-02"
                  value={form.employeeCode}
                  onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ภญ. สุจิตรา รักษ์ไทย"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ตำแหน่งวิชาชีพ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เภสัชกรชำนาญการ"
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">กลุ่มงานที่สังกัด *</label>
                <select
                  required
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- เลือกกลุ่มงาน --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameThai}
                    </option>
                  ))}
                </select>
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
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
