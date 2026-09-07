'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Hospital,
  Clock,
  Calendar,
  Printer,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Users,
  ExternalLink,
} from 'lucide-react';

export default function AttendanceKioskPage() {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const fetchQR = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance/daily-qr');
      const json = await res.json();
      if (json.success) {
        setQrData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
    // Auto-refresh stats and QR every 60 seconds
    const interval = setInterval(fetchQR, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clock
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

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between print:bg-white print:text-black">
      {/* Top Navbar (hidden when printing) */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/attendance"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการ</span>
          </Link>
          <div className="flex items-center gap-2.5 text-teal-400 font-semibold text-sm">
            <img src="/logo.png" alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง" className="w-6 h-6 object-contain rounded-full bg-white/10 p-0.5" />
            <span>โรงพยาบาลปลวกแดง • จุดสแกนลงเวลาประจำวัน</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg border border-slate-700 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ป้าย QR (A4)</span>
          </button>
          <button
            onClick={fetchQR}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Kiosk Content */}
      <main className="max-w-4xl w-full mx-auto px-6 py-8 flex-1 flex flex-col items-center justify-center text-center">
        {/* Printable Hospital Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 border-2 border-teal-500/40 flex items-center justify-center mb-3 shadow-xl print:border-teal-700">
            <img src="/logo.png" alt="ตราโรงพยาบาลปลวกแดง" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight print:text-black">
            โรงพยาบาลปลวกแดง
          </h1>
          <p className="text-teal-400 font-medium text-lg mt-1 print:text-teal-800">
            ระบบสแกนลงเวลาฝึกงานนักศึกษา (Student Attendance QR Kiosk)
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium print:border-slate-300 print:text-slate-800">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>{qrData?.thaiDate || 'กำลังโหลด...'}</span>
            <span className="text-slate-600 print:text-slate-400">•</span>
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="font-mono text-teal-300 font-bold print:text-teal-900">{currentTime} น.</span>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-md w-full relative group print:border-2 print:border-slate-800 print:shadow-none">
          {/* Dynamic Shield Badge */}
          <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-4 print:text-emerald-900 print:border-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>รหัสความปลอดภัยประจำวัน • เปลี่ยนอัตโนมัติทุกวัน</span>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl shadow-md border-4 border-teal-500/20 my-2">
            {qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt="Attendance Daily QR Code"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            )}
          </div>

          {/* Instruction Steps */}
          <div className="mt-5 text-left w-full bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-2 text-xs text-slate-300 print:text-slate-800 print:bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[11px]">
                1
              </span>
              <span>เปิดกล้องมือถือแล้วสแกน QR Code นี้</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[11px]">
                2
              </span>
              <span>กรอกรหัสนักศึกษาเพื่อยืนยันตัวตน</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[11px]">
                3
              </span>
              <span>กดปุ่ม <strong>"สแกนเข้า"</strong> (เช้า) หรือ <strong>"สแกนออก"</strong> (เย็น)</span>
            </div>
          </div>

          {/* Direct Link button for testing / manual entry */}
          {qrData?.scanUrl && (
            <div className="mt-4 print:hidden">
              <a
                href={qrData.scanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-400 hover:text-teal-300 underline inline-flex items-center gap-1"
              >
                <span>ทดสอบเปิดหน้าสแกนบนเบราว์เซอร์นี้</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Live Daily Stats Ticker */}
        {qrData?.stats && (
          <div className="grid grid-cols-3 gap-4 max-w-md w-full mt-6 print:hidden">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-400 block mb-1">นักศึกษาในผลัด</span>
              <span className="text-xl font-bold text-white">{qrData.stats.activeStudents}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-400 block mb-1">สแกนเข้าแล้ว</span>
              <span className="text-xl font-bold text-emerald-400">{qrData.stats.checkedIn}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-center">
              <span className="text-xs text-slate-400 block mb-1">สแกนออกแล้ว</span>
              <span className="text-xl font-bold text-sky-400">{qrData.stats.checkedOut}</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 print:text-slate-500 border-t border-slate-900">
        โรงพยาบาลปลวกแดง • กลุ่มงานพัฒนาทรัพยากรบุคคลและศูนย์ฝึกอบรมวิชาชีพสุขภาพ
      </footer>
    </div>
  );
}
