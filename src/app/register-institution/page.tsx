'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  Building2,
  Send,
  ArrowLeft,
  GraduationCap,
  Calendar,
  Users,
  Clock,
  FileText,
  Hospital,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function RegisterInstitutionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // 1. Institution basic info
    code: '',
    nameThai: '',
    nameEnglish: '',
    type: 'มหาวิทยาลัยรัฐ',
    faculty: '',
    province: 'ระยอง',
    address: '',
    postalCode: '',

    // 2. Coordinator info
    coordinatorName: '',
    coordinatorPhone: '',
    coordinatorEmail: '',
    officialEmail: '',

    // 3. Student & Cohort details (รายละเอียดนักศึกษา, ชั้นปี, จำนวน)
    educationLevel: 'ปริญญาตรี',
    major: '',
    classYear: 'ชั้นปีที่ 4',
    studentCount: 4,
    targetDepartment: 'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',

    // 4. Training period (ช่วงเวลา)
    startDate: '',
    endDate: '',
    trainingPeriod: 'ผลัดที่ 1 (ภาคเรียนที่ 1/2569)',
    estimatedHours: 320,

    // 5. Additional notes (หมายเหตุสำหรับเพิ่มเติม)
    additionalNotes: '',
  });

  const departmentOptions = [
    'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
    'กลุ่มงานการพยาบาล',
    'กลุ่มงานเทคนิคการแพทย์',
    'กลุ่มงานเวชกรรมฟื้นฟูและกายภาพบำบัด',
    'กลุ่มงานรังสีการแพทย์',
    'กลุ่มงานทันตกรรม',
    'กลุ่มงานบริการด้านปฐมภูมิและองค์รวม',
    'กลุ่มงานการแพทย์',
    'กลุ่มงานโภชนศาสตร์',
    'กลุ่มงานจิตเวชและยาเสพติด',
    'กลุ่มงานดิจิทัลและเทคโนโลยีสารสนเทศทางการแพทย์',
    'กลุ่มงานบริหารทั่วไปและการจัดการ',
  ];

  const classYearOptions = [
    'ชั้นปีที่ 1',
    'ชั้นปีที่ 2',
    'ชั้นปีที่ 3',
    'ชั้นปีที่ 4',
    'ชั้นปีที่ 5',
    'ชั้นปีที่ 6',
    'ระดับ ปวช. (ปี 1-3)',
    'ระดับ ปวส. (ปี 1-2)',
    'ระดับบัณฑิตศึกษา (ปริญญาโท)',
  ];

  const educationLevelOptions = [
    'ปริญญาตรี',
    'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)',
    'ประกาศนียบัตรวิชาชีพ (ปวช.)',
    'ปริญญาโท',
    'ประกาศนียบัตรเฉพาะทาง',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.nameThai || !formData.coordinatorName || !formData.coordinatorPhone || !formData.coordinatorEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน',
        text: 'โปรดระบุรหัสสถาบัน, ชื่อสถาบัน และข้อมูลผู้ประสานงานหลัก',
        confirmButtonColor: '#0f766e',
      });
      return;
    }

    if (!formData.classYear || !formData.studentCount || formData.studentCount < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุรายละเอียดนักศึกษา',
        text: 'โปรดระบุชั้นปีและจำนวนนักศึกษาที่จะส่งฝึกงานให้ถูกต้อง',
        confirmButtonColor: '#0f766e',
      });
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      nameThai: formData.nameThai.trim(),
      nameEnglish: formData.nameEnglish ? formData.nameEnglish.trim() : null,
      type: formData.type,
      faculty: formData.faculty.trim(),
      province: formData.province,
      address: formData.address,
      postalCode: formData.postalCode,
      coordinatorName: formData.coordinatorName.trim(),
      coordinatorPhone: formData.coordinatorPhone.trim(),
      coordinatorEmail: formData.coordinatorEmail.trim(),
      officialEmail: formData.officialEmail ? formData.officialEmail.trim() : null,
      notes: formData.additionalNotes,
      studentDetails: {
        educationLevel: formData.educationLevel,
        faculty: formData.faculty,
        major: formData.major,
        classYear: formData.classYear,
        studentCount: Number(formData.studentCount),
        targetDepartment: formData.targetDepartment,
        startDate: formData.startDate,
        endDate: formData.endDate,
        trainingPeriod: formData.trainingPeriod,
        estimatedHours: Number(formData.estimatedHours),
        additionalNotes: formData.additionalNotes,
      },
    };

    setLoading(true);
    try {
      const res = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ลงทะเบียนสถาบันและยื่นแผนฝึกงานสำเร็จ!',
          html: `
            <div class="text-left text-sm space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p><strong>สถาบัน:</strong> ${formData.nameThai}</p>
              <p><strong>สาขา/คณะ:</strong> ${formData.faculty || '-'} (${formData.major || '-'})</p>
              <p><strong>ชั้นปี:</strong> <span class="text-teal-700 font-bold">${formData.classYear}</span></p>
              <p><strong>จำนวนนักศึกษา:</strong> <span class="text-teal-700 font-bold">${formData.studentCount} คน</span></p>
              <p><strong>ช่วงเวลา:</strong> ${formData.trainingPeriod} (${formData.startDate || 'ตามกำหนด'} - ${formData.endDate || 'ตามกำหนด'})</p>
              <p><strong>กลุ่มงานเป้าหมาย:</strong> ${formData.targetDepartment}</p>
            </div>
            <p class="text-xs text-slate-500 mt-3">
              ข้อมูลได้รับการบันทึกลงระบบแล้ว เจ้าหน้าที่กลุ่มงานพัฒนาบุคลากรจะตรวจสอบและประสานงานกลับทางอีเมล
            </p>
          `,
          confirmButtonColor: '#0f766e',
          confirmButtonText: 'รับทราบและกลับสู่หน้าหลัก',
        });
        router.push('/');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถลงทะเบียนได้',
          text: data.error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน (รหัสสถาบันอาจซ้ำซ้อน)',
          confirmButtonColor: '#0f766e',
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาดเครือข่าย',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่',
        confirmButtonColor: '#0f766e',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>

          <span className="text-xs text-slate-500 font-mono">
            ระบบรับลงทะเบียนสถาบันและแผนฝึกงาน • รพ.ปลวกแดง
          </span>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-teal-400/40 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-1.5 border border-teal-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Educational Institution Enrollment & Placement Plan</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  ลงทะเบียนสถาบันการศึกษา
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  ยื่นความประสงค์เพื่อเปิดใช้งานบัญชีสถาบัน พร้อมกำหนดรายละเอียดนักศึกษา ชั้นปี จำนวน ช่วงเวลา และหมายเหตุสำหรับส่งฝึกงาน ณ โรงพยาบาลปลวกแดง
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            {/* Section 1: ข้อมูลสถาบันการศึกษา */}
            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 mb-5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>ข้อมูลสถาบันการศึกษา (Institution Information)</span>
                  </h2>
                  <p className="text-xs text-slate-500">ระบุชื่อสถาบันและประเภทของสถานศึกษา</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    รหัสสถาบัน (เช่น INST-BUU, INST-CU) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น INST-SWU"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ประเภทสถาบัน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  >
                    <option value="มหาวิทยาลัยรัฐ">มหาวิทยาลัยรัฐ / ในกำกับของรัฐ</option>
                    <option value="มหาวิทยาลัยเอกชน">มหาวิทยาลัยเอกชน</option>
                    <option value="สถาบันพระบรมราชชนก">สถาบันพระบรมราชชนก</option>
                    <option value="สถาบันอาชีวศึกษา">สถาบันอาชีวศึกษา (ปวช./ปวส.)</option>
                    <option value="โรงเรียนมัธยมศึกษา">โรงเรียนมัธยมศึกษา</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ชื่อสถาบันการศึกษา (ภาษาไทย) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น มหาวิทยาลัยบูรพา, มหาวิทยาลัยธรรมศาสตร์, วิทยาลัยพยาบาลบรมราชชนนี"
                    value={formData.nameThai}
                    onChange={(e) => setFormData({ ...formData, nameThai: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ชื่อสถาบันการศึกษา (English)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Burapha University"
                    value={formData.nameEnglish}
                    onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    จังหวัดที่ตั้งของสถาบัน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ชลบุรี, ระยอง, กรุงเทพฯ"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    รหัสไปรษณีย์
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 20131"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: ข้อมูลผู้ประสานงานหลัก */}
            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 mb-5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>ข้อมูลผู้ประสานงานหลัก (Coordinator Information)</span>
                  </h2>
                  <p className="text-xs text-slate-500">สำหรับโรงพยาบาลติดต่อแจ้งผลการจัดสรรและส่งเอกสารราชการ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ชื่อ-นามสกุล ผู้ประสานงาน/อาจารย์รับผิดชอบ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ดร. พรทิพย์ สุวรรณโชติ"
                    value={formData.coordinatorName}
                    onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 038-123456 หรือ 081-2345678"
                    value={formData.coordinatorPhone}
                    onChange={(e) => setFormData({ ...formData, coordinatorPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    อีเมลผู้ประสานงาน (รับแจ้งเตือนระบบ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="coordinator@university.ac.th"
                    value={formData.coordinatorEmail}
                    onChange={(e) => setFormData({ ...formData, coordinatorEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    อีเมลงานสารบรรณ / ทางการ
                  </label>
                  <input
                    type="email"
                    placeholder="saraban@university.ac.th"
                    value={formData.officialEmail}
                    onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: รายละเอียดนักศึกษา, ชั้นปี, จำนวน และช่วงเวลา (Core requirement) */}
            <div className="bg-teal-50/40 rounded-2xl p-6 border border-teal-200/80">
              <div className="flex items-center gap-2.5 pb-3 border-b border-teal-200/80 mb-5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  3
                </div>
                <div>
                  <h2 className="text-base font-bold text-teal-950 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-teal-700" />
                    <span>รายละเอียดนักศึกษา ชั้นปี จำนวน และช่วงเวลาที่ประสงค์ส่งฝึกงาน</span>
                  </h2>
                  <p className="text-xs text-teal-800">
                    กำหนดรายละเอียดแผนการส่งนักศึกษาเพื่อใช้ประกอบการพิจารณาจัดสรรโควต้ารายกลุ่มงาน
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Faculty & Major */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    คณะ / สำนักวิชา <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คณะเภสัชศาสตร์, คณะพยาบาลศาสตร์, คณะสหเวชศาสตร์"
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    สาขาวิชา / หลักสูตร
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น การบริบาลทางเภสัชกรรม (Pharm.D.), พยาบาลศาสตรบัณฑิต, กายภาพบำบัด"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                {/* Education Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    ระดับการศึกษา <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.educationLevel}
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    {educationLevelOptions.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    กลุ่มงาน/แผนกเป้าหมายในโรงพยาบาล <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.targetDepartment}
                    onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium text-teal-900"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ชั้นปี (Academic Year) */}
                <div className="bg-white p-3.5 rounded-xl border border-teal-200">
                  <label className="block text-xs font-bold text-teal-900 uppercase mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <span>ชั้นปีของนักศึกษา (Class Level)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.classYear}
                    onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold text-slate-800"
                  >
                    {classYearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ระบุระดับชั้นปีของนักศึกษาที่จะส่งเข้าฝึกปฏิบัติงาน
                  </p>
                </div>

                {/* จำนวนนักศึกษา (Student Count) */}
                <div className="bg-white p-3.5 rounded-xl border border-teal-200">
                  <label className="block text-xs font-bold text-teal-900 uppercase mb-1.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>จำนวนนักศึกษาที่ประสงค์ส่งฝึก (คน)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={formData.studentCount}
                      onChange={(e) => setFormData({ ...formData, studentCount: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-28 px-3 py-2 rounded-lg border border-slate-300 text-sm font-black text-center text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-600 font-semibold">คน</span>
                    <div className="flex gap-1.5">
                      {[2, 4, 6, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormData({ ...formData, studentCount: num })}
                          className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition-all ${
                            formData.studentCount === num
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    จำนวนที่นั่งที่ขอรับการจัดสรรในผลัดนี้
                  </p>
                </div>

                {/* ช่วงเวลา (Training Period) */}
                <div className="sm:col-span-2 bg-white p-4 rounded-xl border border-teal-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-900 uppercase flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      <span>ช่วงเวลาและผลัดการฝึกงาน (Training Schedule & Duration)</span>
                    </label>
                    <span className="text-xs text-teal-700 font-medium">
                      รวมเวลาฝึกประมาณ {formData.estimatedHours} ชั่วโมง
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        รอบ / ผลัดการฝึกงาน
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ผลัดที่ 1/2569 หรือ ภาคฤดูร้อน"
                        value={formData.trainingPeriod}
                        onChange={(e) => setFormData({ ...formData, trainingPeriod: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        วันที่เริ่มต้นการฝึก
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        วันที่สิ้นสุดการฝึก
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>ชั่วโมงฝึกตามเกณฑ์หลักสูตร:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="40"
                        step="40"
                        value={formData.estimatedHours}
                        onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                        className="w-24 px-2.5 py-1 rounded-md border border-slate-300 text-xs font-bold text-center"
                      />
                      <span className="text-xs text-slate-500">ชั่วโมง (เช่น 160, 240, 320, 500 ชม.)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: หมายเหตุสำหรับเพิ่มเติม (Core requirement) */}
            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 mb-5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>หมายเหตุสำหรับเพิ่มเติม และความต้องการพิเศษ (Additional Notes)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    ระบุวัตถุประสงค์เฉพาะของหลักสูตร ความต้องการด้านหอพัก หรือการนิเทศก์งาน
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  ข้อความหมายเหตุ / ข้อเสนอแนะเพิ่มเติมจากสถาบัน
                </label>
                <textarea
                  rows={4}
                  placeholder="เช่น:
- ต้องการให้นักศึกษาเน้นการปฏิบัติงานด้านผู้ป่วยใน (IPD) และงานเภสัชกรรมคลินิก
- มีอาจารย์นิเทศก์เข้าตรวจเยี่ยม 1 ครั้ง ในช่วงสัปดาห์ที่ 4 ของการฝึก
- ขอความอนุเคราะห์ข้อมูลเรื่องที่พัก หรือสถานที่พักใกล้เคียงโรงพยาบาลสำหรับนักศึกษา
- ข้อกำหนดเฉพาะหรือเอกสารประเมินเพิ่มเติมของทางมหาวิทยาลัย"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm leading-relaxed"
                />
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    ข้อมูลส่วนนี้จะถูกจัดส่งให้หัวหน้ากลุ่มงานและผู้รับผิดชอบงานฝึกอบรมเพื่อเตรียมความพร้อมรับนักศึกษา
                  </span>
                </p>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-5 rounded-2xl text-white shadow-md">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase mb-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>สรุปแผนการยื่นความประสงค์ของสถาบัน</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block">สถาบัน:</span>
                  <span className="font-semibold text-white truncate block">{formData.nameThai || 'ยังไม่ระบุ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ชั้นปี:</span>
                  <span className="font-bold text-teal-300 block">{formData.classYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">จำนวนนักศึกษา:</span>
                  <span className="font-bold text-teal-300 block">{formData.studentCount} คน</span>
                </div>
                <div>
                  <span className="text-slate-400 block">กลุ่มงานเป้าหมาย:</span>
                  <span className="font-medium text-slate-200 truncate block">{formData.targetDepartment}</span>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                เมื่อส่งคำขอแล้ว เจ้าหน้าที่โรงพยาบาลจะทำการตรวจสอบและอนุมัติบัญชีผู้ใช้
              </p>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/"
                  className="w-full sm:w-auto text-center px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  ยกเลิก
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอลงทะเบียน'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
