'use client';

import { Users, Clock, AlertCircle } from 'lucide-react';

interface OperatorHeaderProps {
  title: string;
  subtitle?: string;
  activeCount?: number;
  urgentSlaCount?: number;
}

export default function OperatorHeader({
  title,
  subtitle,
  activeCount = 11,
  urgentSlaCount = 1,
}: OperatorHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
            Staff Operator View
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Book Count Pill */}
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            Book: <strong className="text-slate-900">{activeCount} Members</strong> (Max 15)
          </span>
        </div>

        {/* SLA Urgency Pill */}
        {urgentSlaCount > 0 ? (
          <div className="flex items-center space-x-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full text-xs font-bold text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>{urgentSlaCount} SLA At Risk (&gt;50% behind)</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>All SLAs On Schedule</span>
          </div>
        )}
      </div>
    </header>
  );
}
