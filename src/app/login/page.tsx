'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { Hospital, Lock, User, ArrowRight, Info } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูล',
        text: 'โปรดระบุชื่อผู้ใช้งานและรหัสผ่าน',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับคุณ ${data.data?.user?.name || username}`,
          timer: 1500,
          showConfirmButton: false,
        });
        router.push(callbackUrl);
        router.refresh();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถเข้าสู่ระบบได้',
          text: data.error?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
          confirmButtonColor: '#0284c7',
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาดระบบ',
        text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#0284c7',
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-900 p-8 text-white text-center">
        <div className="w-20 h-20 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto mb-3 shadow-xl border border-white/20">
          <img
            src="/logo.png"
            alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">PDHSCHOOL</h1>
        <p className="text-xs text-sky-200 mt-1 font-medium">
          ระบบบริหารจัดการนักเรียน นักศึกษา และแหล่งฝึกงาน โรงพยาบาลปลวกแดง
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="p-8 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            ชื่อผู้ใช้งาน (Username)
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ระบุชื่อผู้ใช้งาน"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            รหัสผ่าน (Password)
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 shadow-md shadow-sky-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Quick Demo Credentials for Reviewers */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span>บัญชีทดสอบระบบ (Demo Accounts):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo('admin', '@Pdhschool10832')}
              className="text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('training.admin', 'Pdh@123456')}
              className="text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
            >
              Training Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('dept.pharmacy', 'Pdh@123456')}
              className="text-[11px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors"
            >
              Dept Admin (เภสัช)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('preceptor.wisarut', 'Pdh@123456')}
              className="text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
            >
              Preceptor
            </button>
            <button
              type="button"
              onClick={() => fillDemo('inst.buu', 'Pdh@123456')}
              className="text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
            >
              สถาบัน (ม.บูรพา)
            </button>
          </div>
        </div>
      </form>

      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-sky-700 font-medium">
          ← กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-400">
            กำลังโหลดฟอร์มเข้าสู่ระบบ...
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      <footer className="mt-6 text-center text-xs text-slate-500 space-y-1">
        <div>© 2569 โรงพยาบาลปลวกแดง (Pluakdaeng Hospital)</div>
        <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-bold">
            v1.2.0
          </span>
          <span>•</span>
          <span>
            ผู้พัฒนา: <strong className="text-teal-800 font-bold">Tomvis</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
