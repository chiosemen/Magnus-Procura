'use client';

import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ScrollText,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function AdminExecutiveDashboardPage() {
  const operators = [
    { name: 'Sarah Chen', role: 'Lead Operator', assigned: 11, max: 15, pct: 73, hoursLogged: 78.4, status: 'normal' },
    { name: 'David Kelling', role: 'Senior Operator', assigned: 8, max: 15, pct: 53, hoursLogged: 52.0, status: 'normal' },
    { name: 'Amanda Miller', role: 'Staff Operator', assigned: 6, max: 15, pct: 40, hoursLogged: 36.5, status: 'normal' },
  ];

  const recentAuditEvents = [
    { id: 'aud_1', time: '10 mins ago', action: 'attestation.accepted', entity: 'PO-2026-98144 ($120,000)', actor: 'sarah.c@magnus' },
    { id: 'aud_2', time: '42 mins ago', action: 'intro.dispatched', entity: 'Apex -> Ford Powertrain Desk', actor: 'sarah.c@magnus' },
    { id: 'aud_3', time: '2 hours ago', action: 'billing.checkout.completed', entity: 'Nova BioFluidics ($4,800)', actor: 'stripe.webhook' },
    { id: 'aud_4', time: '5 hours ago', action: 'tick-sla.executed', entity: '48 programs audited, 0 delinquent', actor: 'railway.cron' },
    { id: 'aud_5', time: '1 day ago', action: 'bounty.released', entity: '$500 Keep-90 to Vanguard Advisory', actor: 'railway.cron' },
  ];

  return (
    <div>
      <AdminHeader 
        title="Executive Command Center" 
        subtitle="Platform-wide financial performance, unit economics, operator allocation, and governance."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Top Executive Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Attested PO Volume</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">$1,450,000</div>
            <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verified subcontracts won</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">$118,400</div>
            <p className="text-xs text-slate-400 mt-1">$50.4k Membership + $68k Success Fees</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Loaded Contribution Margin</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-purple-400 font-mono">62.5%</div>
            <p className="text-xs text-slate-400 mt-1">Net of $120/hr loaded operator COGS</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Live Member Orgs</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white">25 Active</div>
            <p className="text-xs text-slate-400 mt-1">Across 3 Assigned Operators</p>
          </div>
        </div>

        {/* Financial & Economic Health Card */}
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 p-6 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                P&amp;L Discipline (unit_econ_run)
              </span>
              <h3 className="text-base font-bold text-white">Target Unit Economics Verified</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every $4,800 Year-1 contract delivers <strong>$3,000 Net Contribution Margin</strong> after factoring the strict 15-hour loaded operator budget ($1,800 loaded COGS). 
              Success fees provide pure margin expansion capped at $8,000 per member.
            </p>
          </div>
          <Link
            href="/admin/economics"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-purple-600/20"
          >
            <span>Open P&amp;L Analysis</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Two-Column Grid: Operator Capacities & Cohort Publications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Operator Capacity Gauge */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Operator Capacity &amp; Book Load</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">15 Member Max Invariant</span>
            </div>

            <div className="space-y-4">
              {operators.map((op, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">{op.name}</strong>
                      <span className="text-[11px] text-slate-400">{op.role} · {op.hoursLogged}h logged</span>
                    </div>
                    <span className="font-mono font-bold text-slate-200">
                      {op.assigned} / {op.max} ({op.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${op.pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${op.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right">
              <Link href="/admin/operators" className="text-xs text-indigo-400 font-bold hover:underline">
                Manage Operator Allocations &rarr;
              </Link>
            </div>
          </div>

          {/* Cohort Governance Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Cohort Publication Governance</h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono">cohort_card SQL view</span>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Cohort 1 (Summer 2026)</h4>
                  <span className="text-[11px] text-slate-400">14 Member Suppliers ($n \ge 10$ Threshold Met)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Published Live
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-slate-800">
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Sent</span>
                  <strong className="text-white font-mono">100%</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Met</span>
                  <strong className="text-emerald-400 font-mono">79%</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">Qualified</span>
                  <strong className="text-blue-400 font-mono">54%</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block">PO Won</span>
                  <strong className="text-purple-400 font-mono">19%</strong>
                </div>
              </div>
            </div>

            <div className="text-right">
              <Link href="/admin/cohorts" className="text-xs text-emerald-400 font-bold hover:underline">
                Manage Cohort Publication &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Real-Time System Audit Log Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ScrollText className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Privileged Audit Log Stream (public.audit_log)</h3>
            </div>
            <Link href="/admin/audit" className="text-xs text-purple-400 font-bold hover:underline">
              View Full Audit Ledger &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {recentAuditEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg transition">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-400 text-[11px] w-24">{evt.time}</span>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-800 text-purple-300">
                    {evt.action}
                  </span>
                  <span className="text-slate-200 font-medium">{evt.entity}</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">{evt.actor}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
