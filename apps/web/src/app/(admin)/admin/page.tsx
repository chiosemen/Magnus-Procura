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
  Building2,
  Sparkles
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
        {/* Top Executive Metrics with Liquid Glass Treatment */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Attested PO Volume</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">$1,450,000</div>
            <p className="text-xs text-emerald-400 mt-1.5 font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>Verified subcontracts won</span>
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Contracted Platform Fees</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">$384,000</div>
            <p className="text-xs text-blue-400 mt-1.5 font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
              <span>Base + capped success fees</span>
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Net Contribution Margin</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-400 font-mono">62.5%</div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              After $120/hr operator loaded COGS
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Active Cohorts</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">4 Cohorts</div>
            <p className="text-xs text-purple-400 mt-1.5 font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
              <span>2 Published (n ≥ 10 gated)</span>
            </p>
          </div>
        </div>

        {/* Operational Split: Operator Capacity & Live Audit Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Operator Capacity Balancer */}
          <div className="liquid-glass specular-edge p-6 rounded-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Operator Workload &amp; Capacity</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Enforcing 15-member hard cap per human operator</p>
              </div>
              <Link 
                href="/admin/operators"
                className="liquid-pill px-3 py-1.5 rounded-xl text-xs font-bold text-blue-400 hover:text-white flex items-center space-x-1 transition"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {operators.map((op) => (
                <div key={op.name} className="liquid-glass-interactive p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div>
                      <span className="font-black text-white">{op.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2 font-medium">({op.role})</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {op.assigned} / {op.max} Orgs ({op.pct}%)
                    </span>
                  </div>

                  {/* Liquid Progress Bar */}
                  <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                        op.pct > 80 
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_#f43f5e]' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_#10b981]'
                      }`}
                      style={{ width: `${op.pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                    <span>Hours Logged: <strong className="text-white">{op.hoursLogged}h</strong></span>
                    <span className="text-emerald-400 font-sans font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>SLA Healthy</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Forensic Audit Log Snapshot */}
          <div className="liquid-glass specular-edge p-6 rounded-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center space-x-2">
                  <ScrollText className="w-4 h-4 text-purple-400" />
                  <span>Audit Feed (Simulation)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Demonstration Audit Feed · Illustrative actions modeled on public.audit_log schema</p>
              </div>
              <Link 
                href="/admin/audit"
                className="liquid-pill px-3 py-1.5 rounded-xl text-xs font-bold text-purple-400 hover:text-white flex items-center space-x-1 transition"
              >
                <span>Full Stream</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-5 space-y-2.5 font-mono text-xs">
              {recentAuditEvents.map((ev) => (
                <div key={ev.id} className="liquid-glass-interactive p-3 rounded-xl flex items-center justify-between">
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                      <span className="text-purple-300 font-bold">{ev.action}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] truncate mt-0.5 font-sans font-medium">{ev.entity}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[10px] text-slate-400 block">{ev.time}</span>
                    <span className="text-[10px] text-slate-500 font-sans">{ev.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Banner: Program Economics Architecture */}
        <div className="liquid-glass specular-edge p-6 rounded-3xl border-emerald-500/20 bg-emerald-950/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-emerald-400 font-black text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Opaque Doctrine Invariants Enforced</span>
            </div>
            <h3 className="text-lg font-black text-white">8-Attempt SLA • $8,000 Success Fee Cap • $120/hr Loaded COGS</h3>
            <p className="text-xs text-slate-300 max-w-3xl">
              System database triggers reject captive broker kickbacks and unverified marketing introductions. All introductions 
              require named enterprise champions with verified corporate domains.
            </p>
          </div>

          <Link
            href="/admin/economics"
            className="shrink-0 liquid-pill px-5 py-3 rounded-2xl text-xs font-black text-emerald-300 hover:text-white border-emerald-500/30 bg-emerald-500/10 flex items-center space-x-2"
          >
            <span>Inspect Economics (P&amp;L)</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
