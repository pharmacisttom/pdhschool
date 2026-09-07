'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Users,
  Calendar,
  FileText,
  Hospital,
} from 'lucide-react';
import { InstitutionStatus } from '@prisma/client';

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/institutions');
      const data = await res.json();
      if (data.success) {
        setInstitutions(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const filtered = institutions.filter((inst) => {
    return (
      inst.nameThai.toLowerCase().includes(search.toLowerCase()) ||
      inst.code.toLowerCase().includes(search.toLowerCase()) ||
      inst.coordinatorName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-teal-600" />
            <span>สถาบันการศึกษาคู่ความร่วมมือ (Educational Institutions)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            ทะเบียนมหาวิทยาลัย วิทยาลัย และสถาบันการศึกษา พร้อมรายละเอียดนักศึกษา ชั้นปี จำนวน ช่วงเวลา และหมายเหตุส่งฝึกอบรม
          </p>
        </div>

        <LinkInstitutionsAction onCreated={fetchInstitutions} />
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อสถาบัน, รหัสสถาบัน, ผู้ประสานงาน..."
          className="w-full text-xs sm:text-sm focus:outline-none"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            กำลังโหลดข้อมูลสถาบันการศึกษา...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            ไม่พบสถาบันการศึกษาตามเงื่อนไข
          </div>
        ) : (
          filtered.map((inst) => {
            // Parse studentDetails if present in notes
            let studentDetails: any = null;
            let noteText: string = inst.notes || '';
            if (inst.notes) {
              try {
                const parsed = JSON.parse(inst.notes);
                if (parsed.studentDetails) {
                  studentDetails = parsed.studentDetails;
                  noteText = parsed.notes || parsed.studentDetails.additionalNotes || '';
                }
              } catch {
                // Raw text note
                noteText = inst.notes;
              }
            }

            return (
              <div
                key={inst.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                      {inst.code}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        inst.status === InstitutionStatus.ACTIVE
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inst.status === InstitutionStatus.ACTIVE ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{inst.nameThai}</h3>
                  {inst.nameEnglish && (
                    <p className="text-xs text-slate-400 mb-2 font-medium">{inst.nameEnglish}</p>
                  )}

                  <div className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl space-y-1.5 border border-slate-100">
                    <div>
                      <strong>ประเภท:</strong> {inst.type}
                    </div>
                    {inst.faculty && (
                      <div>
                        <strong>คณะ/ภาควิชา:</strong> {inst.faculty}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-500 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inst.province || 'ไม่ระบุจังหวัด'}</span>
                    </div>
                  </div>

                  {/* Student Cohort Details (ชั้นปี, จำนวน, ช่วงเวลา) */}
                  {studentDetails && (
                    <div className="mb-4 p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                          <span>แผนการส่งนักศึกษา:</span>
                        </span>
                        {studentDetails.classYear && (
                          <span className="px-2 py-0.5 bg-teal-700 text-white rounded-md text-[10px] font-bold">
                            {studentDetails.classYear}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-teal-200/60">
                        <div>
                          <span className="text-slate-500 block">จำนวนที่ส่ง:</span>
                          <span className="font-bold text-teal-900 flex items-center gap-1">
                            <Users className="w-3 h-3 text-teal-600" />
                            {studentDetails.studentCount || '-'} คน
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">ชั่วโมงฝึกรวม:</span>
                          <span className="font-bold text-teal-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {studentDetails.estimatedHours || 320} ชม.
                          </span>
                        </div>
                      </div>

                      {studentDetails.targetDepartment && (
                        <div className="text-[11px] text-slate-700 pt-1">
                          <span className="text-slate-500">แผนกเป้าหมาย:</span>{' '}
                          <span className="font-medium text-teal-950">{studentDetails.targetDepartment}</span>
                        </div>
                      )}

                      {(studentDetails.trainingPeriod || studentDetails.startDate) && (
                        <div className="text-[11px] text-slate-700 flex items-start gap-1 pt-0.5">
                          <Calendar className="w-3 h-3 text-teal-700 shrink-0 mt-0.5" />
                          <span>
                            {studentDetails.trainingPeriod}{' '}
                            {studentDetails.startDate && studentDetails.endDate
                              ? `(${studentDetails.startDate} ถึง ${studentDetails.endDate})`
                              : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Notes (หมายเหตุสำหรับเพิ่มเติม) */}
                  {noteText && (
                    <div className="mb-4 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <span className="font-bold flex items-center gap-1 mb-1 text-[11px] text-amber-800">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>หมายเหตุเพิ่มเติม:</span>
                      </span>
                      <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-700 pl-4">
                        {noteText}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="font-semibold text-slate-800">
                    ผู้ประสานงาน: {inst.coordinatorName}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inst.coordinatorPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-700 truncate">
                    <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{inst.coordinatorEmail}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LinkInstitutionsAction({ onCreated }: { onCreated: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    nameThai: '',
    nameEnglish: '',
    type: 'มหาวิทยาลัยรัฐ',
    faculty: '',
    province: 'ระยอง',
    coordinatorName: '',
    coordinatorPhone: '',
    coordinatorEmail: '',
    classYear: 'ชั้นปีที่ 4',
    studentCount: 4,
    trainingPeriod: 'ผลัดที่ 1 (ภาคเรียนที่ 1/2569)',
    estimatedHours: 320,
    targetDepartment: 'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค',
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
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        nameThai: form.nameThai.trim(),
        nameEnglish: form.nameEnglish ? form.nameEnglish.trim() : null,
        type: form.type,
        faculty: form.faculty,
        province: form.province,
        coordinatorName: form.coordinatorName.trim(),
        coordinatorPhone: form.coordinatorPhone.trim(),
        coordinatorEmail: form.coordinatorEmail.trim(),
        notes: form.additionalNotes,
        studentDetails: {
          classYear: form.classYear,
          studentCount: Number(form.studentCount),
          targetDepartment: form.targetDepartment,
          trainingPeriod: form.trainingPeriod,
          estimatedHours: Number(form.estimatedHours),
          additionalNotes: form.additionalNotes,
        },
      };

      const res = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มสถาบันสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        onCreated();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถเพิ่มได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>เพิ่มสถาบันการศึกษา</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <span>เพิ่มสถาบันการศึกษาและแผนการส่งฝึก</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสสถาบัน (เช่น INST-KU) *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ประเภท *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="มหาวิทยาลัยรัฐ">มหาวิทยาลัยรัฐ</option>
                    <option value="มหาวิทยาลัยเอกชน">มหาวิทยาลัยเอกชน</option>
                    <option value="สถาบันพระบรมราชชนก">สถาบันพระบรมราชชนก</option>
                    <option value="สถาบันอาชีวศึกษา">สถาบันอาชีวศึกษา</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อสถาบันการศึกษา *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มหาวิทยาลัยบูรพา"
                  value={form.nameThai}
                  onChange={(e) => setForm({ ...form, nameThai: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">คณะ / สาขาวิชา</label>
                <input
                  type="text"
                  placeholder="เช่น คณะเภสัชศาสตร์"
                  value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Student details, class year, count, period */}
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-2.5">
                <span className="font-bold text-teal-900 block text-xs">
                  รายละเอียดนักศึกษา ชั้นปี จำนวน และช่วงเวลา:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ชั้นปี *</label>
                    <select
                      value={form.classYear}
                      onChange={(e) => setForm({ ...form, classYear: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold text-teal-900"
                    >
                      <option value="ชั้นปีที่ 1">ชั้นปีที่ 1</option>
                      <option value="ชั้นปีที่ 2">ชั้นปีที่ 2</option>
                      <option value="ชั้นปีที่ 3">ชั้นปีที่ 3</option>
                      <option value="ชั้นปีที่ 4">ชั้นปีที่ 4</option>
                      <option value="ชั้นปีที่ 5">ชั้นปีที่ 5</option>
                      <option value="ชั้นปีที่ 6">ชั้นปีที่ 6</option>
                      <option value="ระดับ ปวช.">ระดับ ปวช.</option>
                      <option value="ระดับ ปวส.">ระดับ ปวส.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">จำนวนนักศึกษา (คน) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.studentCount}
                      onChange={(e) => setForm({ ...form, studentCount: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold text-center text-teal-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">รอบ/ผลัดการฝึก</label>
                    <input
                      type="text"
                      placeholder="เช่น ผลัดที่ 1/2569"
                      value={form.trainingPeriod}
                      onChange={(e) => setForm({ ...form, trainingPeriod: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ชั่วโมงฝึกรวม</label>
                    <input
                      type="number"
                      value={form.estimatedHours}
                      onChange={(e) => setForm({ ...form, estimatedHours: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">กลุ่มงานเป้าหมาย</label>
                  <select
                    value={form.targetDepartment}
                    onChange={(e) => setForm({ ...form, targetDepartment: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุสำหรับเพิ่มเติม</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ข้อกำหนดเฉพาะของหลักสูตร หรือการขอความอนุเคราะห์ที่พัก"
                  value={form.additionalNotes}
                  onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อผู้ประสานงาน *</label>
                <input
                  type="text"
                  required
                  value={form.coordinatorName}
                  onChange={(e) => setForm({ ...form, coordinatorName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    required
                    value={form.coordinatorPhone}
                    onChange={(e) => setForm({ ...form, coordinatorPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อีเมล *</label>
                  <input
                    type="email"
                    required
                    value={form.coordinatorEmail}
                    onChange={(e) => setForm({ ...form, coordinatorEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20"
                >
                  บันทึกสถาบัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
