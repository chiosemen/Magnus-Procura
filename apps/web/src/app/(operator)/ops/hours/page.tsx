'use client';

import { useState } from 'react';
import OperatorHeader from '@/components/OperatorHeader';
import { 
  Timer, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Briefcase
} from 'lucide-react';

interface HoursEntry {
  id: string;
  orgId: string;
  orgName: string;
  minutes: number;
  date: string;
  category: 'kickoff' | 'research' | 'copy_drafting' | 'outreach' | 'attestation_audit' | 'review';
  note: string;
}

interface MemberBudget {
  orgId: string;
  orgName: string;
  sku: 'year_1' | 'sprint_90';
  budgetMinutes: number; // 900 min (15h) for year_1, 450 min (7.5h) for sprint_90
  loggedMinutes: number;
}

const INITIAL_BUDGETS: MemberBudget[] = [
  { orgId: 'org_apex', orgName: 'Apex Industrial Robotics', sku: 'year_1', budgetMinutes: 900, loggedMinutes: 380 },
  { orgId: 'org_cyber_sec', orgName: 'Vanguard Cyber Logistics', sku: 'sprint_90', budgetMinutes: 450, loggedMinutes: 210 },
  { orgId: 'org_quantum_cast', orgName: 'Quantum Precision Casting', sku: 'year_1', budgetMinutes: 900, loggedMinutes: 760 }, // >80% warning!
  { orgId: 'org_bio_fluidics', orgName: 'Nova BioFluidics Ltd', sku: 'year_1', budgetMinutes: 900, loggedMinutes: 420 },
  { orgId: 'org_strata_clean', orgName: 'Strata Clean Energy Sensors', sku: 'sprint_90', budgetMinutes: 450, loggedMinutes: 310 },
];

const INITIAL_ENTRIES: HoursEntry[] = [
  {
    id: 'h_001',
    orgId: 'org_quantum_cast',
    orgName: 'Quantum Precision Casting',
    minutes: 60,
    date: '2026-09-15',
    category: 'outreach',
    note: 'Follow up with Raytheon champion regarding AS9100 quality audit packet',
  },
  {
    id: 'h_002',
    orgId: 'org_apex',
    orgName: 'Apex Industrial Robotics',
    minutes: 45,
    date: '2026-09-14',
    category: 'copy_drafting',
    note: 'Drafted tailored intro to Ford Powertrain automation desk',
  },
  {
    id: 'h_003',
    orgId: 'org_strata_clean',
    orgName: 'Strata Clean Energy Sensors',
    minutes: 40,
    date: '2026-09-12',
    category: 'attestation_audit',
    note: 'Audited submitted $120k enterprise PO evidence against contract SOW',
  },
  {
    id: 'h_004',
    orgId: 'org_quantum_cast',
    orgName: 'Quantum Precision Casting',
    minutes: 90,
    date: '2026-09-10',
    category: 'research',
    note: 'Target account expansion: Lockheed CMMC requirements desk mapping',
  },
];

