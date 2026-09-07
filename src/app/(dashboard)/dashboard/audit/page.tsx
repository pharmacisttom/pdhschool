'use client';

import { useState, useEffect } from 'react';
import { History, Search, ShieldAlert, Filter, Terminal } from 'lucide-react';
import { toThaiDateTime } from '@/lib/utils/date';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLogs(d.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    return (
      l.username.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-sky-600" />
            <span>บันทึกประวัติการใช้งานระบบ (Immutable Audit Logs)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            เก็บบันทึกประวัติกิจกรรมสำคัญทั้งหมด การอนุมัติโควต้า และการเปลี่ยนแปลงสถานะคำขอเพื่อความโปร่งใส
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <span>ระบบป้องกันการแก้ไขย้อนหลัง (Immutable)</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาผู้กระทำ, การกระทำ (Action), หรือ Entity..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">วันและเวลา (Timestamp)</th>
                <th className="px-5 py-3.5">ผู้กระทำ (Actor)</th>
                <th className="px-5 py-3.5">การกระทำ (Action)</th>
                <th className="px-5 py-3.5">ข้อมูลเป้าหมาย (Entity)</th>
                <th className="px-5 py-3.5">รายละเอียดการเปลี่ยนแปลง (Diff)</th>
                <th className="px-5 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูล Audit Log...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบบันทึกการใช้งานตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap font-mono">
                      {toThaiDateTime(l.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{l.username}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-semibold">
                      {l.entity} {l.entityId ? `(#${l.entityId.slice(0, 8)})` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                      {l.newValue || l.oldValue || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      {l.ipAddress || '127.0.0.1'}
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
