import { RequestStatus, QuotaStatus, PlacementStatus, RoleType } from '@prisma/client';

export const REQUEST_STATUS_META: Record<RequestStatus, { labelTh: string; color: string; bg: string }> = {
  DRAFT: { labelTh: 'ฉบับร่าง', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  SUBMITTED: { labelTh: 'ยื่นคำขอแล้ว', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  UNDER_REVIEW: { labelTh: 'กำลังตรวจสอบ', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  WAITING_DEPARTMENT: { labelTh: 'รอหน่วยงานพิจารณา', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  WAITING_APPROVAL: { labelTh: 'รออนุมัติขั้นสุดท้าย', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  APPROVED: { labelTh: 'อนุมัติเรียบร้อย', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  PARTIALLY_APPROVED: { labelTh: 'อนุมัติบางส่วน', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  WAITLIST: { labelTh: 'รอคิวสำรอง', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  REJECTED: { labelTh: 'ไม่สามารถรับได้', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  CANCELLED: { labelTh: 'ยกเลิกคำขอ', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' },
  IN_TRAINING: { labelTh: 'กำลังฝึกปฏิบัติงาน', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  COMPLETED: { labelTh: 'เสร็จสิ้นการฝึก', color: 'text-green-800', bg: 'bg-green-100 border-green-300' },
};

export const QUOTA_STATUS_META: Record<QuotaStatus, { labelTh: string; color: string; bg: string }> = {
  AVAILABLE: { labelTh: 'ว่างพร้อมรับ', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  LIMITED: { labelTh: 'ใกล้เต็ม', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  FULL: { labelTh: 'เต็มแล้ว', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  CLOSED: { labelTh: 'ปิดรับสมัคร', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300' },
};

export const PLACEMENT_STATUS_META: Record<PlacementStatus, { labelTh: string; color: string; bg: string }> = {
  PENDING: { labelTh: 'รอดำเนินการ', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  APPROVED: { labelTh: 'อนุมัติแล้ว', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  WAITLIST: { labelTh: 'รายชื่อสำรอง', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ACTIVE: { labelTh: 'กำลังฝึกปฏิบัติ', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  COMPLETED: { labelTh: 'ผ่านการฝึก', color: 'text-green-800', bg: 'bg-green-100 border-green-300' },
  CANCELLED: { labelTh: 'ยกเลิก', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export const ROLE_LABELS_TH: Record<RoleType, string> = {
  SUPER_ADMIN: 'ผู้ดูแลระบบสูงสุด',
  TRAINING_ADMIN: 'ผู้ประสานงานแหล่งฝึกส่วนกลาง',
  DEPARTMENT_ADMIN: 'ผู้ดูแลประจำกลุ่มงาน',
  PRECEPTOR: 'อาจารย์พี่เลี้ยง/ผู้ควบคุมการฝึก',
  INSTITUTION: 'สถาบันการศึกษา',
  VIEWER: 'ผู้ดูรายงานทั่วไป',
};
