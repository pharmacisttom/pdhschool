'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { ArrowLeft, Plus, Trash2, Send, Building2, Users, Calendar } from 'lucide-react';

interface StudentInput {
  studentCode: string;
  prefix: string;
  firstName: string;
  lastName: string;
  yearLevel: number;
  phone: string;
  email: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  const [institutionId, setInstitutionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [educationLevel, setEducationLevel] = useState('ปริญญาตรี');
  const [academicYear, setAcademicYear] = useState('2569');
  const [semester, setSemester] = useState('1');
  const [requestedStartDate, setRequestedStartDate] = useState('2026-10-01');
  const [requestedEndDate, setRequestedEndDate] = useState('2026-10-31');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [coordinatorEmail, setCoordinatorEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [students, setStudents] = useState<StudentInput[]>([
    { studentCode: '', prefix: 'นาย', firstName: '', lastName: '', yearLevel: 4, phone: '', email: '' },
  ]);

  useEffect(() => {
    fetch('/api/institutions').then((r) => r.json()).then((d) => setInstitutions(d.data || []));
    fetch('/api/departments').then((r) => r.json()).then((d) => setDepartments(d.data || []));
    fetch('/api/programs').then((r) => r.json()).then((d) => setPrograms(d.data || []));
  }, []);

  const addStudentRow = () => {
    setStudents([
      ...students,
      { studentCode: '', prefix: 'นาย', firstName: '', lastName: '', yearLevel: 4, phone: '', email: '' },
    ]);
  };

  const removeStudentRow = (index: number) => {
    if (students.length === 1) return;
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index: number, field: keyof StudentInput, value: any) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!institutionId || !departmentId || !coordinatorName || !coordinatorPhone || !coordinatorEmail) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
      return;
    }

    const invalidStudents = students.filter((s) => !s.studentCode.trim() || !s.firstName.trim() || !s.lastName.trim());
    if (invalidStudents.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลนักศึกษาไม่ครบ',
        text: 'กรุณากรอกรหัสนักศึกษา และชื่อ-นามสกุล ของนักศึกษาทุกคนในรายการ',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          departmentId,
          programId: programId || null,
          educationLevel,
          academicYear,
          semester,
          requestedStartDate,
          requestedEndDate,
          coordinatorName,
          coordinatorPhone,
          coordinatorEmail,
          notes,
          students,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ยื่นคำขอเรียบร้อยแล้ว',
          text: `เลขที่คำขอ: ${data.data?.requestNo}`,
          confirmButtonColor: '#0284c7',
        });
        router.push('/dashboard/requests');
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้างคำขอได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/requests"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ยื่นคำขอส่งนักศึกษาฝึกปฏิบัติงาน</h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            กรอกรายละเอียดคำขอ เลือกกลุ่มงาน และระบุรายชื่อนักศึกษาเพื่อขอรับการพิจารณาจัดสรรโควต้า
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Institution & Request Target */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>1. ข้อมูลสถาบันและกลุ่มงานที่ประสงค์ขอฝึก</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                สถาบันการศึกษา <span className="text-rose-500">*</span>
              </label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 text-xs"
              >
                <option value="">-- เลือกสถาบันการศึกษา --</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nameThai}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                กลุ่มงาน/แผนกที่ขอฝึก <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 text-xs"
              >
                <option value="">-- เลือกกลุ่มงาน/แผนก --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nameThai} (โควต้ามาตรฐาน {dept.defaultQuota} คน)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">หลักสูตร/วิชาชีพ</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 text-xs"
              >
                <option value="">-- เลือกหลักสูตร/วิชาชีพ (ถ้ามี) --</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.programName} ({prog.profession})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ระดับการศึกษา</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 text-xs"
              >
                <option value="ปริญญาตรี">ปริญญาตรี</option>
                <option value="ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)">ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</option>
                <option value="ประกาศนียบัตรวิชาชีพ (ปวช.)">ประกาศนียบัตรวิชาชีพ (ปวช.)</option>
                <option value="มัธยมศึกษาตอนปลาย">มัธยมศึกษาตอนปลาย</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">วันที่เริ่มฝึก</label>
              <input
                type="date"
                value={requestedStartDate}
                onChange={(e) => setRequestedStartDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">วันที่สิ้นสุดฝึก</label>
              <input
                type="date"
                value={requestedEndDate}
                onChange={(e) => setRequestedEndDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Coordinator info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-sky-600" />
            <span>2. ข้อมูลผู้ประสานงานของสถาบัน</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ชื่อผู้ประสานงาน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                required
                placeholder="ดร. สมชาย ใจดี"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={coordinatorPhone}
                onChange={(e) => setCoordinatorPhone(e.target.value)}
                required
                placeholder="038-123456"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                อีเมล <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={coordinatorEmail}
                onChange={(e) => setCoordinatorEmail(e.target.value)}
                required
                placeholder="coordinator@buu.ac.th"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Student Roster List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span>3. รายชื่อนักศึกษาที่ประสงค์ส่งฝึก ({students.length} คน)</span>
            </h2>
            <button
              type="button"
              onClick={addStudentRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold rounded-lg text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มนักศึกษา</span>
            </button>
          </div>

          <div className="space-y-3">
            {students.map((student, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs items-center"
              >
                <div>
                  <input
                    type="text"
                    required
                    placeholder="รหัสนักศึกษา *"
                    value={student.studentCode}
                    onChange={(e) => updateStudent(idx, 'studentCode', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <select
                    value={student.prefix}
                    onChange={(e) => updateStudent(idx, 'prefix', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อจริง *"
                    value={student.firstName}
                    onChange={(e) => updateStudent(idx, 'firstName', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="นามสกุล *"
                    value={student.lastName}
                    onChange={(e) => updateStudent(idx, 'lastName', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="เบอร์โทร"
                    value={student.phone}
                    onChange={(e) => updateStudent(idx, 'phone', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="อีเมล"
                    value={student.email}
                    onChange={(e) => updateStudent(idx, 'email', e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  {students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudentRow(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="ลบแถวนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Notes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="block font-bold text-slate-700 text-xs">
            หมายเหตุ / วัตถุประสงค์การฝึกเพิ่มเติม
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ระบุข้อความหรือวัตถุประสงค์เฉพาะของหลักสูตร..."
            className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/requests"
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอฝึกงาน'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
