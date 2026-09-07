import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { toThaiDate } from '@/lib/utils/date';
import { Hospital, CheckCircle2, XCircle, ShieldCheck, ArrowLeft, Calendar, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VerifyDocumentPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;

  const doc = await prisma.documentVerification.findUnique({
    where: { verificationCode: code },
  });

  const isValid = doc && (!doc.validUntil || new Date(doc.validUntil) > new Date());

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Hospital Header Banner */}
        <div className="bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-900 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 text-white shadow-inner">
            <Hospital className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">โรงพยาบาลปลวกแดง</h1>
          <p className="text-xs text-sky-200 mt-1 font-medium">
            ระบบตรวจสอบความถูกต้องของเอกสารดิจิทัลทางการ (Official Document Verification)
          </p>
        </div>

        {/* Verification Status Card */}
        <div className="p-6 sm:p-8">
          {doc ? (
            <div>
              <div className="flex items-center justify-center gap-2 mb-6">
                {isValid ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>เอกสารแท้จริง ออกโดยโรงพยาบาลปลวกแดง</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold shadow-sm">
                    <XCircle className="w-5 h-5 text-amber-600" />
                    <span>เอกสารหมดอายุการรับรอง</span>
                  </div>
                )}
              </div>

              {/* Metadata Table without student PII */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">รหัสตรวจสอบ:</span>
                  <span className="font-mono font-bold text-slate-800">{doc.verificationCode}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">เลขที่เอกสาร:</span>
                  <span className="font-bold text-slate-800">{doc.documentNo}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">ประเภทเอกสาร:</span>
                  <span className="font-semibold text-sky-800">{doc.documentType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">เรื่อง:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[240px]">{doc.title}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">วันที่ออกเอกสาร:</span>
                  <span className="font-medium text-slate-800">{toThaiDate(doc.issueDate, 'long')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">หน่วยงานผู้ออก:</span>
                  <span className="font-semibold text-slate-900">{doc.hospitalName}</span>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 text-xs text-slate-500 bg-sky-50/70 p-3.5 rounded-xl border border-sky-100">
                <ShieldCheck className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                <span>
                  หน้านี้แสดงข้อมูลสาธารณะเพื่อยืนยันความถูกต้องของเอกสารตามมาตรฐานความปลอดภัย
                  โดยไม่แสดงข้อมูลส่วนบุคคลของผู้ฝึกปฏิบัติงาน
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">ไม่พบข้อมูลเอกสาร</h2>
              <p className="text-sm text-slate-500 mt-2">
                รหัสตรวจสอบ &quot;{code}&quot; ไม่ตรงกับเอกสารทางการใดๆ ของโรงพยาบาลปลวกแดง
                โปรดตรวจสอบความถูกต้องของรหัสหรือคิวอาร์โค้ดอีกครั้ง
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าหลัก PDHSCHOOL</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
