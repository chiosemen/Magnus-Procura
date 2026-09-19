'use client';

import { useState } from 'react';
import OperatorHeader from '@/components/OperatorHeader';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';

interface ProgramSlaRow {
  orgId: string;
  orgName: string;
  sku: 'year_1' | 'sprint_90';
  startsOn: string;
  endsOn: string;
  attemptsOwed: number;
  attemptsDelivered: number;
  pendingApproval: number;
  clockStatus: 'active' | 'paused';
  pausedReason?: string;
  daysRemaining: number;
  isDelinquent: boolean; // >50% behind
  qbrMilestone?: string;
  copyApprovalDaysPending?: number;
  silencePaused?: boolean;
}

const INITIAL_SLA_DATA: ProgramSlaRow[] = [
  {
    orgId: 'org_apex',
    orgName: 'Apex Industrial Robotics',
    sku: 'year_1',
    startsOn: '2026-08-01',
    endsOn: '2027-07-31',
    attemptsOwed: 8,
    attemptsDelivered: 3,
    pendingApproval: 1,
    clockStatus: 'active',
    daysRemaining: 319,
    isDelinquent: false,
    qbrMilestone: 'Day 60 Due (in 5d)',
    copyApprovalDaysPending: 3,
  },
  {
    orgId: 'org_cyber_sec',
    orgName: 'Vanguard Cyber Logistics',
    sku: 'sprint_90',
    startsOn: '2026-08-15',
    endsOn: '2026-11-13',
    attemptsOwed: 4,
    attemptsDelivered: 2,
    pendingApproval: 0,
    clockStatus: 'active',
    daysRemaining: 58,
    isDelinquent: false,
    qbrMilestone: 'Day 30 Completed',
    copyApprovalDaysPending: 0,
  },
  {
    orgId: 'org_quantum_cast',
    orgName: 'Quantum Precision Casting',
    sku: 'year_1',
    startsOn: '2026-07-01',
    endsOn: '2027-06-30',
    attemptsOwed: 8,
    attemptsDelivered: 1,
    pendingApproval: 0,
    clockStatus: 'active',
    daysRemaining: 287,
    isDelinquent: true, // Expected ~2 delivered by month 2.5
    qbrMilestone: 'Day 60 Due',
    copyApprovalDaysPending: 0,
  },
  {
    orgId: 'org_bio_fluidics',
    orgName: 'Nova BioFluidics Ltd',
    sku: 'year_1',
    startsOn: '2026-07-15',
    endsOn: '2027-07-14',
    attemptsOwed: 8,
    attemptsDelivered: 1,
    pendingApproval: 0,
    clockStatus: 'paused',
    pausedReason: '14-Day Silence / Blocked Packet',
    daysRemaining: 301,
    isDelinquent: false,
    qbrMilestone: 'Day 60 Paused',
    copyApprovalDaysPending: 0,
    silencePaused: true,
  },
  {
    orgId: 'org_strata_clean',
    orgName: 'Strata Clean Energy Sensors',
    sku: 'sprint_90',
    startsOn: '2026-07-05',
    endsOn: '2026-10-03',
    attemptsOwed: 4,
    attemptsDelivered: 4,
    pendingApproval: 0,
    clockStatus: 'active',
    daysRemaining: 17,
    isDelinquent: false,
    qbrMilestone: 'Day 90 Completed',
    copyApprovalDaysPending: 0,
  },
];

