'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Users2, Plus, Search, ShieldCheck, UserPlus, Lock } from 'lucide-react';
import { ROLE_LABELS_TH } from '@/lib/utils/formatters';
import { toThaiDateTime } from '@/lib/utils/date';
import { RoleType } from '@prisma/client';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<{
    username: string;
    password: string;
    name: string;
    email: string;
    role: RoleType;
    departmentId: string;
    institutionId: string;
  }>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: RoleType.VIEWER,
    departmentId: '',
    institutionId: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetch('/api/departments').then((r) => r.json()).then((d) => setDepartments(d.data || []));
    fetch('/api/institutions').then((r) => r.json()).then((d) => setInstitutions(d.data || []));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'สร้างผู้ใช้งานสำเร็จ', timer: 1200, showConfirmButton: false });
        setShowModal(false);
        fetchUsers();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้างได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  const filtered = users.filter((u) => {
    return (
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-sky-600" />
            <span>จัดการผู้ใช้งานและสิทธิ์ (User Accounts & RBAC)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            กำหนดบทบาทและสิทธิ์การใช้งานทั้ง 6 บทบาทสำหรับเจ้าหน้าที่โรงพยาบาลและสถาบันการศึกษา
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-นามสกุล, อีเมล..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">ชื่อผู้ใช้งาน (Username)</th>
                <th className="px-5 py-3.5">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3.5">อีเมล</th>
                <th className="px-5 py-3.5">บทบาท (Role)</th>
                <th className="px-5 py-3.5">สังกัดกลุ่มงาน/สถาบัน</th>
                <th className="px-5 py-3.5">เข้าสู่ระบบล่าสุด</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลผู้ใช้งาน...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบผู้ใช้งานตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-bold font-mono text-sky-800">
                      {u.username}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        {ROLE_LABELS_TH[u.role as RoleType] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {u.department?.nameThai || u.institution?.nameThai || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {toThaiDateTime(u.lastLoginAt)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ใช้งานปกติ
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-600" />
              <span>เพิ่มบัญชีผู้ใช้งานใหม่</span>
            </h2>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อผู้ใช้งาน (Username) *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">รหัสผ่านเริ่มต้น *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">อีเมล *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">บทบาท (Role) *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as RoleType })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {Object.entries(ROLE_LABELS_TH).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label} ({k})
                    </option>
                  ))}
                </select>
              </div>

              {form.role === RoleType.DEPARTMENT_ADMIN && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">กลุ่มงานที่ดูแล *</label>
                  <select
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
              )}

              {form.role === RoleType.INSTITUTION && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถาบันการศึกษา *</label>
                  <select
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
              )}

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
                  สร้างบัญชี
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
