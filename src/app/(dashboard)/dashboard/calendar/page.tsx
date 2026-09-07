'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { toThaiDate, toThaiDateRange } from '@/lib/utils/date';

export default function CalendarPage() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // Month navigation (e.g. October 2026 - start of Thai FY 2569)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026

  useEffect(() => {
    fetch('/api/placements').then((r) => r.json()).then((d) => setPlacements(d.data || []));
    fetch('/api/quotas').then((r) => r.json()).then((d) => setQuotas(d.data || []));
    fetch('/api/departments').then((r) => r.json()).then((d) => setDepartments(d.data || []));
  }, []);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const thaiMonthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const currentMonthName = thaiMonthNames[currentDate.getMonth()];
  const currentBuddhistYear = currentDate.getFullYear() + 543;

  // Days in month calculation
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const filteredPlacements = placements.filter((p) => {
    return !selectedDept || p.departmentId === selectedDept;
  });

  const showPlacementDetails = (p: any) => {
    Swal.fire({
      title: `${p.student.prefix} ${p.student.firstName} ${p.student.lastName}`,
      html: `
        <div class="text-left text-xs space-y-2">
          <p><strong>รหัสนักศึกษา:</strong> ${p.student.studentCode}</p>
          <p><strong>สถาบัน:</strong> ${p.student.institution.nameThai}</p>
          <p><strong>กลุ่มงาน:</strong> ${p.department.nameThai}</p>
          <p><strong>อาจารย์พี่เลี้ยง:</strong> ${p.preceptor?.name || 'ยังไม่ได้มอบหมาย'}</p>
          <p><strong>ช่วงเวลาการฝึก:</strong> ${toThaiDateRange(p.startDate, p.endDate)}</p>
          <p><strong>สถานะ:</strong> ${p.status}</p>
        </div>
      `,
      confirmButtonColor: '#0284c7',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-sky-600" />
            <span>ปฏิทินการฝึกอบรม (Training Calendar)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ตารางการฝึกปฏิบัติงานของนักศึกษาทุกกลุ่มงาน จำแนกตามช่วงเวลาและสาขาวิชาชีพ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายการทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-extrabold text-slate-900">
            {currentMonthName} พ.ศ. {currentBuddhistYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-white"
          >
            <option value="">ทุกกลุ่มงาน/แผนก</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameThai}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'month' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase">
            <div>อา.</div>
            <div>จ.</div>
            <div>อ.</div>
            <div>พ.</div>
            <div>พฤ.</div>
            <div>ศ.</div>
            <div>ส.</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-slate-50/50 rounded-xl"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);

              // Find placements on this day
              const dayPlacements = filteredPlacements.filter((p) => {
                const s = new Date(p.startDate);
                const e = new Date(p.endDate);
                return dateObj >= s && dateObj <= e;
              });

              return (
                <div
                  key={dayNum}
                  className="min-h-24 p-2 bg-slate-50 border border-slate-200/70 rounded-xl flex flex-col justify-between hover:border-sky-300 transition-colors"
                >
                  <div className="font-bold text-xs text-slate-700">{dayNum}</div>
                  <div className="space-y-1 mt-1">
                    {dayPlacements.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => showPlacementDetails(p)}
                        className="text-[10px] font-semibold p-1 rounded-md bg-sky-100 text-sky-900 truncate cursor-pointer hover:bg-sky-200 transition-colors"
                        title={`${p.student.firstName} - ${p.department.nameThai}`}
                      >
                        {p.student.firstName} ({p.department.nameThai.replace('กลุ่มงาน', '')})
                      </div>
                    ))}
                    {dayPlacements.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-bold text-center">
                        +{dayPlacements.length - 2} อื่นๆ
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-5 py-3">นักศึกษา</th>
                <th className="px-5 py-3">สถาบัน</th>
                <th className="px-5 py-3">กลุ่มงาน</th>
                <th className="px-5 py-3">อาจารย์พี่เลี้ยง</th>
                <th className="px-5 py-3">ช่วงเวลา</th>
                <th className="px-5 py-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPlacements.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => showPlacementDetails(p)}>
                  <td className="px-5 py-3 font-bold text-slate-900">
                    {p.student.prefix} {p.student.firstName} {p.student.lastName}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.student.institution.nameThai}</td>
                  <td className="px-5 py-3 font-semibold text-sky-800">{p.department.nameThai}</td>
                  <td className="px-5 py-3 text-slate-700">{p.preceptor?.name || '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{toThaiDateRange(p.startDate, p.endDate)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
