'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Hospital, ArrowLeft, Building2, Send, CheckCircle2 } from 'lucide-react';

export default function RegisterInstitutionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    nameThai: '',
    nameEnglish: '',
    type: 'มหาวิทยาลัยรัฐ',
    faculty: '',
    address: '',
    province: 'ระยอง',
    postalCode: '',
    coordinatorName: '',
    coordinatorPhone: '',
    coordinatorEmail: '',
    officialEmail: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameThai || !formData.coordinatorName || !formData.coordinatorPhone || !formData.coordinatorEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกรหัสสถาบัน, ชื่อสถาบัน และข้อมูลผู้ประสานงานให้ครบถ้วน',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ลงทะเบียนเรียบร้อยแล้ว',
          text: 'คำขอลงทะเบียนเข้าสู่ระบบได้รับการบันทึกแล้ว เจ้าหน้าที่โรงพยาบาลจะทำการตรวจสอบและอนุมัติบัญชีของท่าน',
          confirmButtonColor: '#0284c7',
        });
        router.push('/');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถลงทะเบียนได้',
          text: data.error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน',
          confirmButtonColor: '#0284c7',
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาดเครือข่าย',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่',
        confirmButtonColor: '#0284c7',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-700 to-blue-800 p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-sky-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                Institution Enrollment
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">ลงทะเบียนสถาบันการศึกษา</h1>
            <p className="text-sm text-sky-100 mt-1">
              ยื่นความประสงค์เพื่อเปิดใช้งานบัญชีสถาบันการศึกษา สำหรับยื่นคำขอส่งนักศึกษาฝึกงาน ณ โรงพยาบาลปลวกแดง
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  รหัสสถาบัน (เช่น INST-BUU, INST-CU) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น INST-SWU"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ประเภทสถาบัน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
                >
                  <option value="มหาวิทยาลัยรัฐ">มหาวิทยาลัยรัฐ / ในกำกับของรัฐ</option>
                  <option value="มหาวิทยาลัยเอกชน">มหาวิทยาลัยเอกชน</option>
                  <option value="สถาบันพระบรมราชชนก">สถาบันพระบรมราชชนก</option>
                  <option value="สถาบันอาชีวศึกษา">สถาบันอาชีวศึกษา (ปวช./ปวส.)</option>
                  <option value="โรงเรียนมัธยมศึกษา">โรงเรียนมัธยมศึกษา</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อสถาบันการศึกษา (ภาษาไทย) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มหาวิทยาลัยบูรพา, วิทยาลัยพยาบาลบรมราชชนนี"
                  value={formData.nameThai}
                  onChange={(e) => setFormData({ ...formData, nameThai: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อสถาบันการศึกษา (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Burapha University"
                  value={formData.nameEnglish}
                  onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  คณะ / ภาควิชา / สาขาที่ประสานงาน
                </label>
                <input
                  type="text"
                  placeholder="เช่น คณะเภสัชศาสตร์, คณะพยาบาลศาสตร์"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-4">
                <h3 className="font-bold text-slate-900 text-base mb-3">ข้อมูลผู้ประสานงานหลักของสถาบัน</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล ผู้ประสานงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น อ. ดร. สมชาย ใจดี"
                  value={formData.coordinatorName}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="เช่น 038-123456 หรือ 081-2345678"
                  value={formData.coordinatorPhone}
                  onChange={(e) => setFormData({ ...formData, coordinatorPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  อีเมลผู้ประสานงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="coordinator@university.ac.th"
                  value={formData.coordinatorEmail}
                  onChange={(e) => setFormData({ ...formData, coordinatorEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  อีเมลงานสารบรรณ/ทางการ
                </label>
                <input
                  type="email"
                  placeholder="saraban@university.ac.th"
                  value={formData.officialEmail}
                  onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/"
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอลงทะเบียน'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
