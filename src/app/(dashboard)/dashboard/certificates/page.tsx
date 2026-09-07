'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Award,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Building2,
  GraduationCap,
  FileCheck,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Eye,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';

interface CertificateRecord {
  placementId: string;
  placementStatus: string;
  student: {
    id: string;
    studentCode: string;
    prefix: string;
    firstName: string;
    lastName: string;
    fullName: string;
    faculty?: string | null;
    program?: string | null;
    institutionName: string;
  };
  department: {
    id: string;
    nameThai: string;
    code: string;
  };
  preceptor?: {
    id: string;
    name: string;
    position: string;
  } | null;
  trainingPeriod: {
    startDate: string;
    endDate: string;
    thaiStartDate: string;
    thaiEndDate: string;
    totalDays: number;
    totalHours: number;
    attendanceDays: number;
  };
  evaluation?: {
    grade?: string | null;
    totalScore?: number | null;
    percentageScore?: number | null;
    status?: string | null;
  } | null;
  certificate?: {
    id: string;
    verificationCode: string;
    documentNo: string;
    issueDate: string;
    thaiIssueDate: string;
    title: string;
    qrCodeDataUrl?: string;
  } | null;
}

export default function CertificatesPage() {
  const [data, setData] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ISSUED' | 'PENDING'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<CertificateRecord | null>(null);
  const [issuingPlacementId, setIssuingPlacementId] = useState<string | null>(null);
  const [directorInfo, setDirectorInfo] = useState<{
    directorName: string;
    directorPosition: string;
    signatureUrl: string;
    showSignature: boolean;
  }>({
    directorName: 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง',
    directorPosition: 'ผู้อำนวยการโรงพยาบาลปลวกแดง',
    signatureUrl: '/signatures/director_signature.svg',
    showSignature: true,
  });

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/certificates');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetch('/api/settings/signature')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setDirectorInfo(d.data);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleIssueCertificate = async (item: CertificateRecord) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการออกใบประกาศนียบัตร?',
      html: `
        <div class="text-left text-sm space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <p><strong>นักศึกษา:</strong> ${item.student.fullName} (${item.student.studentCode})</p>
          <p><strong>สถานศึกษา:</strong> ${item.student.institutionName}</p>
          <p><strong>กลุ่มงาน:</strong> ${item.department.nameThai}</p>
          <p><strong>ชั่วโมงการฝึก:</strong> ${item.trainingPeriod.totalHours} ชั่วโมง</p>
          <p><strong>ผลประเมิน:</strong> เกรด ${item.evaluation?.grade || 'ดีเยี่ยม (A)'}</p>
        </div>
        <p class="text-xs text-slate-500 mt-3">ระบบจะสร้างเลขที่เอกสารทางการ รหัสตรวจสอบดิจิทัล และคิวอาร์โค้ด</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ออกใบประกาศนียบัตร',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    try {
      setIssuingPlacementId(item.placementId);
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId: item.placementId,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: json.error?.message || 'ไม่สามารถออกใบประกาศได้',
          confirmButtonColor: '#0f766e',
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'ออกใบประกาศนียบัตรสำเร็จ!',
          text: `เลขที่เอกสาร: ${json.data.documentNo || json.data.documentNo}`,
          confirmButtonColor: '#0f766e',
        });
        await fetchCertificates();

        // Auto open preview modal
        const updated = await fetch(`/api/certificates?code=${json.data.verificationCode}`).then((r) => r.json());
        if (updated.success) {
          // Open view
          setSelectedRecord({
            ...item,
            certificate: {
              id: json.data.id,
              verificationCode: json.data.verificationCode,
              documentNo: json.data.documentNo,
              issueDate: json.data.issueDate,
              thaiIssueDate: item.trainingPeriod.thaiEndDate,
              title: json.data.title,
              qrCodeDataUrl: json.data.qrCodeDataUrl,
            },
          });
        }
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้',
      });
    } finally {
      setIssuingPlacementId(null);
    }
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.nameThai.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ISSUED') return Boolean(item.certificate);
    if (filterStatus === 'PENDING') return !item.certificate;
    return true;
  });

  const totalCount = data.length;
  const issuedCount = data.filter((d) => Boolean(d.certificate)).length;
  const pendingCount = totalCount - issuedCount;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 p-6 rounded-3xl text-white shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-teal-400/40 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-1 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ระบบเอกสารรับรองมาตรฐาน รพ.ปลวกแดง</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              ระบบออกใบประกาศนียบัตร (Official Certificates)
            </h1>
            <p className="text-sm text-slate-300 mt-0.5">
              พิมพ์ใบประกาศนียบัตรผ่านการฝึกปฏิบัติงานคลินิก พร้อมตราสัญลักษณ์โรงพยาบาลปลวกแดงและระบบ QR Code ยืนยันความถูกต้อง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={fetchCertificates}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-medium transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">นักศึกษาที่ฝึกจบ/พร้อมออกใบ</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCount} คน</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ออกใบประกาศนียบัตรแล้ว</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{issuedCount} ใบ</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">รอการออกใบประกาศ</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount} คน</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสนักศึกษา, คณะ, กลุ่มงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('ISSUED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'ISSUED'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ออกแล้ว ({issuedCount})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            รอออก ({pendingCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">นักศึกษา</th>
                <th className="px-5 py-3.5">สถาบัน / สาขาวิชา</th>
                <th className="px-5 py-3.5">กลุ่มงานที่ฝึก</th>
                <th className="px-5 py-3.5 text-center">ระยะเวลา & ชั่วโมง</th>
                <th className="px-5 py-3.5 text-center">ผลการประเมิน</th>
                <th className="px-5 py-3.5 text-center">สถานะใบประกาศ</th>
                <th className="px-5 py-3.5 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                    กำลังโหลดข้อมูลใบประกาศนียบัตร...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Award className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    ไม่พบรายการนักศึกษาที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isIssued = Boolean(item.certificate);
                  const isIssuing = issuingPlacementId === item.placementId;

                  return (
                    <tr key={item.placementId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{item.student.fullName}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          รหัส: {item.student.studentCode}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{item.student.institutionName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.student.faculty || 'คณะทั่วไป'} {item.student.program ? `• ${item.student.program}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{item.department.nameThai}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="font-bold text-slate-800">{item.trainingPeriod.totalHours} ชม.</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.trainingPeriod.attendanceDays} วันทำการ
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {item.evaluation?.grade ? (
                          <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                            เกรด {item.evaluation.grade}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                            รอส่งผลประเมิน
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isIssued ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ออกแล้ว</span>
                            </span>
                            <div className="text-[11px] font-mono text-slate-500 mt-1">
                              {item.certificate?.documentNo}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>ยังไม่ออก</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isIssued ? (
                            <button
                              onClick={() => setSelectedRecord(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดู / พิมพ์ใบประกาศ</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleIssueCertificate(item)}
                              disabled={isIssuing}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{isIssuing ? 'กำลังออก...' : 'ออกใบประกาศ'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Preview & Print Modal */}
      {selectedRecord && selectedRecord.certificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
          {/* Modal Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-5xl w-full overflow-hidden flex flex-col my-8 print:my-0 print:border-none print:shadow-none print:max-w-none">
            {/* Modal Controls Toolbar (Hidden when printing) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white p-1">
                  <img src="/logo.png" alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">ใบประกาศนียบัตรผ่านการฝึกอบรม (Certificate Preview)</h3>
                  <p className="text-xs text-teal-400 font-mono">
                    เลขที่: {selectedRecord.certificate.documentNo} • รหัส: {selectedRecord.certificate.verificationCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/verify/${selectedRecord.certificate.verificationCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-teal-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-all border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ตรวจสอบสาธารณะ</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์ใบประกาศ (Print / PDF)</span>
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Frame (A4 Landscape Formatted) */}
            <div className="p-8 sm:p-12 print:p-8 bg-gradient-to-b from-amber-50/20 via-white to-teal-50/20">
              <div className="relative border-8 border-teal-800/80 rounded-2xl p-8 sm:p-12 text-center bg-white shadow-xl print:shadow-none print:border-teal-800">
                {/* Decorative Inner Golden/Teal Border */}
                <div className="absolute inset-2 border-2 border-amber-600/40 rounded-xl pointer-events-none" />
                <div className="absolute inset-3 border border-teal-700/30 rounded-lg pointer-events-none" />

                {/* Hospital Official Logo */}
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-2 border-2 border-teal-600 shadow-md flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="ตราสัญลักษณ์โรงพยาบาลปลวกแดง"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-700 uppercase tracking-wider">
                    กระทรวงสาธารณสุข
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-teal-900">
                    โรงพยาบาลปลวกแดง จังหวัดระยอง
                  </div>
                </div>

                {/* Certificate Title */}
                <div className="my-5">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-teal-950 tracking-tight font-serif">
                    ใบประกาศนียบัตร
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-amber-700 uppercase tracking-widest mt-1">
                    CERTIFICATE OF CLINICAL TRAINING COMPLETION
                  </p>
                </div>

                {/* Wording */}
                <div className="space-y-4 max-w-2xl mx-auto my-6 text-slate-800 leading-relaxed">
                  <p className="text-base sm:text-lg text-slate-600 font-medium">
                    ใบประกาศนียบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า
                  </p>

                  <div className="text-2xl sm:text-3xl font-black text-teal-900 border-b-2 border-teal-800/30 pb-2 inline-block px-8">
                    {selectedRecord.student.fullName}
                  </div>

                  <p className="text-sm sm:text-base text-slate-700">
                    รหัสนักศึกษา <span className="font-bold text-slate-900 font-mono">{selectedRecord.student.studentCode}</span>{' '}
                    {selectedRecord.student.faculty ? `คณะ${selectedRecord.student.faculty}` : ''}{' '}
                    {selectedRecord.student.program ? `สาขา${selectedRecord.student.program}` : ''}
                    <br />
                    <span className="font-semibold text-teal-950">{selectedRecord.student.institutionName}</span>
                  </p>

                  <p className="text-base sm:text-lg text-slate-800">
                    ได้สำเร็จการฝึกปฏิบัติงานวิชาชีพ ณ{' '}
                    <span className="font-bold text-teal-900">{selectedRecord.department.nameThai}</span>
                    <br />
                    โรงพยาบาลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง
                  </p>

                  <p className="text-sm sm:text-base text-slate-700">
                    ตั้งแต่วันที่ <span className="font-semibold">{selectedRecord.trainingPeriod.thaiStartDate}</span> ถึงวันที่{' '}
                    <span className="font-semibold">{selectedRecord.trainingPeriod.thaiEndDate}</span>
                    <br />
                    รวมระยะเวลาฝึกปฏิบัติงานทั้งสิ้น{' '}
                    <span className="font-bold text-teal-900">{selectedRecord.trainingPeriod.totalHours} ชั่วโมง</span>
                    {selectedRecord.evaluation?.grade && (
                      <span>
                        {' '}
                        • ผลการประเมิน:{' '}
                        <span className="font-bold text-emerald-800">
                          ระดับ {selectedRecord.evaluation.grade}
                        </span>
                      </span>
                    )}
                  </p>

                  <p className="text-sm sm:text-base text-teal-900 font-medium italic mt-2">
                    ขออำนวยอวยพรให้มีความสุข สวัสดิภาพ และประสบความสำเร็จในวิชาชีพสืบไป
                  </p>
                </div>

                {/* Signatures & Verification Section */}
                <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-3 items-end gap-4">
                  {/* Left: Verification QR */}
                  <div className="flex flex-col items-center sm:items-start text-left">
                    {selectedRecord.certificate.qrCodeDataUrl ? (
                      <div className="bg-white p-2 rounded-xl border border-teal-200 shadow-sm flex flex-col items-center">
                        <img
                          src={selectedRecord.certificate.qrCodeDataUrl}
                          alt="Verification QR Code"
                          className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                        />
                        <span className="text-[10px] text-teal-800 font-bold mt-1">สแกนตรวจสอบเอกสาร</span>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <QrCode className="w-8 h-8" />
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono mt-1.5">
                      <div>เลขที่: {selectedRecord.certificate.documentNo}</div>
                      <div>รหัส: {selectedRecord.certificate.verificationCode}</div>
                    </div>
                  </div>

                  {/* Middle: Preceptor / Department Head */}
                  <div className="flex flex-col items-center">
                    <div className="w-40 border-b border-slate-400 mb-2 h-10 flex items-end justify-center">
                      <span className="font-serif italic text-sm text-slate-400">(ลงชื่อ)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      ({selectedRecord.preceptor?.name || 'หัวหน้ากลุ่มงาน / อาจารย์ผู้ควบคุม'})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedRecord.preceptor?.position || 'อาจารย์ผู้ควบคุมการฝึกปฏิบัติงาน'}
                    </p>
                  </div>

                  {/* Right: Hospital Director */}
                  <div className="flex flex-col items-center">
                    <div className="w-48 border-b border-slate-400 mb-2 h-14 flex items-end justify-center relative">
                      {(directorInfo.showSignature && ((selectedRecord.certificate as any)?.signers?.director?.signatureUrl || directorInfo.signatureUrl)) ? (
                        <img
                          src={(selectedRecord.certificate as any)?.signers?.director?.signatureUrl || directorInfo.signatureUrl}
                          alt="ลายเซ็นต์ผู้อำนวยการโรงพยาบาล"
                          className="max-h-12 max-w-[150px] object-contain mb-0.5 select-none pointer-events-none"
                        />
                      ) : (
                        <span className="font-serif italic text-sm text-slate-400">(ลงนามผู้อำนวยการ)</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900">
                      ({(selectedRecord.certificate as any)?.signers?.director?.name || directorInfo.directorName || 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง'})
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {(selectedRecord.certificate as any)?.signers?.director?.position || directorInfo.directorPosition || 'ผู้อำนวยการโรงพยาบาลปลวกแดง'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      ให้ไว้ ณ วันที่ {selectedRecord.certificate.thaiIssueDate || selectedRecord.trainingPeriod.thaiEndDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles for A4 Landscape */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          header, aside, nav, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
