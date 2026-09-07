'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { RoleType } from '@prisma/client';

interface DashboardShellProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: RoleType;
    departmentName?: string | null;
    institutionName?: string | null;
  };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar user={user} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        {/* Dashboard Footer */}
        <footer className="py-3.5 px-6 border-t border-slate-200 bg-white/80 backdrop-blur text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2569 โรงพยาบาลปลวกแดง (Pluakdaeng Hospital) • PDHSCHOOL
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-mono font-bold border border-teal-200">
              v1.2.0
            </span>
            <span className="text-slate-400">•</span>
            <span>
              ผู้พัฒนา: <strong className="text-teal-900 font-bold">Tomvis</strong>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
