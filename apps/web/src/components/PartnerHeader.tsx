'use client';

import { Handshake, DollarSign, CheckCircle2 } from 'lucide-react';

interface PartnerHeaderProps {
  title: string;
  subtitle?: string;
  totalReferrals?: number;
  earnedBountiesTotalUsd?: number;
}

export default function PartnerHeader({
  title,
  subtitle,
  totalReferrals = 6,
  earnedBountiesTotalUsd = 1500,
}: PartnerHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Certified Referral Partner
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Total Referrals Pill */}
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700">
          <Handshake className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Referrals: <strong className="text-slate-900">{totalReferrals} Submitted</strong>
          </span>
        </div>

        {/* Bounties Paid Pill */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-700">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          <span>${earnedBountiesTotalUsd.toLocaleString()} Earned (Day 91 Keep)</span>
        </div>
      </div>
    </header>
  );
}
