'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ClipboardCheck, Star, Award, CheckCircle2, UserCheck, Plus } from 'lucide-react';
import { toThaiDate } from '@/lib/utils/date';

interface CriterionScore {
  category: string;
  criterionName: string;
  maxScore: number;
  score: number;
  comment: string;
}

const EVALUATION_CATEGORIES = [
  { category: 'knowledge', name: 'ความรู้ทางวิชาการและการประยุกต์ใช้ (Knowledge)' },
  { category: 'practical_skills', name: 'ทักษะการปฏิบัติงานและการแก้ปัญหา (Practical Skills)' },
  { category: 'responsibility', name: 'ความรับผิดชอบและการตรงต่อเวลา (Responsibility)' },
  { category: 'communication', name: 'การสื่อสารและปฏิสัมพันธ์กับผู้ป่วย/ทีม (Communication)' },
  { category: 'teamwork', name: 'การทำงานร่วมกับสหวิชาชีพ (Teamwork)' },
  { category: 'professionalism', name: 'บุคลิกภาพและความเป็นมืออาชีพ (Professionalism)' },
  { category: 'safety', name: 'การปฏิบัติตามมาตรฐานความปลอดภัย (Patient Safety)' },
  { category: 'ethics', name: 'จริยธรรมและเจตคติต่อวิชาชีพ (Ethics & Attitude)' },
];

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlacementId, setSelectedPlacementId] = useState('');
  const [qualitativeFeedback, setQualitativeFeedback] = useState('');

  const [scores, setScores] = useState<CriterionScore[]>(
    EVALUATION_CATEGORIES.map((c) => ({
      category: c.category,
      criterionName: c.name,
      maxScore: 10,
      score: 9,
      comment: '',
    }))
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resE, resP] = await Promise.all([
        fetch('/api/evaluations'),
        fetch('/api/placements'),
      ]);
      const dataE = await resE.json();
      const dataP = await resP.json();

      if (dataE.success) setEvaluations(dataE.data || []);
      if (dataP.success) setPlacements(dataP.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalScore = scores.reduce((sum, s) => sum + Number(s.score || 0), 0);
  const maxScore = scores.reduce((sum, s) => sum + Number(s.maxScore || 10), 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const updateScore = (index: number, val: number) => {
    const updated = [...scores];
    updated[index].score = val;
    setScores(updated);
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlacementId) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกนักศึกษาที่ต้องการประเมิน' });
      return;
    }

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId: selectedPlacementId,
          scores,
          qualitativeFeedback,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกผลการประเมินสำเร็จ',
          text: `เกรดที่ได้: ${data.data?.grade} (${data.data?.percentageScore}%)`,
          confirmButtonColor: '#0284c7',
        });
        setShowModal(false);
        fetchData();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้', text: data.error?.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาดระบบ' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-sky-600" />
            <span>ระบบประเมินผลการฝึกอบรม (Student Evaluations)</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            แบบประเมินสมรรถนะวิชาชีพ 8 ด้าน พร้อมระบบคำนวณคะแนนและตัดเกรดอัตโนมัติ
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>ทำแบบประเมินนักศึกษา</span>
        </button>
      </div>

      {/* Evaluations List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="font-bold text-xs text-slate-700">
            รายการประเมินที่บันทึกแล้วทั้งหมด ({evaluations.length} รายการ)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-5 py-3.5">นักศึกษา</th>
                <th className="px-5 py-3.5">กลุ่มงาน</th>
                <th className="px-5 py-3.5">ผู้ประเมิน</th>
                <th className="px-5 py-3.5 text-center">คะแนนรวม</th>
                <th className="px-5 py-3.5 text-center">ร้อยละ</th>
                <th className="px-5 py-3.5 text-center">ระดับเกรด</th>
                <th className="px-5 py-3.5">วันที่ประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลการประเมิน...
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    ยังไม่มีรายการประเมินผลในระบบ
                  </td>
                </tr>
              ) : (
                evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {ev.placement.student.prefix} {ev.placement.student.firstName}{' '}
                      {ev.placement.student.lastName}
                      <div className="text-[11px] font-mono text-slate-400">
                        {ev.placement.student.studentCode} ({ev.placement.student.institution.nameThai})
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {ev.placement.department.nameThai}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{ev.preceptor?.name || '-'}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {ev.totalScore} / {ev.maxScore}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-sky-700">
                      {ev.percentageScore}%
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        {ev.grade}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{toThaiDate(ev.evaluationDate, 'short')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Evaluation Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-sky-600" />
                <span>แบบประเมินสมรรถนะนักศึกษาฝึกงาน (8 ด้าน)</span>
              </h2>
              <div className="text-xs font-extrabold text-sky-700 bg-sky-50 px-3 py-1 rounded-full">
                คะแนนรวม: {totalScore}/{maxScore} ({percentage.toFixed(1)}%)
              </div>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">เลือกนักศึกษาที่ต้องการประเมิน *</label>
                <select
                  required
                  value={selectedPlacementId}
                  onChange={(e) => setSelectedPlacementId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- เลือกนักศึกษา --</option>
                  {placements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.student.studentCode} - {p.student.prefix} {p.student.firstName} {p.student.lastName} ({p.department.nameThai})
                    </option>
                  ))}
                </select>
              </div>

              {/* 8 Categories Scoring */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {scores.map((sc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{sc.criterionName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={sc.score}
                        onChange={(e) => updateScore(idx, parseInt(e.target.value))}
                        className="w-24 accent-sky-600"
                      />
                      <span className="w-8 text-center font-bold text-slate-900 bg-white py-1 px-1.5 rounded-lg border border-slate-300">
                        {sc.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ข้อเสนอแนะเชิงคุณภาพ / จุดเด่น / สิ่งที่ควรพัฒนา</label>
                <textarea
                  rows={3}
                  value={qualitativeFeedback}
                  onChange={(e) => setQualitativeFeedback(e.target.value)}
                  placeholder="เช่น นักศึกษามีความกระตือรือร้นในการเรียนรู้ ปฏิบัติงานตามมาตรฐานความปลอดภัยได้ดี..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
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
                  className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-600/20"
                >
                  บันทึกผลการประเมิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
