'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  Hospital,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  QrCode,
  GraduationCap,
  Building2,
  UserCheck,
  ArrowRight,
  LogOut,
  LogIn,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

function ScanContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') || '';
  const tokenParam = searchParams.get('token') || '';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<any>(null);

  // Live Clock (Asia/Bangkok)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lookup student
  const handleLookup = async (lookupId?: string) => {
    const idToSearch = lookupId || identifier;
    if (!idToSearch.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุรหัสนักศึกษา',
        text: 'โปรดกรอกรหัสนักศึกษา หรือเลขประจำตัวประชาชน เพื่อยืนยันตัวตน',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/attendance/scan-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateParam,
          token: tokenParam,
          identifier: idToSearch.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error?.message || 'ไม่พบข้อมูลนักศึกษา');
        setStudentData(null);
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถระบุตัวตนได้',
          text: json.error?.message || 'ไม่พบข้อมูลนักศึกษาที่ได้รับอนุมัติในวันนี้',
          confirmButtonColor: '#0284c7',
        });
      } else {
        setStudentData(json.data);
        setErrorMsg(null);
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // Submit Check-In or Check-Out
  const handleAction = async (actionType: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!studentData) return;

    const actionText = actionType === 'CHECK_IN' ? 'สแกนเข้างาน' : 'สแกนออกงาน';

    const confirm = await Swal.fire({
      title: `ยืนยัน${actionText}?`,
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>นักศึกษา:</strong> ${studentData.student.fullName}</p>
          <p><strong>กลุ่มงาน:</strong> ${studentData.student.departmentName}</p>
          <p><strong>เวลาที่บันทึก:</strong> ${currentTime} น.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: actionType === 'CHECK_IN' ? '#10b981' : '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: `ยืนยัน${actionText}`,
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/scan-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateParam,
          token: tokenParam,
          placementId: studentData.placement.id,
          studentId: studentData.student.id,
          action: actionType,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: json.error?.message || 'ไม่สามารถบันทึกเวลาได้',
          confirmButtonColor: '#0284c7',
        });
      } else {
        setLastAction(json.data);
        await Swal.fire({
          icon: 'success',
          title: `${actionText}สำเร็จ!`,
          html: `
            <div class="text-center">
              <p class="text-2xl font-bold text-slate-800 my-2">${json.data.time} น.</p>
              <p class="text-sm text-slate-600">${json.data.message}</p>
              ${
                json.data.statusLabel
                  ? `<span class="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">${json.data.statusLabel}</span>`
                  : ''
              }
            </div>
          `,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'ตกลง',
        });
        // Refresh lookup
        handleLookup(studentData.student.studentCode);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถติดต่อระบบได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#0284c7',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-20">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shadow-inner">
              <Hospital className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white leading-tight">โรงพยาบาลปลวกแดง</h1>
              <p className="text-xs text-teal-400 font-medium">ระบบลงเวลาฝึกงานนักศึกษา (QR Attendance)</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">เวลาปัจจุบัน</div>
            <div className="font-mono text-sm font-bold text-teal-300">{currentTime || '--:--:--'} น.</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-5">
        {/* Token Validation Header Card */}
        <div className="bg-gradient-to-r from-teal-900/40 via-slate-800/80 to-sky-900/40 border border-teal-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>QR Code ประจำวันถูกต้อง</span>
            </div>
            <span className="text-xs font-mono bg-slate-800/90 text-teal-300 px-2.5 py-1 rounded-full border border-teal-500/20">
              {dateParam || 'วันนี้'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            รหัสประจำวันได้รับการเข้ารหัสและเปลี่ยนอัตโนมัติทุก 24 ชั่วโมง เพื่อความปลอดภัย
          </p>
        </div>

        {/* Step 1: Student Lookup */}
        {!studentData ? (
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-700/60 pb-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">ยืนยันตัวตนนักศึกษา</h2>
                <p className="text-xs text-slate-400">กรุณาระบุรหัสนักศึกษาเพื่อเริ่มการลงเวลา</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  รหัสนักศึกษา หรือ เลขประจำตัวประชาชน
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    placeholder="เช่น 65140021 หรือ 12099xxxxxx"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => handleLookup()}
                    disabled={loading}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>ตรวจสอบ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Sample Trainees */}
              <div className="pt-2">
                <div className="text-[11px] text-slate-400 mb-1.5">กดเลือกตัวอย่างนักศึกษาฝึกงาน (ทดสอบ):</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('65140021');
                      handleLookup('65140021');
                    }}
                    className="text-xs bg-slate-700/80 hover:bg-slate-700 text-teal-300 border border-slate-600 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>65140021: กานต์รวี (ม.บูรพา)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('65140045');
                      handleLookup('65140045');
                    }}
                    className="text-xs bg-slate-700/80 hover:bg-slate-700 text-sky-300 border border-slate-600 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>65140045: ธนกฤต (ม.บูรพา)</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Student Verified & Actions */
          <div className="space-y-4">
            {/* Student Profile Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                    {studentData.student.fullName?.substring(0, 1) || 'S'}
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">{studentData.student.fullName}</h2>
                    <p className="text-xs font-mono text-teal-400">รหัส: {studentData.student.studentCode}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{studentData.student.institutionName}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStudentData(null);
                    setIdentifier('');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition-all"
                >
                  เปลี่ยนคน
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">กลุ่มงานที่ฝึก</span>
                  <span className="font-medium text-slate-200">{studentData.student.departmentName}</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">อาจารย์พี่เลี้ยง</span>
                  <span className="font-medium text-slate-200">{studentData.student.preceptorName}</span>
                </div>
              </div>
            </div>

            {/* Attendance Status & Action Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
              <div className="text-center py-2">
                <div className="text-xs text-slate-400 mb-1">{studentData.thaiDate}</div>
                <div className="font-mono text-4xl font-extrabold text-white tracking-wider my-2">
                  {currentTime} <span className="text-sm font-normal text-slate-400">น.</span>
                </div>

                {/* Status Indicator */}
                {studentData.flowState === 'READY_FOR_CHECK_IN' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold my-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>รอการสแกนเข้าปฏิบัติงาน</span>
                  </div>
                )}

                {studentData.flowState === 'READY_FOR_CHECK_OUT' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold my-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>เข้างานแล้วเมื่อ {studentData.attendance?.checkIn} น. (รอสแกนออก)</span>
                  </div>
                )}

                {studentData.flowState === 'COMPLETED' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full text-xs font-semibold my-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ลงเวลาครบทั้งเข้าและออกแล้ว</span>
                  </div>
                )}
              </div>

              {/* Time Details Summary */}
              {studentData.attendance && (
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
                    <span className="text-slate-400 text-xs block mb-1">เวลาสแกนเข้า</span>
                    <span className="text-emerald-400 font-mono font-bold text-lg">
                      {studentData.attendance.checkIn ? `${studentData.attendance.checkIn} น.` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
                    <span className="text-slate-400 text-xs block mb-1">เวลาสแกนออก</span>
                    <span className="text-sky-400 font-mono font-bold text-lg">
                      {studentData.attendance.checkOut ? `${studentData.attendance.checkOut} น.` : '-'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 space-y-3">
                {studentData.flowState === 'READY_FOR_CHECK_IN' && (
                  <button
                    onClick={() => handleAction('CHECK_IN')}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>สแกนเข้าปฏิบัติงาน (Check-In)</span>
                      </>
                    )}
                  </button>
                )}

                {studentData.flowState === 'READY_FOR_CHECK_OUT' && (
                  <button
                    onClick={() => handleAction('CHECK_OUT')}
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-5 h-5" />
                        <span>สแกนออกปฏิบัติงาน (Check-Out)</span>
                      </>
                    )}
                  </button>
                )}

                {studentData.flowState === 'COMPLETED' && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-emerald-300 font-semibold text-sm">การลงเวลาประจำวันเสร็จสมบูรณ์</p>
                    <p className="text-slate-400 text-xs mt-1">ขอบคุณที่ตั้งใจฝึกปฏิบัติงานที่โรงพยาบาลปลวกแดง</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        <p>โรงพยาบาลปลวกแดง จ.ระยอง • งานพัฒนาบุคลากรและแหล่งฝึกอบรม</p>
      </footer>
    </div>
  );
}

export default function AttendanceScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mx-auto" />
            <p className="text-sm text-slate-400">กำลังโหลดระบบลงเวลาผ่าน QR Code...</p>
          </div>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
