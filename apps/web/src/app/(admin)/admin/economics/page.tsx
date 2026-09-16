'use client';

import AdminHeader from '@/components/AdminHeader';
import { 
  DollarSign, 
  TrendingUp, 
  Timer, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  PieChart
} from 'lucide-react';

interface MemberUnitEcon {
  id: string;
  name: string;
  sku: 'year_1' | 'sprint_90';
  baseRevenueCents: number;
  successFeeCents: number;
  operatorMinutes: number;
  loadedCogsCents: number; // minutes / 60 * 12000 cents
  bountyCents: number;
  netMarginCents: number;
  marginPct: number;
}

const UNIT_ECON_DATA: MemberUnitEcon[] = [
  {
    id: 'org_apex',
    name: 'Apex Industrial Robotics',
    sku: 'year_1',
    baseRevenueCents: 480000,
    successFeeCents: 800000, // Capped at $8k on $120k PO
    operatorMinutes: 380, // 6.3h -> $760
    loadedCogsCents: 76000,
    bountyCents: 50000, // $500 Keep-90 bounty
    netMarginCents: 1154000, // $11,540
    marginPct: 90.1,
  },
  {
    id: 'org_strata_clean',
    name: 'Strata Clean Energy Sensors',
    sku: 'sprint_90',
    baseRevenueCents: 360000,
    successFeeCents: 800000, // Capped at $8k
    operatorMinutes: 310, // 5.1h -> $620
    loadedCogsCents: 62000,
    bountyCents: 50000,
    netMarginCents: 1048000, // $10,480
    marginPct: 90.3,
  },
  {
    id: 'org_cyber_sec',
    name: 'Vanguard Cyber Logistics',
    sku: 'sprint_90',
    baseRevenueCents: 360000,
    successFeeCents: 680000, // 8% of $85k = $6,800
    operatorMinutes: 210, // 3.5h -> $420
    loadedCogsCents: 42000,
    bountyCents: 0, // Pending day 91
    netMarginCents: 998000, // $9,980
    marginPct: 95.9,
  },
  {
    id: 'org_bio_fluidics',
    name: 'Nova BioFluidics Ltd',
    sku: 'year_1',
    baseRevenueCents: 480000,
    successFeeCents: 0, // In flight
    operatorMinutes: 420, // 7.0h -> $840
    loadedCogsCents: 84000,
    bountyCents: 0,
    netMarginCents: 396000, // $3,960 (82.5% margin on base alone)
    marginPct: 82.5,
  },
  {
    id: 'org_quantum_cast',
    name: 'Quantum Precision Casting',
    sku: 'year_1',
    baseRevenueCents: 480000,
    successFeeCents: 0,
    operatorMinutes: 760, // 12.6h -> $1,520 (high burn)
    loadedCogsCents: 152000,
    bountyCents: 0,
    netMarginCents: 328000, // $3,280
    marginPct: 68.3,
  },
];

export default function AdminEconomicsPage() {
  const totalBaseRev = UNIT_ECON_DATA.reduce((acc, r) => acc + r.baseRevenueCents, 0);
  const totalSuccessFee = UNIT_ECON_DATA.reduce((acc, r) => acc + r.successFeeCents, 0);
  const totalGrossRev = totalBaseRev + totalSuccessFee;
  const totalCogs = UNIT_ECON_DATA.reduce((acc, r) => acc + r.loadedCogsCents, 0);
  const totalBounties = UNIT_ECON_DATA.reduce((acc, r) => acc + r.bountyCents, 0);
  const totalNet = totalGrossRev - totalCogs - totalBounties;
  const blendedMargin = Math.round((totalNet / totalGrossRev) * 100);

  return (
    <div>
      <AdminHeader 
        title="Unit Economics & P&L Analysis" 
        subtitle="Postgres normative view unit_econ_run: loaded COGS ($120/hr), bounty ledger, and contribution margin."
        netMarginPct={blendedMargin}
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* P&L Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Gross Revenue</span>
            <div className="text-3xl font-black text-white font-mono mt-2">
              ${(totalGrossRev / 100).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ${(totalBaseRev / 100).toLocaleString()} Base + ${(totalSuccessFee / 100).toLocaleString()} Success
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Loaded Operator COGS</span>
            <div className="text-3xl font-black text-amber-400 font-mono mt-2">
              ${(totalCogs / 100).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Based on $120/hr loaded rate model</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Partner Keep-90 Bounties</span>
            <div className="text-3xl font-black text-indigo-400 font-mono mt-2">
              ${(totalBounties / 100).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">$500 per Day 91 retained member</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Net Contribution Margin</span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-2">
              ${(totalNet / 100).toLocaleString()}
            </div>
            <p className="text-xs text-emerald-400 mt-1 font-bold">{blendedMargin}% Blended Contribution</p>
          </div>
        </div>

        {/* COGS Model Specification Banner */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">The Loaded Operator COGS Thesis (PRD §10 &amp; Teardown §4)</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            Unlike traditional sales agencies that suffer margin collapse through unfocused manual labor, Magnus Procura guarantees minimum 
            <strong> 62.5% gross contribution margin</strong> on standard Year-1 programs by enforcing a strict <strong>15-hour loaded operator budget</strong> ($1,800 loaded COGS). 
            Success fees (capped at $8,000) deliver 95%+ incremental margin expansion.
          </p>
        </div>

        {/* Per-Member Unit Economics Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Member-Level P&amp;L Ledger (unit_econ_run)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Programmatic SQL view calculating exact net margin per active contract.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Organization &amp; SKU</th>
                  <th className="px-6 py-4">Base Fee</th>
                  <th className="px-6 py-4">Success Fee</th>
                  <th className="px-6 py-4">Hours Burned</th>
                  <th className="px-6 py-4">Loaded COGS</th>
                  <th className="px-6 py-4">Partner Bounty</th>
                  <th className="px-6 py-4 text-right">Net Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {UNIT_ECON_DATA.map((row) => {
                  const hoursHours = (row.operatorMinutes / 60).toFixed(1);

                  return (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <strong className="text-white block font-bold">{row.name}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {row.sku === 'year_1' ? 'Year-1 ($4,800)' : 'Sprint-90 ($3,600)'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-200">
                        ${(row.baseRevenueCents / 100).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                        {row.successFeeCents > 0 ? (
                          `+$${(row.successFeeCents / 100).toLocaleString()}`
                        ) : (
                          <span className="text-slate-500">$0</span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-300">
                        {hoursHours}h ({row.operatorMinutes}m)
                      </td>

                      <td className="px-6 py-4 font-mono text-amber-400">
                        -${(row.loadedCogsCents / 100).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 font-mono text-indigo-400">
                        {row.bountyCents > 0 ? `-$${(row.bountyCents / 100).toLocaleString()}` : <span className="text-slate-500">$0</span>}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black font-mono text-emerald-400 block">
                          ${(row.netMarginCents / 100).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {row.marginPct}% Net Margin
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
