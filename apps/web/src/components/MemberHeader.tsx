'use client';

import { Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';

interface MemberHeaderProps {
  title: string;
  subtitle?: string;
  attemptsDelivered?: number;
  attemptsOwed?: number;
  isPaused?: boolean;
}

export default function MemberHeader({
  title,
  subtitle,
  attemptsDelivered = 2,
  attemptsOwed = 8,
  isPaused = false,
}: MemberHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* SLA Status Pill */}
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>
            SLA: <strong className="text-slate-900">{attemptsDelivered} of {attemptsOwed}</strong> Attempts
          </span>
        </div>

        {/* Clock Status Badge */}
        {isPaused ? (
          <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Clock Paused</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Clock Active · Packet Ready</span>
          </div>
        )}

        {/* Assigned Operator Badge */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>Operator: <strong className="text-slate-800">Sarah C.</strong></span>
        </div>
      </div>
    </header>
  );
}
