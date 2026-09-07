'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Search, CheckCircle2 } from 'lucide-react';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/programs');
      const data = await res.json();
      if (data.success) {
        setPrograms(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const filtered = programs.filter((p) => {
    return (
      p.programName.toLowerCase().includes(search.toLowerCase()) ||
      p.programCode.toLowerCase().includes(search.toLowerCase()) ||
      p.profession.toLowerCase().includes(search.toLowerCase())
    );
  });

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
            สาขาวิชาชีพทางการแพทย์ สหวิชาชีพ และสายสนับสนุนที่เปิดรับฝึกปฏิบัติงาน
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
          placeholder="ค้นหาชื่อหลักสูตร, รหัสหลักสูตร, วิชาชีพ..."
          className="w-full text-xs focus:outline-none"
        />
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
                <th className="px-5 py-3.5">ระดับการศึกษา</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลหลักสูตร...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบหลักสูตรตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-sky-800">
                      {p.programCode}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{p.programName}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-semibold">{p.profession}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.educationLevel}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        เปิดรับฝึก
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
