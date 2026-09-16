'use client';

import { ShieldAlert, DollarSign, Activity } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  gmvTotalUsd?: number;
  netMarginPct?: number;
}

export default function AdminHeader({
  title,
  subtitle,
  gmvTotalUsd = 1450000,
  netMarginPct = 62.5,
}: AdminHeaderProps) {
  return (
    <header className="liquid-glass specular-edge px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-20 text-white backdrop-blur-2xl bg-slate-950/60 border-b border-white/10 shadow-2xl">
      <div>
        <div className="flex items-center space-x-2">
          <span className="liquid-pill px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-purple-300 border-purple-500/30 flex items-center space-x-1.5 shadow-xs">
            <ShieldAlert className="w-3 h-3 text-purple-400" />
            <span>Root Scope · Super Admin</span>
          </span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1.5 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Total GMV Liquid Pill */}
        <div className="liquid-pill flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold text-slate-300">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Attested PO Volume: <strong className="text-white font-mono">${gmvTotalUsd.toLocaleString()}</strong>
          </span>
        </div>

        {/* Contribution Margin Liquid Pill */}
        <div className="liquid-pill flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span>Net Margin: {netMarginPct}%</span>
        </div>
      </div>
    </header>
  );
}
