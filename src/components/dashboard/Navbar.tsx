'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Bell, Hospital, User, CheckCircle2 } from 'lucide-react';
import { ROLE_LABELS_TH } from '@/lib/utils/formatters';
import { RoleType } from '@prisma/client';

interface NavbarProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: RoleType;
    departmentName?: string | null;
  };
  onOpenMobile: () => void;
}

export default function Navbar({ user, onOpenMobile }: NavbarProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate breadcrumb from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    dashboard: 'แดชบอร์ด',
    requests: 'คำขอฝึกงาน',
    quotas: 'โควต้าการรับ',
    students: 'ทะเบียนนักศึกษา',
    institutions: 'สถาบันการศึกษา',
    departments: 'กลุ่มงาน/แผนก',
    programs: 'หลักสูตร/วิชาชีพ',
    placements: 'การจัดสรรแหล่งฝึก',
    calendar: 'ปฏิทินการฝึกอบรม',
    preceptors: 'อาจารย์ผู้ควบคุม',
    attendance: 'บันทึกเวลาฝึกงาน',
    evaluations: 'การประเมินผล',
    documents: 'เอกสารและหนังสือ',
    reports: 'รายงานและสถิติ',
    users: 'จัดการผู้ใช้งาน',
    audit: 'Audit Log',
    settings: 'ตั้งค่าระบบ',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-sky-700">
            PDHSCHOOL
          </Link>
          {pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const label = breadcrumbMap[segment] || segment;
            return (
              <span key={segment} className="flex items-center gap-1.5">
                <span className="text-slate-300">/</span>
                <span className={isLast ? 'font-bold text-slate-900' : 'hover:text-sky-700'}>
                  {label}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาด่วน (คำขอ, นักศึกษา, หน่วยงาน)..."
            className="w-64 pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Notification Bell with Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-sky-600 absolute top-2 right-2 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                <span>การแจ้งเตือน</span>
                <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-semibold">
                  ล่าสุด
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="font-semibold text-slate-800 mb-0.5">มีคำขอฝึกงานใหม่ TR-2569-000001</div>
                  <div className="text-slate-500 text-[11px]">ม.บูรพา ส่งคำขอฝึกเภสัชกรรม (2 คน)</div>
                  <div className="text-[10px] text-slate-400 mt-1">10 นาทีที่แล้ว</div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="font-semibold text-slate-800 mb-0.5">โควต้าเภสัชกรรมใกล้เต็ม</div>
                  <div className="text-slate-500 text-[11px]">รอบ ต.ค. 2569 เหลือ 2 ที่นั่ง (66% ครองโควต้า)</div>
                  <div className="text-[10px] text-slate-400 mt-1">1 ชั่วโมงที่แล้ว</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-blue-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="font-bold text-xs text-slate-800">{user.name}</div>
            <div className="text-[10px] text-sky-700 font-semibold">{ROLE_LABELS_TH[user.role]}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