export default function OperatorHoursTrackerPage() {
  const [budgets, setBudgets] = useState<MemberBudget[]>(INITIAL_BUDGETS);
  const [entries, setEntries] = useState<HoursEntry[]>(INITIAL_ENTRIES);

  // Form states
  const [selectedOrgId, setSelectedOrgId] = useState(INITIAL_BUDGETS[0].orgId);
  const [minutes, setMinutes] = useState(45);
  const [category, setCategory] = useState<HoursEntry['category']>('copy_drafting');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    const org = budgets.find((b) => b.orgId === selectedOrgId);
    if (!org) return;

    const newEntry: HoursEntry = {
      id: `h_${Date.now()}`,
      orgId: selectedOrgId,
      orgName: org.orgName,
      minutes,
      date,
      category,
      note,
    };

    setEntries([newEntry, ...entries]);
    setBudgets((prev) =>
      prev.map((b) =>
        b.orgId === selectedOrgId
          ? { ...b, loggedMinutes: b.loggedMinutes + minutes }
          : b
      )
    );

    setNote('');
  };

  const totalLoggedMinutes = budgets.reduce((acc, b) => acc + b.loggedMinutes, 0);
  const totalBudgetMinutes = budgets.reduce((acc, b) => acc + b.budgetMinutes, 0);
  const loadedCostCogs = Math.round((totalLoggedMinutes / 60) * 120);

  return (
    <div>
      <OperatorHeader 
        title="15-Hour Budget & COGS Control" 
        subtitle="Unit economics discipline: $120/hr loaded COGS, 15h annual budget per member, and scope creep prevention."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Economics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Aggregate Operator Time</span>
              <Timer className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{(totalLoggedMinutes / 60).toFixed(1)}h</span>
              <span className="text-xs text-slate-400 font-bold">/ {(totalBudgetMinutes / 60).toFixed(0)}h Cap</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{Math.round((totalLoggedMinutes / totalBudgetMinutes) * 100)}% of total capacity allocated</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Loaded COGS Incurred</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">${loadedCostCogs.toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-bold">@ $120/hr</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Standard loaded operator cost rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">COGS Envelope</span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">37.5%</span>
              <span className="text-xs text-emerald-600 font-bold">COGS Ratio</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">$1,800 max COGS on $4,800 Year-1 contract</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Threshold Overrun</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-600">1</span>
              <span className="text-xs text-slate-400 font-bold">Member &gt;80%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Quantum Precision Casting at 84% burn</p>
          </div>
        </div>

        {/* Hour Logging Form & Member Burn Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Log Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Log Operator Minutes</h3>
            </div>
            <p className="text-xs text-slate-500">
              Record high-leverage time spent on behalf of a specific member organization.
            </p>

            <form onSubmit={handleLogHours} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Member Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {budgets.map((b) => (
                    <option key={b.orgId} value={b.orgId}>
                      {b.orgName} ({b.sku === 'year_1' ? 'Year-1' : 'Sprint-90'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="5"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Activity Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HoursEntry['category'])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="kickoff">Kickoff & Review</option>
                  <option value="research">Target & Champion Research</option>
                  <option value="copy_drafting">Intro Copy Drafting</option>
                  <option value="outreach">Champion Outreach & Logistics</option>
                  <option value="attestation_audit">Attestation & PO Audit</option>
                  <option value="review">Milestone Review (30/60/90)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Specific task context, desk name, or champion contacted..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Commit Hours Entry</span>
              </button>
            </form>
          </div>

          {/* Member Budget Burn Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Member 15-Hour Budget Allocation</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Organization</th>
                    <th className="px-6 py-3.5">Budget Cap</th>
                    <th className="px-6 py-3.5">Burned</th>
                    <th className="px-6 py-3.5">Utilization</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.map((b) => {
                    const pct = Math.round((b.loggedMinutes / b.budgetMinutes) * 100);
                    const isOver80 = pct >= 80;
                    const hoursLogged = (b.loggedMinutes / 60).toFixed(1);
                    const hoursBudget = (b.budgetMinutes / 60).toFixed(1);

                    return (
                      <tr key={b.orgId} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4">
                          <strong className="font-bold text-slate-900 block">{b.orgName}</strong>
                          <span className="text-[11px] text-slate-500">
                            {b.sku === 'year_1' ? 'Year-1 Annual' : '90-Day Sprint'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {hoursBudget}h ({b.budgetMinutes}m)
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-900">
                          {hoursLogged}h ({b.loggedMinutes}m)
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isOver80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`font-bold ${isOver80 ? 'text-amber-600' : 'text-slate-700'}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isOver80 ? (
                            <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span>Warning (&gt;80%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Healthy</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Audit Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Recent Operator Hours Ledger (operator_hours)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Organization</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Task Description / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 font-mono text-slate-500">{entry.date}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{entry.orgName}</td>
                    <td className="px-6 py-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {entry.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{entry.minutes} min</td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-md">{entry.note}</td>
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
