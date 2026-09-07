import Link from 'next/link';
import { Hospital, ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="text-4xl font-black text-slate-900 font-mono">404</div>
        <h1 className="text-lg font-bold text-slate-900">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย ลบ หรือที่อยู่ URL ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง
        </p>
        <div className="pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
