'use client';

import { ShieldAlert, DollarSign, Activity, AlertCircle } from 'lucide-react';

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
    <header className="bg-slate-950 border-b border-slate-800/80 px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-20 text-white backdrop-blur-xl bg-slate-950/90 shadow-md">
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-purple-400" />
            <span>Root Scope · Super Admin</span>
          </span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Total GMV Pill */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Attested PO Volume: <strong className="text-white">${gmvTotalUsd.toLocaleString()}</strong>
          </span>
        </div>

        {/* Contribution Margin Pill */}
        <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Net Contribution Margin: {netMarginPct}%</span>
        </div>
      </div>
    </header>
  );
}
