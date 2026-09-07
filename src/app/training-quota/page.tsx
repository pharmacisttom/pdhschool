import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { PlacementStatus } from '@prisma/client';
import { computeQuotaStatus } from '@/lib/quota/engine';
import { toThaiDateRange } from '@/lib/utils/date';
import { QUOTA_STATUS_META } from '@/lib/utils/formatters';
import { Hospital, ArrowLeft, Search, Calendar, Users, Filter, CheckCircle, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrainingQuotaPage() {
  const quotas = await prisma.quotaPeriod.findMany({
    include: {
      department: true,
      program: true,
      placements: {
        where: {
          status: { in: [PlacementStatus.APPROVED, PlacementStatus.ACTIVE] },
        },
        select: { id: true },
      },
    },
    orderBy: [{ academicYear: 'desc' }, { startDate: 'asc' }],
  });

  const quotaItems = quotas.map((q) => {
    const approvedCount = q.placements.length;
    const remainingCount = Math.max(0, q.maxStudents - approvedCount);
    const computedStatus = computeQuotaStatus(q.maxStudents, approvedCount, q.status);

    return {
      id: q.id,
      departmentName: q.department.nameThai,
      departmentCode: q.department.code,
      programName: q.program?.programName || 'ทุกสาขาวิชาชีพ',
      profession: q.program?.profession || 'วิชาชีพสุขภาพและสายสนับสนุน',
      academicYear: q.academicYear,
      term: q.term || '1',
      dateRange: toThaiDateRange(q.startDate, q.endDate),
      maxStudents: q.maxStudents,
      approvedCount,
      remainingCount,
      occupancyPercent: q.maxStudents > 0 ? Math.round((approvedCount / q.maxStudents) * 100) : 100,
      status: computedStatus,
      meta: QUOTA_STATUS_META[computedStatus],
      notes: q.notes,
    };
  });

  // Calculate totals
  const totalSlots = quotaItems.reduce((acc, q) => acc + q.maxStudents, 0);
  const totalApproved = quotaItems.reduce((acc, q) => acc + q.approvedCount, 0);
  const totalAvailable = Math.max(0, totalSlots - totalApproved);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="กลับหน้าหลัก"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-blue-800 flex items-center justify-center text-white shadow-sm">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  ตารางโควต้าการรับฝึกงาน โรงพยาบาลปลวกแดง
                </h1>
                <p className="text-xs text-slate-500">ปีงบประมาณ 2569 • ข้อมูลความจุแบบเรียลไทม์ (ไม่มีการระบุข้อมูลส่วนบุคคล)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register-institution"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
            >
              ยื่นความประสงค์
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Summary Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-sky-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-sky-200 mb-3 backdrop-blur-sm">
                <Info className="w-3.5 h-3.5" />
                <span>การจัดสรรโควต้าฝึกปฏิบัติงานตามมติคณะกรรมการแหล่งฝึก</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                สถานะความจุและการจัดสรรโควต้า
              </h2>
              <p className="mt-2 text-sm text-sky-100/90 max-w-2xl leading-relaxed">
                โรงพยาบาลปลวกแดงควบคุมการรับนักศึกษาตามอัตราส่วนอาจารย์พี่เลี้ยงต่อผู้เรียน
                เพื่อคงมาตรฐานการฝึกอบรมระดับสากลและความปลอดภัยในการให้บริการผู้ป่วย
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">{totalSlots}</div>
                <div className="text-xs text-sky-200 mt-0.5">โควต้ารวม</div>
              </div>
              <div className="border-x border-white/15 px-2">
                <div className="text-2xl sm:text-3xl font-black text-amber-300">{totalApproved}</div>
                <div className="text-xs text-sky-200 mt-0.5">อนุมัติแล้ว</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300">{totalAvailable}</div>
                <div className="text-xs text-sky-200 mt-0.5">ว่างพร้อมรับ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-6 bg-white p-4 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-700">เกณฑ์สถานะ:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600"><strong>AVAILABLE (ว่างพร้อมรับ):</strong> ที่นั่งคงเหลือ &gt; 30%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600"><strong>LIMITED (ใกล้เต็ม):</strong> เหลือ 1 - 30%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600"><strong>FULL (เต็มแล้ว):</strong> ไม่เหลือที่ว่าง</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-600"><strong>CLOSED:</strong> ปิดรอบการรับ</span>
          </div>
        </div>

        {/* Quota Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotaItems.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{q.departmentName}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${q.meta.bg} ${q.meta.color}`}
                  >
                    {q.meta.labelTh}
                  </span>
                </div>

                <div className="text-sm font-semibold text-sky-700 mb-1">{q.programName}</div>
                <div className="text-xs text-slate-500 mb-3">{q.profession}</div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg mb-4">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{q.dateRange}</span>
                </div>

                {q.notes && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 italic">
                    &quot;{q.notes}&quot;
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">รับ {q.maxStudents} คน</span>
                  <span className="text-slate-500">อนุมัติแล้ว {q.approvedCount}</span>
                  <span className="font-bold text-slate-900 text-sm">เหลือ {q.remainingCount}</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      q.remainingCount <= 0
                        ? 'bg-rose-500'
                        : q.remainingCount <= 2
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${q.occupancyPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>อัตราครองโควต้า</span>
                  <span className="font-bold text-slate-800">{q.occupancyPercent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-1">
        <div>© 2569 โรงพยาบาลปลวกแดง (Pluakdaeng Hospital) • PDHSCHOOL</div>
        <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold">
            v1.2.0
          </span>
          <span>•</span>
          <span>
            ผู้พัฒนา: <strong className="text-teal-900 font-bold">Tomvis</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
