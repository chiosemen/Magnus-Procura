'use client';

import PartnerHeader from '@/components/PartnerHeader';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  Calendar,
  ArrowUpRight
} from 'lucide-react';

interface BountyRecord {
  id: string;
  supplierName: string;
  sku: 'year_1' | 'sprint_90';
  programStartsOn: string;
  refundWindowClosedOn: string;
  dueOn: string;
  paidAt?: string;
  clawedAt?: string;
  amountCents: number;
  status: 'paid' | 'pending_day_91' | 'clawed_back';
  payoutRef?: string;
}

const BOUNTY_RECORDS: BountyRecord[] = [
  {
    id: 'bty_001',
    supplierName: 'Apex Industrial Robotics',
    sku: 'year_1',
    programStartsOn: '2026-06-15',
    refundWindowClosedOn: '2026-07-15',
    dueOn: '2026-09-14',
    paidAt: '2026-09-15',
    amountCents: 50000, // $500
    status: 'paid',
    payoutRef: 'ACH-PO-98442',
  },
  {
    id: 'bty_002',
    supplierName: 'Strata Clean Energy Sensors',
    sku: 'sprint_90',
    programStartsOn: '2026-06-01',
    refundWindowClosedOn: '2026-07-01',
    dueOn: '2026-08-31',
    paidAt: '2026-09-01',
    amountCents: 50000, // $500
    status: 'paid',
    payoutRef: 'ACH-PO-97129',
  },
  {
    id: 'bty_003',
    supplierName: 'Vanguard Cyber Logistics',
    sku: 'year_1',
    programStartsOn: '2026-07-20',
    refundWindowClosedOn: '2026-08-19',
    dueOn: '2026-10-19',
    amountCents: 50000, // $500
    status: 'pending_day_91',
  },
];

export default function PartnerBountiesPage() {
  const totalPaidCents = BOUNTY_RECORDS
    .filter((b) => b.status === 'paid')
    .reduce((acc, b) => acc + b.amountCents, 0);

  const pendingCents = BOUNTY_RECORDS
    .filter((b) => b.status === 'pending_day_91')
    .reduce((acc, b) => acc + b.amountCents, 0);

  return (
    <div>
      <PartnerHeader 
        title="Keep-90 Bounty Ledger" 
        subtitle="Automated partner compensation: $500 earned upon member Day 91 retention."
        totalReferrals={3}
        earnedBountiesTotalUsd={totalPaidCents / 100}
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bounties Paid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">${(totalPaidCents / 100).toLocaleString()}</span>
              <span className="text-xs text-emerald-600 font-bold">Disbursed</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Direct ACH transfers completed</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Day 91 Keep</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-600">${(pendingCents / 100).toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-bold">Scheduled</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Due upon day 91 milestone trigger</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clawback Rate</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">0.0%</span>
              <span className="text-xs text-emerald-600 font-bold">Zero Refunds</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">100% of referrals successfully retained past 30 days</p>
          </div>
        </div>

        {/* Keep-90 Contract Specification Card */}
        <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Keep-90 Bounty Economics (PRD §10 &amp; Teardown §4)</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Certified partners receive a standard <strong>$500 bounty</strong> for each referred supplier that successfully executes a membership contract 
            and completes <strong>Day 91 without requesting a refund</strong>. 
            The automated Railway cron engine (<code className="font-mono text-emerald-400">POST /jobs/tick-keep90</code>) verifies this milestone daily at 06:15 ET and triggers disbursement.
          </p>
        </div>

        {/* Bounty Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Bounties Ledger (bounties)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Referred Supplier</th>
                  <th className="px-6 py-3.5">Program SKU</th>
                  <th className="px-6 py-3.5">Program Start</th>
                  <th className="px-6 py-3.5">Refund Expiry</th>
                  <th className="px-6 py-3.5">Day 91 Milestone</th>
                  <th className="px-6 py-3.5">Bounty Amount</th>
                  <th className="px-6 py-3.5">Status &amp; Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {BOUNTY_RECORDS.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <strong className="font-bold text-slate-900 block">{rec.supplierName}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">Ref: {rec.id}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rec.sku === 'year_1' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {rec.sku === 'year_1' ? 'Year-1' : '90-Day'}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-600">
                      {rec.programStartsOn}
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-600">
                      {rec.refundWindowClosedOn}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {rec.dueOn}
                    </td>

                    <td className="px-6 py-4">
                      <strong className="text-sm font-black text-emerald-600">
                        ${(rec.amountCents / 100).toFixed(2)}
                      </strong>
                    </td>

                    <td className="px-6 py-4">
                      {rec.status === 'paid' ? (
                        <div>
                          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            Ref: {rec.payoutRef}
                          </span>
                        </div>
                      ) : rec.status === 'pending_day_91' ? (
                        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          <span>Pending Day 91</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Clawed Back</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
