'use client';

import { useState, useEffect } from 'react';
import { Users, Eye, Activity, Calendar, ShieldCheck, RefreshCw } from 'lucide-react';

interface VisitorStats {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  todayUnique: number;
  onlineNow: number;
  updatedAt: string;
}

interface VisitorCounterProps {
  variant?: 'full' | 'compact' | 'dashboard';
  className?: string;
  autoTrack?: boolean;
}

export default function VisitorCounter({
  variant = 'full',
  className = '',
  autoTrack = true,
}: VisitorCounterProps) {
  const [stats, setStats] = useState<VisitorStats>({
    totalViews: 1582,
    uniqueVisitors: 641,
    todayViews: 14,
    todayUnique: 7,
    onlineNow: 2,
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  const fetchOrTrack = async (track: boolean) => {
    try {
      setLoading(true);
      const url = '/api/counter';
      const res = await fetch(url, {
        method: track ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: track
          ? JSON.stringify({
              path: typeof window !== 'undefined' ? window.location.pathname : '/',
              visitorId: typeof localStorage !== 'undefined' ? localStorage.getItem('pdh_vid') : undefined,
            })
          : undefined,
      });

      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
        if (json.data.visitorId && typeof localStorage !== 'undefined') {
          localStorage.setItem('pdh_vid', json.data.visitorId);
        }
      }
    } catch (e) {
      console.error('Failed to load visitor counter:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Record visit on initial mount
    fetchOrTrack(autoTrack);

    // Refresh every 60 seconds without re-recording duplicate views
    const interval = setInterval(() => {
      fetchOrTrack(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [autoTrack]);

  // Format number as 6 digits array e.g. "001582" -> ['0', '0', '1', '5', '8', '2']
  const formattedDigits = String(stats.totalViews).padStart(6, '0').split('');

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/80 backdrop-blur border border-teal-500/30 text-white text-xs ${className}`}
      >
        <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>ออนไลน์: {stats.onlineNow} คน</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>วันนี้: {stats.todayViews.toLocaleString()} ครั้ง</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5 text-teal-300 font-bold">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>ยอดเข้าชมสะสม: {stats.totalViews.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div
        className={`bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-teal-500/30 relative overflow-hidden ${className}`}
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">เคาน์เตอร์สถิติผู้เข้าชมเว็บแอป (Visitor Counter)</h3>
              <p className="text-xs text-teal-300">ระบบบันทึกสถิติผู้เข้าใช้งานและการรับชมระบบ PDHSCHOOL</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ออนไลน์ขณะนี้ {stats.onlineNow} คน</span>
          </div>
        </div>

        {/* Digital Odometer Display */}
        <div className="my-5 p-4 rounded-2xl bg-black/40 border border-teal-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">
              ยอดเข้าชมทั้งหมด (TOTAL PAGE VIEWS)
            </span>
            <div className="flex items-center gap-1.5">
              {formattedDigits.map((digit, idx) => (
                <div
                  key={idx}
                  className="w-8 h-11 sm:w-10 sm:h-13 bg-gradient-to-b from-slate-800 via-slate-900 to-black text-teal-300 font-mono font-black text-xl sm:text-2xl rounded-lg border border-teal-500/40 flex items-center justify-center shadow-lg shadow-teal-950/50"
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block mb-1">ผู้เข้าชมสะสม (Unique Users)</span>
            <span className="text-2xl font-black text-white font-mono">{stats.uniqueVisitors.toLocaleString()}</span>
            <span className="text-xs text-slate-400 ml-1">คน</span>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-0.5">ยอดเข้าชมวันนี้</span>
            <span className="font-bold text-teal-300 text-base font-mono">{stats.todayViews.toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 block">ครั้ง</span>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-0.5">ผู้เข้าชมวันนี้</span>
            <span className="font-bold text-sky-300 text-base font-mono">{stats.todayUnique.toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 block">คน</span>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block mb-0.5">สถานะเซิร์ฟเวอร์</span>
            <span className="font-bold text-emerald-400 text-base">Active</span>
            <span className="text-[11px] text-slate-500 block">เรียลไทม์</span>
          </div>
        </div>
      </div>
    );
  }

  // Full / Default Variant (for Landing Page)
  return (
    <div
      className={`bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-500/30 ${className}`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Header and Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-inner shrink-0">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Realtime Visitor Analytics</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              เคาน์เตอร์นับจำนวนผู้เข้าใช้งานระบบ PDHSCHOOL
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              ระบบนับจำนวนการเปิดรับชมหน้าเว็บและจำนวนผู้เข้าชมแบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Digital LED Odometer Box */}
        <div className="flex flex-col items-center md:items-end">
          <span className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-teal-400" />
            <span>ยอดเข้าชมสะสมทั้งหมด (TOTAL VISITS)</span>
          </span>
          <div className="flex items-center gap-1.5 bg-black/60 p-2 rounded-2xl border border-teal-500/40 shadow-inner">
            {formattedDigits.map((d, i) => (
              <div
                key={i}
                className="w-8 h-11 sm:w-10 sm:h-13 bg-slate-900 text-teal-400 font-mono font-black text-xl sm:text-2xl rounded-lg border border-teal-500/50 flex items-center justify-center shadow"
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">ผู้เข้าชมทั้งหมด</span>
            <span className="text-lg font-black text-white font-mono">{stats.uniqueVisitors.toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">ยอดเข้าชมวันนี้</span>
            <span className="text-lg font-black text-teal-300 font-mono">{stats.todayViews.toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 ml-1">ครั้ง</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">ผู้เข้าชมวันนี้</span>
            <span className="text-lg font-black text-white font-mono">{stats.todayUnique.toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-emerald-400 opacity-20"></span>
            <Activity className="w-5 h-5 relative" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">กำลังออนไลน์</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-lg font-black text-emerald-400 font-mono">{stats.onlineNow}</span>
              <span className="text-[11px] text-slate-500">คน</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