export default function OperatorSlaMonitorPage() {
  const [slaData, setSlaData] = useState<ProgramSlaRow[]>(INITIAL_SLA_DATA);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const triggerTickQbr = async () => {
    setIsSimulating(true);
    await new Promise(r => setTimeout(r, 600));
    setIsSimulating(false);
    setSimulationResult('POST /jobs/tick-qbr executed: 2 QBR notices enqueued (Apex Day 60, Quantum Day 60). 1 Copy Approval turnaround ping sent (Apex).');
  };

  const togglePause = (orgId: string) => {
    setSlaData((prev) =>
      prev.map((item) => {
        if (item.orgId !== orgId) return item;
        const newStatus = item.clockStatus === 'active' ? 'paused' : 'active';
        return {
          ...item,
          clockStatus: newStatus,
          pausedReason: newStatus === 'paused' ? 'Operator manual hold / Gap audit' : undefined,
        };
      })
    );
  };

  const totalOwed = slaData.reduce((acc, r) => acc + r.attemptsOwed, 0);
  const totalDelivered = slaData.reduce((acc, r) => acc + r.attemptsDelivered, 0);
  const delinquentCount = slaData.filter((r) => r.isDelinquent).length;
  const pausedCount = slaData.filter((r) => r.clockStatus === 'paused').length;

  return (
    <div>
      <OperatorHeader 
        title="SLA Engine & Clocks Monitor" 
        subtitle="Normative view of programs_sla, 8-attempt delivery velocity, and automated 10-day no-response aging."
        urgentSlaCount={delinquentCount}
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Aggregate Velocity</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{totalDelivered}</span>
              <span className="text-xs text-slate-400 font-bold">/ {totalOwed} Attempts</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{Math.round((totalDelivered / totalOwed) * 100)}% delivered to date</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delinquency Risk</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-rose-600">{delinquentCount}</span>
              <span className="text-xs text-slate-400 font-bold">Programs</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">&gt;50% behind pace (tick-sla alert active)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clocks Paused</span>
              <PauseCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-600">{pausedCount}</span>
              <span className="text-xs text-slate-400 font-bold">Programs</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">SLA obligation time suspended</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Auto-Aging Rule</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">10 Days</span>
              <span className="text-xs text-slate-400 font-bold">Window</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Unanswered intros auto-age to no_response</p>
          </div>
        </div>

        {/* SLA Rule Architecture Alert */}
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <strong className="text-sm font-bold">SLA Contract & Clock Invariants (PRD §8)</strong>
          </div>
          <p className="leading-relaxed text-blue-800">
            Year-1 members are owed <strong>8 delivered attempts</strong> (approx 1 every 45 days). 90-Day Sprint members are owed <strong>4 delivered attempts</strong>. 
            The SLA clock pauses whenever The File is in a <strong>BLOCKED</strong> state or when a member is marked <strong>unresponsive</strong>. 
            The automated Railway cron job <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">POST /jobs/tick-sla</code> audits this table every morning at 06:00 ET.
          </p>
        </div>

        {/* SLA Programs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Program SLA Matrix (programs_sla)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Normative view of attempts owed, delivered, and Day 30/60/90 cadence milestones</p>
            </div>
            <button
              onClick={triggerTickQbr}
              disabled={isSimulating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-xs transition flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-indigo-600' : 'text-indigo-500'}`} />
              <span>{isSimulating ? 'Auditing Cadence...' : 'Run Cadence Audit (tick-qbr)'}</span>
            </button>
          </div>

          {simulationResult && (
            <div className="p-3.5 bg-indigo-50/90 border-b border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>{simulationResult}</span>
              </div>
              <button onClick={() => setSimulationResult(null)} className="text-indigo-600 hover:text-indigo-900 text-xs font-bold">
                Dismiss
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Organization</th>
                  <th className="px-6 py-3.5">Program SKU</th>
                  <th className="px-6 py-3.5">Delivery Period</th>
                  <th className="px-6 py-3.5">Attempts Progress</th>
                  <th className="px-6 py-3.5">Pending Approval</th>
                  <th className="px-6 py-3.5">Cadence / QBR</th>
                  <th className="px-6 py-3.5">Clock Status</th>
                  <th className="px-6 py-3.5 text-right">Clock Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slaData.map((row) => (
                  <tr key={row.orgId} className="hover:bg-slate-50/80 transition">
                    {/* Organization */}
                    <td className="px-6 py-4">
                      <strong className="font-bold text-slate-900 block">{row.orgName}</strong>
                      <span className="text-[11px] text-slate-500">ID: {row.orgId}</span>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        row.sku === 'year_1' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {row.sku === 'year_1' ? 'Year-1 (8)' : 'Sprint (4)'}
                      </span>
                    </td>

                    {/* Delivery Period */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{row.daysRemaining} days remaining</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Ends: {row.endsOn}</span>
                    </td>

                    {/* Progress */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">
                          {row.attemptsDelivered} of {row.attemptsOwed}
                        </span>
                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${row.isDelinquent ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(row.attemptsDelivered / row.attemptsOwed) * 100}%` }}
                          />
                        </div>
                      </div>
                      {row.isDelinquent && (
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider mt-1 block">
                          Delinquency Alert (&gt;50% Behind)
                        </span>
                      )}
                    </td>

                    {/* Pending Approval */}
                    <td className="px-6 py-4">
                      {row.pendingApproval > 0 ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          {row.pendingApproval} In Review
                        </span>
                      ) : (
                        <span className="text-slate-400">0 pending</span>
                      )}
                    </td>

                    {/* Cadence / QBR */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {row.qbrMilestone || 'On Track'}
                        </span>
                        {row.copyApprovalDaysPending && row.copyApprovalDaysPending >= 3 ? (
                          <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <Send className="w-2.5 h-2.5" />
                            <span>Copy Ping Sent (3d)</span>
                          </div>
                        ) : null}
                        {row.silencePaused && (
                          <div className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            14d Silence Auto-Pause
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Clock Status */}
                    <td className="px-6 py-4">
                      {row.clockStatus === 'active' ? (
                        <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Paused</span>
                          </span>
                          {row.pausedReason && (
                            <p className="text-[10px] text-amber-600 font-medium mt-1">{row.pausedReason}</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Control */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => togglePause(row.orgId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ml-auto ${
                          row.clockStatus === 'active'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {row.clockStatus === 'active' ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pause Clock</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Resume Clock</span>
                          </>
                        )}
                      </button>
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
