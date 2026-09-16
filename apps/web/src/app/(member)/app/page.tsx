import Link from 'next/link';
import MemberHeader from '@/components/MemberHeader';
import { Target, Send, ShieldCheck, FileCheck, ArrowUpRight, AlertCircle } from 'lucide-react';

export default function MemberDashboard() {
  return (
    <>
      <MemberHeader 
        title="Member Command Center" 
        subtitle="Year-1 Program · Active Sprint Horizon"
        attemptsDelivered={2}
        attemptsOwed={8}
        isPaused={false}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Action Banner: Pending Intro Approval */}
        <div className="bg-blue-900/10 border border-blue-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Action Required</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Lockheed Martin Introduction Copy Ready for Review
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Your operator has drafted the one-sentence category fit and single ask for Arthur Pendelton (Tactical Missiles Procurement Desk). Member approval is required before dispatch.
              </p>
            </div>
          </div>
          <Link
            href="/intros"
            className="whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md transition"
          >
            Review & Approve →
          </Link>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Intro SLA</span>
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">2 / 8</div>
            <p className="text-xs text-slate-500 mt-1">Attempts Delivered (25% to SLA target)</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Account Map</span>
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">5 + 1</div>
            <p className="text-xs text-slate-500 mt-1">5 Primary Accounts + 1 Bench</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Risk Packet</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600">READY</div>
            <p className="text-xs text-slate-500 mt-1">All required buyer artifacts verified</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">In-Flight Deals</span>
              <FileCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">1 RFP</div>
            <p className="text-xs text-slate-500 mt-1">Boeing Defense Wing-Spar Assembly</p>
          </div>
        </div>

        {/* Two-Column Grid: Active Targets & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active 5 Primary Targets (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top 5 Primary Target Accounts</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enforced account list for active introduction cycle</p>
              </div>
              <Link href="/targets" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
                Manage Map <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                { name: 'Lockheed Martin', why: 'Specialized composite tooling supplier with 99.8% on-time delivery.', status: 'Approached', badge: 'bg-blue-100 text-blue-700' },
                { name: 'Boeing Defense', why: 'ITAR certified machining partner with active Ariba registration.', status: 'Met (RFP In-Flight)', badge: 'bg-emerald-100 text-emerald-700' },
                { name: 'Northrop Grumman', why: 'Payload shroud manufacturing capacity available Q4.', status: 'Research', badge: 'bg-slate-100 text-slate-600' },
                { name: 'General Dynamics', why: 'Land systems hydraulic assembly specialist.', status: 'Research', badge: 'bg-slate-100 text-slate-600' },
                { name: 'Raytheon Technologies', why: 'RF sensor housing precision casting.', status: 'Research', badge: 'bg-slate-100 text-slate-600' },
              ].map((t, idx) => (
                <div key={t.name} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-400">0{idx + 1}</span>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-md">{t.why}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${t.badge}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Operating Principles */}
          <div className="space-y-6">
            <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">The Product Promise</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We do not guarantee contracts. We guarantee a measured path: five named accounts, a packet a buyer knows how to score, and named intros counted on an open scoreboard.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs">
                <span className="text-slate-400">Refund Window</span>
                <span className="text-white font-bold">Earned (Passed 30d)</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Operator Hours Envelope</h3>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-black text-slate-900">2.25h / 15h</span>
                <span className="text-xs font-bold text-emerald-600">Healthy (15%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                15 loaded delivery hours funded under Year-1 program fee.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
