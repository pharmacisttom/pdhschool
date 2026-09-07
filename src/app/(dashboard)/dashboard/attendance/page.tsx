'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  Clock,
  Calendar,
  CheckCircle2,
  UserCheck,
  Search,
  Filter,
  Save,
  QrCode,
  Smartphone,
  ExternalLink,
  Printer,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AttendanceStatus } from '@prisma/client';
import { toThaiDate } from '@/lib/utils/date';

const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  PRESENT: { label: 'มาปกติ', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  LATE: { label: 'มาสาย', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ABSENT: { label: 'ขาดงาน', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  LEAVE: { label: 'ลากิจ/ป่วย', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  OFFICIAL_LEAVE: { label: 'ลาราชการ/สถาบัน', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
};

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AttendancePage() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [attendanceMap, setAttendanceMap] = useState<
    Record<
      string,
      {
        status: AttendanceStatus;
        checkIn: string;
        checkOut: string;
        note: string;
        recordedBy?: string;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const fetchPlacementsAndAttendance = async () => {
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
          checkIn: rec.checkIn || '',
          checkOut: rec.checkOut || '',
          note: rec.note || '',
          recordedBy: rec.recordedBy || '',
        };
      });

      // Fill defaults for active placements
      activePlacements.forEach((p: any) => {
        if (!currentMap[p.id]) {
          currentMap[p.id] = {
            status: AttendanceStatus.PRESENT,
            checkIn: '',
            checkOut: '',
            note: '',
            recordedBy: '',
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

  useEffect(() => {
    fetchPlacementsAndAttendance();
  }, [selectedDate]);

  const fetchDailyQR = async () => {
    setLoadingQr(true);
    try {
      const res = await fetch(`/api/attendance/daily-qr?date=${selectedDate}`);
      const json = await res.json();
      if (json.success) {
        setQrData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleOpenQrModal = () => {
    setShowQrModal(true);
    fetchDailyQR();
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-sky-600" />
            <span>ระบบลงเวลาฝึกปฏิบัติงานนักศึกษา (Student Attendance)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ลงเวลาผ่าน Dynamic QR Code ประจำวัน (เปลี่ยนทุกวัน), รองรับสแกนเข้า-ออก และตรวจสอบย้อนหลัง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Daily QR Button */}
          <button
            onClick={handleOpenQrModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>แสดง QR Code วันนี้</span>
          </button>

          {/* Kiosk Mode Fullscreen Button */}
          <Link
            href="/dashboard/attendance/kiosk"
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-xl font-bold text-xs border border-slate-700 shadow-sm transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span>เปิดจุดสแกน Kiosk Mode</span>
          </Link>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
            <Calendar className="w-4 h-4 text-sky-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>

          <button
            onClick={fetchPlacementsAndAttendance}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Attendance Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">นักศึกษาในระบบ</div>
            <div className="text-lg font-bold text-slate-900">{placements.length} คน</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">สแกนเข้าแล้ว</div>
            <div className="text-lg font-bold text-emerald-600">
              {Object.values(attendanceMap).filter((x) => Boolean(x.checkIn)).length} คน
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">สแกนออกแล้ว</div>
            <div className="text-lg font-bold text-indigo-600">
              {Object.values(attendanceMap).filter((x) => Boolean(x.checkOut)).length} คน
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">สถานะ QR ประจำวัน</div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>รหัสปลอดภัย Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="font-bold text-xs text-slate-700">
            วันที่บันทึก: {toThaiDate(selectedDate, 'long')} • มีนักศึกษาทั้งหมด {placements.length} คน
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
            <span>นักศึกษาสแกน QR บันทึกเวลาเข้า-ออกอัตโนมัติ</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-5 py-3.5">นักศึกษา</th>
                <th className="px-5 py-3.5">กลุ่มงาน</th>
                <th className="px-5 py-3.5">สถานะ</th>
                <th className="px-5 py-3.5">เวลาเข้า (Check-In)</th>
                <th className="px-5 py-3.5">เวลาออก (Check-Out)</th>
                <th className="px-5 py-3.5">ช่องทาง</th>
                <th className="px-5 py-3.5">หมายเหตุ</th>
                <th className="px-5 py-3.5 text-right">บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลการลงเวลา...
                  </td>
                </tr>
              ) : placements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    ไม่พบนักศึกษาที่มีการจัดสรรในระบบ
                  </td>
                </tr>
              ) : (
                placements.map((p) => {
                  const record = attendanceMap[p.id] || {
                    status: AttendanceStatus.PRESENT,
                    checkIn: '',
                    checkOut: '',
                    note: '',
                    recordedBy: '',
                  };

                  const isQrScan = record.recordedBy === 'QR_STUDENT_SELF_SCAN';

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
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={record.checkIn}
                            onChange={(e) => updateRecord(p.id, 'checkIn', e.target.value)}
                            className={`p-1.5 rounded-lg border text-xs font-mono font-bold ${
                              record.checkIn ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800' : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={record.checkOut}
                            onChange={(e) => updateRecord(p.id, 'checkOut', e.target.value)}
                            className={`p-1.5 rounded-lg border text-xs font-mono font-bold ${
                              record.checkOut ? 'border-sky-300 bg-sky-50/60 text-sky-800' : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {isQrScan ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold">
                            <QrCode className="w-3 h-3" />
                            <span>สแกน QR</span>
                          </span>
                        ) : record.checkIn ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                            <span>ลงมือ</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          placeholder="หมายเหตุ..."
                          value={record.note}
                          onChange={(e) => updateRecord(p.id, 'note', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleSaveAttendance(p.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm transition-all text-xs"
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

      {/* Daily Dynamic QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">QR Code ประจำวัน (ลงเวลา)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              วันที่: {toThaiDate(selectedDate, 'long')}
            </p>

            <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              {loadingQr ? (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                </div>
              ) : qrData?.qrDataUrl ? (
                <img
                  src={qrData.qrDataUrl}
                  alt="Daily QR Code"
                  className="w-56 h-56 object-contain rounded-lg mx-auto"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-rose-500 text-xs">
                  ไม่สามารถสร้าง QR ได้
                </div>
              )}
            </div>

            <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 text-left space-y-1 mb-4">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>รหัส QR เปลี่ยนใหม่ทุกวันโดยอัตโนมัติ</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                นักศึกษาเปิดกล้องมือถือสแกนเพื่อยืนยันตัวตน และบันทึกเวลาเข้า (เช้า) หรือออก (เย็น)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/attendance/kiosk"
                target="_blank"
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>เปิด Kiosk เต็มจอ</span>
              </Link>
              {qrData?.scanUrl && (
                <a
                  href={qrData.scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span>ลองเปิดหน้าสแกน</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
