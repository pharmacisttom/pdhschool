'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  FolderLock,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Download,
  Plus,
} from 'lucide-react';
import { toThaiDate, toThaiDateRange } from '@/lib/utils/date';

export default function DocumentsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [docType, setDocType] = useState('ACCEPTANCE');
  const [generatedDoc, setGeneratedDoc] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('/api/requests')
      .then((r) => r.json())
      .then((d) => {
        const reqList = d.data || [];
        setRequests(reqList);
        if (reqList.length > 0) setSelectedRequestId(reqList[0].id);
      });
  }, []);

  const handleGenerate = async () => {
    if (!selectedRequestId) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกคำขอฝึกงาน' });
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: docType,
          requestId: selectedRequestId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDoc(data.data);
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้างเอกสารได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Hidden in Print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderLock className="w-7 h-7 text-sky-600" />
            <span>ระบบออกเอกสารและหนังสือทางการ (Official Documents)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ออกหนังสือตอบรับ, หนังสือแจ้งผล และหนังสือรับรอง พร้อม QR Code ตรวจสอบความถูกต้อง
          </p>
        </div>

        {generatedDoc && (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์เอกสารนี้</span>
          </button>
        )}
      </div>

      {/* Document Generator Controls - Hidden in Print */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>เลือกประเภทเอกสารและคำขอที่ต้องการออกหนังสือ</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ประเภทเอกสาร:</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
            >
              <option value="ACCEPTANCE">หนังสือตอบรับนักศึกษาเข้าฝึกปฏิบัติงาน</option>
              <option value="REJECTION">หนังสือแจ้งไม่สามารถรับนักศึกษาได้</option>
              <option value="CERTIFICATE">หนังสือรับรองการผ่านการฝึกปฏิบัติงาน</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">เลือกคำขอฝึกงาน:</label>
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
            >
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.requestNo} - {r.institution.nameThai} ({r.department.nameThai})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{generating ? 'กำลังสร้างเอกสาร...' : 'ออกหนังสือพร้อม QR Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Official Document Printable View */}
      {generatedDoc ? (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-2">
              <img src="/logo.png" alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง" className="w-full h-full object-contain" />
            </div>
            <div className="font-extrabold text-xl text-slate-900 tracking-tight">
              โรงพยาบาลปลวกแดง
            </div>
            <div className="text-xs text-slate-700 mt-1">
              เลขที่ 272 ม.1 ต.ปลวกแดง อ.ปลวกแดง จ.ระยอง 21140 • โทรศัพท์ 038-659-123
            </div>
            <div className="text-sm font-bold text-slate-900 mt-3">{generatedDoc.documentType}</div>
          </div>

          {/* Letter Metadata */}
          <div className="flex justify-between items-start text-xs font-medium mb-6">
            <div>
              <p>
                <strong>ที่:</strong> {generatedDoc.documentNo}
              </p>
              <p className="mt-1">
                <strong>ถึง:</strong> {generatedDoc.request?.institution?.nameThai || 'สถาบันการศึกษา'}
              </p>
            </div>
            <div className="text-right">
              <p>
                <strong>วันที่:</strong> {toThaiDate(generatedDoc.issueDate, 'long')}
              </p>
              <p className="mt-1">
                <strong>รหัสตรวจสอบ:</strong>{' '}
                <span className="font-mono font-bold text-sky-800">{generatedDoc.verificationCode}</span>
              </p>
            </div>
          </div>

          {/* Content Body */}
          <div className="text-xs leading-relaxed text-slate-800 space-y-4 mb-8">
            <p>
              ตามที่ {generatedDoc.request?.institution?.nameThai || 'สถาบันการศึกษา'} ได้มีหนังสือขอความอนุเคราะห์ส่งนักศึกษา
              สาขาวิชา {generatedDoc.request?.program?.programName || 'วิชาชีพสุขภาพ'} จำนวน{' '}
              {generatedDoc.request?.requestedStudents || 0} คน เพื่อเข้าฝึกปฏิบัติงาน ณ โรงพยาบาลปลวกแดง ในระหว่างวันที่{' '}
              {toThaiDateRange(generatedDoc.request?.requestedStartDate, generatedDoc.request?.requestedEndDate)} นั้น
            </p>

            <p>
              โรงพยาบาลปลวกแดง โดยคณะกรรมการพัฒนาแหล่งฝึกอบรม ได้พิจารณาขีดความสามารถในการรองรับและสัดส่วนอาจารย์พี่เลี้ยงแล้ว
              มีความยินดีที่จะ<strong>ตอบรับนักศึกษาเข้าฝึกปฏิบัติงาน</strong> ณ{' '}
              <strong>{generatedDoc.request?.department?.nameThai}</strong> จำนวน{' '}
              <strong>{generatedDoc.request?.approvedStudents || generatedDoc.request?.requestedStudents} คน</strong>{' '}
              ตามรายชื่อดังต่อไปนี้:
            </p>

            {/* Trainee Table */}
            <table className="w-full text-left text-xs border border-slate-300 my-3">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-12 text-center">ลำดับ</th>
                  <th className="p-2 border-r border-slate-300">รหัสนักศึกษา</th>
                  <th className="p-2 border-r border-slate-300">ชื่อ - นามสกุล</th>
                  <th className="p-2">กลุ่มงานที่ฝึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {generatedDoc.request?.requestStudents?.map((rs: any, i: number) => (
                  <tr key={i}>
                    <td className="p-2 text-center border-r border-slate-300">{i + 1}</td>
                    <td className="p-2 font-mono border-r border-slate-300">{rs.student.studentCode}</td>
                    <td className="p-2 border-r border-slate-300 font-semibold">
                      {rs.student.prefix} {rs.student.firstName} {rs.student.lastName}
                    </td>
                    <td className="p-2">{generatedDoc.request?.department?.nameThai}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p>
              ขอให้นักศึกษาทุกคนเข้ารับการปฐมนิเทศ ณ ห้องประชุมกลุ่มงานพัฒนาบุคลากร ในวันแรกของการฝึกปฏิบัติงาน เวลา 08.00 น.
            </p>
          </div>

          {/* Verification QR Code & Signatures */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {generatedDoc.qrCodeDataUrl && (
                <img
                  src={generatedDoc.qrCodeDataUrl}
                  alt="QR Code Verification"
                  className="w-24 h-24 rounded-lg border border-slate-300 p-1"
                />
              )}
              <div className="text-[10px] text-slate-500 max-w-xs space-y-1">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>ระบบตรวจสอบความถูกต้องเอกสารดิจิทัล</span>
                </div>
                <div>สแกน QR Code หรือเข้าสู่เว็บไซต์:</div>
                <div className="font-mono text-sky-700 underline text-[9px] break-all">
                  {generatedDoc.verifyUrl}
                </div>
              </div>
            </div>

            <div className="text-center text-xs space-y-8 pr-4">
              <div>ขอแสดงความนับถือ</div>
              <div className="pt-6">
                <div className="font-bold text-slate-900">(นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">ผู้อำนวยการโรงพยาบาลปลวกแดง</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs shadow-sm">
          กรุณาเลือกคำขอและคลิก &quot;ออกหนังสือพร้อม QR Code&quot; เพื่อสร้างเอกสารราชการ
        </div>
      )}
    </div>
  );
}
