'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  GraduationCap,
  Users,
  Clock,
  CheckCircle2,
  PieChart as PieIcon,
  Building2,
  School,
  TrendingUp,
  Filter,
} from 'lucide-react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

interface DashboardAnalyticsProps {
  user?: {
    role: string;
    name?: string;
    departmentName?: string | null;
    institutionName?: string | null;
  };
  kpis: {
    totalStudentsThisYear: number;
    currentlyActiveCount: number;
    pendingRequestsCount: number;
    approvedRequestsCount: number;
    remainingQuotaCount: number;
    totalMaxQuota: number;
    departmentsCount: number;
    institutionsCount: number;
  };
  charts: {
    studentsByMonth: { month: string; students: number }[];
    studentsByDepartment: { name: string; count: number }[];
    studentsByInstitution: { name: string; count: number }[];
    studentsByProfession: { name: string; value: number }[];
    quotaOccupancy: { name: string; approved: number; remaining: number; max: number }[];
    requestStatusData: { name: string; value: number }[];
  };
}

export default function DashboardAnalytics({ user, kpis, charts }: DashboardAnalyticsProps) {
  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ภาพรวมระบบบริหารจัดการแหล่งฝึกงาน (Dashboard)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            โรงพยาบาลปลวกแดง • ข้อมูลสถิติและการจัดสรรโควต้าประจำปีงบประมาณ 2569
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>ระบบออนไลน์ปกติ • ซิงก์ข้อมูลเรียลไทม์</span>
        </div>
      </div>

      {/* Role & Scope Transparency Banner */}
      {user && (
        <div
          className={`rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            ['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
              ? 'bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 border-sky-700/60 text-white'
              : user.role === 'DEPARTMENT_ADMIN'
              ? 'bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 border-teal-600/60 text-white'
              : 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg shadow-inner">
              {['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
                ? '👑'
                : user.role === 'DEPARTMENT_ADMIN'
                ? '🏥'
                : '👤'}
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>
                  {['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
                    ? 'สิทธิ์ผู้ดูแลระบบส่วนกลาง (Central Hospital Administrator)'
                    : user.role === 'DEPARTMENT_ADMIN'
                    ? `สิทธิ์ผู้ดูแลกลุ่มงาน: ${user.departmentName || 'กลุ่มงานของคุณ'}`
                    : user.role === 'INSTITUTION'
                    ? `สิทธิ์สถาบันการศึกษา: ${user.institutionName || 'สถาบันของคุณ'}`
                    : 'สิทธิ์ผู้ใช้งาน'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-white/20 border border-white/20">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
                  ? 'คุณสามารถตรวจสอบและบริหารจัดการข้อมูลได้ครบทุกกลุ่มงาน (16 กลุ่มงาน), ทุกหลักสูตร และทุกสถาบันทั่วทั้งโรงพยาบาล'
                  : user.role === 'DEPARTMENT_ADMIN'
                  ? `ระบบจำกัดขอบเขตการแสดงผลเฉพาะงานของกลุ่มงาน "${user.departmentName || 'ของคุณ'}" เท่านั้น เพื่อความปลอดภัยและความเป็นส่วนตัว`
                  : 'แสดงผลเฉพาะข้อมูลที่ได้รับมอบหมายตามสิทธิ์ของคุณ'}
              </p>
            </div>
          </div>
          {user.name && (
            <div className="text-right text-xs text-slate-300 hidden sm:block">
              <span className="font-semibold text-white">{user.name}</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid (7 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.totalStudentsThisYear}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">นักศึกษาทั้งหมดปีนี้</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{kpis.currentlyActiveCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">กำลังฝึกปฏิบัติงาน</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-amber-600">{kpis.pendingRequestsCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">คำขอรอพิจารณา</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{kpis.approvedRequestsCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">คำขออนุมัติแล้ว</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
            <PieIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-teal-700">{kpis.remainingQuotaCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">
            โควต้าคงเหลือ (จาก {kpis.totalMaxQuota})
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-purple-700">{kpis.departmentsCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">หน่วยงานรับฝึก</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
            <School className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-sky-700">{kpis.institutionsCount}</div>
          <div className="text-xs font-semibold text-slate-500 mt-1">สถานศึกษาคู่ร่วม</div>
        </div>
      </div>

      {/* Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Students by Month (Line / Area) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                1. จำนวนนักศึกษาฝึกงานจำแนกรายเดือน (ปีงบประมาณ 2569)
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">รอบการฝึกตั้งแต่ ต.ค. 2569 - ก.ย. 2570</p>
            </div>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.studentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284c7' }}
                  name="จำนวนนักศึกษา (คน)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Students by Department (Bar) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                2. การกระจายตัวนักศึกษาตามกลุ่มงาน/แผนก
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">กลุ่มงานที่มีนักศึกษาเข้าฝึกมากที่สุด</p>
            </div>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.studentsByDepartment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="จำนวนนักศึกษา (คน)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Students by Institution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                3. นักศึกษาจำแนกตามสถาบันการศึกษา
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">มหาวิทยาลัยและวิทยาลัยคู่ความร่วมมือ</p>
            </div>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <School className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.studentsByInstitution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} name="จำนวนนักศึกษา (คน)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Students by Profession (Pie / Donut) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                4. สัดส่วนนักศึกษาตามสาขาวิชาชีพ
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">เภสัชกรรม, พยาบาล, เทคนิคการแพทย์ ฯลฯ</p>
            </div>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <PieIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.studentsByProfession}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {charts.studentsByProfession.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Training Quota Occupancy (Stacked Bar) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                5. อัตราครองโควต้าจำแนกตามกลุ่มงาน (Training Quota Occupancy)
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                เปรียบเทียบที่นั่งอนุมัติแล้ว (Approved) กับที่นั่งคงเหลือ (Remaining) ป้องกัน Overbooking
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.quotaOccupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="approved" stackId="a" fill="#0284c7" name="อนุมัติแล้ว (ที่นั่ง)" />
                <Bar dataKey="remaining" stackId="a" fill="#e2e8f0" name="โควต้าคงเหลือ (ที่นั่ง)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
