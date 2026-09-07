import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { PlacementStatus } from '@prisma/client';
import { computeQuotaStatus } from '@/lib/quota/engine';
import { toThaiDateRange } from '@/lib/utils/date';
import { QUOTA_STATUS_META } from '@/lib/utils/formatters';
import {
  GraduationCap,
  Building2,
  Users,
  ShieldCheck,
  Calendar,
  FileCheck,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Hospital,
  ChevronRight,
  Award
} from 'lucide-react';
import VisitorCounter from '@/components/analytics/VisitorCounter';

export const revalidate = 60; // ISR 60 seconds

export default async function HomePage() {
  // Fetch real quota highlights and counts
  const [departmentsCount, quotas, institutionsCount] = await Promise.all([
    prisma.department.count({ where: { active: true } }),
    prisma.quotaPeriod.findMany({
      include: {
        department: true,
        program: true,
        placements: {
          where: { status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] } },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
    }),
    prisma.institution.count({ where: { status: 'ACTIVE' } }),
  ]);

  const quotaHighlights = quotas.map((q) => {
    const approvedCount = q.placements.length;
    const remainingCount = Math.max(0, q.maxStudents - approvedCount);
    const computedStatus = computeQuotaStatus(q.maxStudents, approvedCount, q.status);
    return {
      id: q.id,
      departmentName: q.department.nameThai,
      programName: q.program?.programName || 'ทุกสาขาวิชาชีพ',
      dateRange: toThaiDateRange(q.startDate, q.endDate),
      maxStudents: q.maxStudents,
      approvedCount,
      remainingCount,
      status: computedStatus,
      meta: QUOTA_STATUS_META[computedStatus],
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md shadow-teal-500/20 border border-slate-100">
              <img
                src="/logo.png"
                alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  PDHSCHOOL
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  รพ.ปลวกแดง
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                ระบบบริหารจัดการนักเรียน นักศึกษา และแหล่งฝึกงาน โรงพยาบาลปลวกแดง
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/training-quota"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
            >
              ดูโควต้าฝึกงาน
            </Link>
            <Link
              href="/register-institution"
              className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-slate-700 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
            >
              ลงทะเบียนสถาบัน
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 rounded-lg shadow-sm shadow-sky-600/30 transition-all hover:shadow-md"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-sky-50/70 via-white to-slate-50 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold mb-6 border border-blue-200">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ปีงบประมาณ 2569 • เปิดรับคำขอและจัดสรรโควต้าตามรอบ</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              แหล่งเรียนรู้และพัฒนาทักษะวิชาชีพ{' '}
              <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                โรงพยาบาลปลวกแดง
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              ศูนย์กลางการยื่นคำขอฝึกปฏิบัติงาน จัดสรรโควต้าแม่นยำ ป้องกันการรับเกินจำนวน
              ติดตามการฝึก และออกหนังสือตอบรับพร้อมระบบตรวจสอบดิจิทัลอย่างเป็นทางการ
            </p>

            {/* Main Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/training-quota"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 hover:from-sky-700 hover:to-indigo-900 rounded-xl shadow-lg shadow-sky-600/25 transition-all hover:scale-[1.02]"
              >
                <Calendar className="w-5 h-5" />
                <span>ดูโควต้าฝึกงาน</span>
              </Link>
              <Link
                href="/register-institution"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all hover:border-slate-400"
              >
                <GraduationCap className="w-5 h-5 text-sky-600" />
                <span>ยื่นความประสงค์ส่งนักศึกษา</span>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 text-base font-semibold text-sky-700 hover:text-sky-800 bg-sky-50/80 hover:bg-sky-100 rounded-xl transition-all"
              >
                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{departmentsCount}</div>
              <div className="text-sm font-medium text-slate-500 mt-1">กลุ่มงาน/แผนกรับฝึก</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">13</div>
              <div className="text-sm font-medium text-slate-500 mt-1">สาขาวิชาชีพสุขภาพ & สนับสนุน</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{institutionsCount}+</div>
              <div className="text-sm font-medium text-slate-500 mt-1">สถาบันการศึกษาคู่ความร่วมมือ</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">100%</div>
              <div className="text-sm font-medium text-slate-500 mt-1">ป้องกัน Overbooking ปลอดภัย</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Quota Highlights Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full">
                Live Capacity Monitor
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
                สถานะโควต้าการรับฝึกงานปัจจุบัน (ปี 2569)
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                ตรวจสอบจำนวนที่นั่งคงเหลือแบบเรียลไทม์ โดยไม่มีการเปิดเผยข้อมูลส่วนบุคคลของนักศึกษา
              </p>
            </div>
            <Link
              href="/training-quota"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              <span>ดูรายการโควต้าทั้งหมด</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotaHighlights.map((q) => (
              <div
                key={q.id}
                className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-bold text-slate-900 text-base">{q.departmentName}</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${q.meta.bg} ${q.meta.color}`}
                    >
                      {q.meta.labelTh}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-sky-700 mb-1">{q.programName}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{q.dateRange}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm mb-2 font-medium">
                    <span className="text-slate-600">รับทั้งหมด: {q.maxStudents} คน</span>
                    <span className="text-slate-600">อนุมัติแล้ว: {q.approvedCount}</span>
                    <span className="font-bold text-slate-900">คงเหลือ: {q.remainingCount}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        q.remainingCount <= 0 ? 'bg-rose-500' : q.remainingCount <= 2 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${q.maxStudents > 0 ? (q.approvedCount / q.maxStudents) * 100 : 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Systematic Workflow Section */}
      <section className="py-16 bg-slate-50/50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              Standardized Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
              ขั้นตอนการส่งนักศึกษาฝึกปฏิบัติงาน
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              กระบวนการที่เป็นระบบ โปร่งใส ตรวจสอบสถานะได้ทุกขั้นตอน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">ตรวจสอบโควต้า</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                สถาบันการศึกษาตรวจสอบช่วงเวลาและจำนวนที่นั่งว่างผ่านหน้าระบบโควต้ากลาง
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">ยื่นคำขอและรายชื่อ</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                แนบหนังสือขอความอนุเคราะห์และรายชื่อนักศึกษาเข้าระบบ พร้อมรับรหัสคำขอติดตาม
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">พิจารณาและจัดสรร</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                กลุ่มงานและผู้ประสานงานตรวจสอบคุณสมบัติ อนุมัติผ่านระบบที่ล็อกโควต้าแบบเรียลไทม์
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">ออกเอกสาร & QR Code</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                รับหนังสือตอบรับอย่างเป็นทางการ พร้อมรหัส QR Code ตรวจสอบความถูกต้องของเอกสาร
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Realtime WebApp Visitor Counter */}
          <div className="mb-12">
            <VisitorCounter variant="full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white font-extrabold text-xl mb-3">
                <Hospital className="w-6 h-6 text-teal-400" />
                <span>PDHSCHOOL</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                โรงพยาบาลปลวกแดง สังกัดสำนักงานสาธารณสุขจังหวัดระยอง
                มุ่งมั่นพัฒนาคุณภาพบริการสุขภาพ และเป็นแหล่งฝึกอบรมวิชาชีพที่มีมาตรฐาน
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-base mb-3">ลิงก์ที่เป็นประโยชน์</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/training-quota" className="hover:text-white transition-colors">
                    ตารางโควต้าการรับฝึกงาน
                  </Link>
                </li>
                <li>
                  <Link href="/register-institution" className="hover:text-white transition-colors">
                    ลงทะเบียนสถาบันการศึกษา
                  </Link>
                </li>
                <li>
                  <Link href="/verify/sample" className="hover:text-white transition-colors">
                    ตรวจสอบเอกสารตอบรับ (QR Verification)
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    เข้าสู่ระบบสำหรับเจ้าหน้าที่
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-base mb-3">ติดต่อสอบถาม</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  <span>เลขที่ 272 ม.1 ต.ปลวกแดง อ.ปลวกแดง จ.ระยอง 21140</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>038-659-123 ต่อ 101 (งานพัฒนาบุคลากรและแหล่งฝึก)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>training@pluakdaenghospital.go.th</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © 2569 โรงพยาบาลปลวกแดง (Pluakdaeng Hospital). All rights reserved. | ระบบบริหารจัดการนักเรียน นักศึกษา และแหล่งฝึกงาน
            </div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-300 font-mono text-xs font-bold border border-teal-500/30">
                Version 1.2.0
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                ผู้พัฒนา: <strong className="text-teal-400 font-bold tracking-wide">Tomvis</strong>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
