'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Clock, Calendar, CheckCircle2, UserCheck, Search, Filter, Save } from 'lucide-react';
import { AttendanceStatus } from '@prisma/client';
import { toThaiDate } from '@/lib/utils/date';

const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  PRESENT: { label: 'มาปกติ', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  LATE: { label: 'มาสาย', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ABSENT: { label: 'ขาดงาน', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  LEAVE: { label: 'ลากิจ/ป่วย', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  OFFICIAL_LEAVE: { label: 'ลาราชการ/สถาบัน', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
};

export default function AttendancePage() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-10-01');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; checkIn: string; checkOut: string; note: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [resP, resA] = await Promise.all([
          fetch('/api/placements'),
          fetch(`/api/attendance?date=${selectedDate}`),
        ]);
        const dataP = await resP.json();
        const dataA = await resA.json();

        const activePlacements = dataP.data || [];
        setPlacements(activePlacements);

        const currentMap: Record<string, any> = {};
        (dataA.data || []).forEach((rec: any) => {
          currentMap[rec.placementId] = {
            status: rec.status,
            checkIn: rec.checkIn || '08:00',
            checkOut: rec.checkOut || '16:30',
            note: rec.note || '',
          };
        });

        // Fill defaults for active placements
        activePlacements.forEach((p: any) => {
          if (!currentMap[p.id]) {
            currentMap[p.id] = {
              status: AttendanceStatus.PRESENT,
              checkIn: '08:00',
              checkOut: '16:30',
              note: '',
            };
          }
        });

        setAttendanceMap(currentMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDate]);

  const updateRecord = (placementId: string, field: string, val: any) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [placementId]: {
        ...prev[placementId],
        [field]: val,
      },
    }));
  };

  const handleSaveAttendance = async (placementId: string) => {
    const item = attendanceMap[placementId];
    if (!item) return;

    try {
      setSaving(true);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId,
          date: selectedDate,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          status: item.status,
          note: item.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกเวลาสำเร็จ',
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-sky-600" />
            <span>ระบบบันทึกเวลาฝึกปฏิบัติงาน (Student Attendance)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            เช็คชื่อ ลงเวลาเข้า-ออกงาน และบันทึกประวัติการลาของนักศึกษาประจำวัน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="font-bold text-xs text-slate-700">
            วันที่บันทึก: {toThaiDate(selectedDate, 'long')} • มีนักศึกษาในระบบ {placements.length} คน
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-5 py-3.5">นักศึกษา</th>
                <th className="px-5 py-3.5">กลุ่มงาน</th>
                <th className="px-5 py-3.5">สถานะการมา</th>
                <th className="px-5 py-3.5">เวลาเข้า</th>
                <th className="px-5 py-3.5">เวลาออก</th>
                <th className="px-5 py-3.5">หมายเหตุ</th>
                <th className="px-5 py-3.5 text-right">บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลการลงเวลา...
                  </td>
                </tr>
              ) : placements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบนักศึกษาที่มีการจัดสรรในระบบ
                  </td>
                </tr>
              ) : (
                placements.map((p) => {
                  const record = attendanceMap[p.id] || {
                    status: AttendanceStatus.PRESENT,
                    checkIn: '08:00',
                    checkOut: '16:30',
                    note: '',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {p.student.prefix} {p.student.firstName} {p.student.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {p.student.studentCode} ({p.student.institution.nameThai})
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {p.department.nameThai}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={record.status}
                          onChange={(e) => updateRecord(p.id, 'status', e.target.value)}
                          className="py-1 px-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
                        >
                          {Object.entries(ATTENDANCE_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="time"
                          value={record.checkIn}
                          onChange={(e) => updateRecord(p.id, 'checkIn', e.target.value)}
                          className="p-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="time"
                          value={record.checkOut}
                          onChange={(e) => updateRecord(p.id, 'checkOut', e.target.value)}
                          className="p-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          placeholder="หมายเหตุเพิ่มเติม..."
                          value={record.note}
                          onChange={(e) => updateRecord(p.id, 'note', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleSaveAttendance(p.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>บันทึก</span>
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
