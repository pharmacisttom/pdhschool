'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Layers, Plus, Search, Building2, Phone, Mail, Users, CheckCircle2 } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filtered = departments.filter((d) => {
    return (
      d.nameThai.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.contactPerson && d.contactPerson.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-sky-600" />
            <span>กลุ่มงานและแผนกรับฝึกอบรม (Hospital Departments)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            โครงสร้างกลุ่มงานทางการแพทย์และสายสนับสนุน โรงพยาบาลปลวกแดง พร้อมจำนวนโควต้ามาตรฐาน
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อกลุ่มงาน, รหัสกลุ่มงาน, ผู้รับผิดชอบ..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 text-center py-12 text-slate-400 text-xs">
            กำลังโหลดข้อมูลกลุ่มงาน...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-4 text-center py-12 text-slate-400 text-xs">
            ไม่พบกลุ่มงานตามคำค้นหา
          </div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    {d.code}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    โควต้ามาตรฐาน: {d.defaultQuota} คน
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1">{d.nameThai}</h3>
                {d.nameEnglish && (
                  <p className="text-[11px] text-slate-400 mb-3 font-medium truncate">{d.nameEnglish}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                {d.contactPerson && (
                  <div className="font-semibold text-slate-700 truncate">
                    {d.contactPerson}
                  </div>
                )}
                {d.phone && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{d.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>นักศึกษาในสังกัด: {d._count?.students || 0} คน</span>
                  <span>พี่เลี้ยง: {d._count?.preceptors || 0} คน</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
