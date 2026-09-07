'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PieChart,
  GraduationCap,
  Building2,
  Layers,
  Award,
  CalendarDays,
  UserCheck,
  Clock,
  ClipboardCheck,
  FolderLock,
  BarChart3,
  Users2,
  History,
  Settings,
  LogOut,
  Hospital,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ROLE_LABELS_TH } from '@/lib/utils/formatters';
import { RoleType } from '@prisma/client';

interface SidebarProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: RoleType;
    departmentName?: string | null;
    institutionName?: string | null;
  };
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  user,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: 'ต้องการออกจากระบบหรือไม่?',
      text: 'คุณจะต้องเข้าสู่ระบบใหม่เพื่อใช้งาน',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (confirm.isConfirmed) {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'คำขอฝึกงาน', href: '/dashboard/requests', icon: FileSpreadsheet },
    { label: 'โควต้า', href: '/dashboard/quotas', icon: PieChart },
    { label: 'นักศึกษา', href: '/dashboard/students', icon: GraduationCap },
    { label: 'สถานศึกษา', href: '/dashboard/institutions', icon: Building2 },
    { label: 'หน่วยงาน', href: '/dashboard/departments', icon: Layers },
    { label: 'หลักสูตร/วิชาชีพ', href: '/dashboard/programs', icon: Award },
    { label: 'การจัดสรร', href: '/dashboard/placements', icon: UserCheck },
    { label: 'ปฏิทิน', href: '/dashboard/calendar', icon: CalendarDays },
    { label: 'อาจารย์ผู้ควบคุม', href: '/dashboard/preceptors', icon: Users2 },
    { label: 'การลงเวลา', href: '/dashboard/attendance', icon: Clock },
    { label: 'การประเมิน', href: '/dashboard/evaluations', icon: ClipboardCheck },
    { label: 'เอกสาร', href: '/dashboard/documents', icon: FolderLock },
    { label: 'รายงาน', href: '/dashboard/reports', icon: BarChart3 },
    ...(user.role === 'SUPER_ADMIN'
      ? [{ label: 'ผู้ใช้งาน', href: '/dashboard/users', icon: ShieldAlert }]
      : []),
    ...(['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(user.role)
      ? [{ label: 'Audit Log', href: '/dashboard/audit', icon: History }]
      : []),
    ...(user.role === 'SUPER_ADMIN'
      ? [{ label: 'ตั้งค่า', href: '/dashboard/settings', icon: Settings }]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shrink-0 shadow-md">
              <Hospital className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <span className="font-extrabold text-lg text-white tracking-tight">PDHSCHOOL</span>
                <span className="block text-[10px] text-sky-400 font-medium truncate">
                  รพ.ปลวกแดง จ.ระยอง
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          {!collapsed ? (
            <div className="mb-3 px-2">
              <div className="font-semibold text-xs text-white truncate">{user.name}</div>
              <div className="text-[11px] text-sky-400 font-medium truncate">
                {ROLE_LABELS_TH[user.role] || user.role}
              </div>
              {user.departmentName && (
                <div className="text-[10px] text-slate-400 truncate">{user.departmentName}</div>
              )}
              {user.institutionName && (
                <div className="text-[10px] text-slate-400 truncate">{user.institutionName}</div>
              )}
            </div>
          ) : null}

          <button
            onClick={handleLogout}
            title="ออกจากระบบ"
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-all ${
              collapsed ? 'p-2' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
