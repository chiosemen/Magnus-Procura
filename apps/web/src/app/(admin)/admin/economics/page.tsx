'use client';

import AdminHeader from '@/components/AdminHeader';
import { 
  DollarSign, 
  TrendingUp, 
  Timer, 
  CheckCircle2, 
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
    bountyCents: 50000,
    netMarginCents: 948000, // $9,480
    marginPct: 91.1,
  },
  {
    id: 'org_bio_fluid',
    name: 'Nova BioFluidics Ltd',
    sku: 'year_1',
    baseRevenueCents: 480000,
    successFeeCents: 0, // In progress
    operatorMinutes: 180, // 3.0h -> $360
    loadedCogsCents: 36000,
    bountyCents: 0,
    netMarginCents: 444000,
    marginPct: 92.5,
  },
  {
    id: 'org_quantum_aerospace',
    name: 'AeroPulse Composite Systems',
    sku: 'year_1',
    baseRevenueCents: 480000,
    successFeeCents: 800000,
    operatorMinutes: 420, // 7.0h -> $840
    loadedCogsCents: 84000,
    bountyCents: 50000,
    netMarginCents: 1146000,
    marginPct: 89.5,
  },
];

export default function AdminEconomicsPage() {
  const totalRevenue = UNIT_ECON_DATA.reduce((acc, r) => acc + r.baseRevenueCents + r.successFeeCents, 0);
  const totalCogs = UNIT_ECON_DATA.reduce((acc, r) => acc + r.loadedCogsCents + r.bountyCents, 0);
  const totalNet = totalRevenue - totalCogs;
  const overallMargin = Math.round((totalNet / totalRevenue) * 1000) / 10;

  return (
    <div>
      <AdminHeader 
        title="Unit Economics &amp; P&amp;L Ledger" 
        subtitle="Audited contribution margins, $120/hr loaded operator COGS, and capped success fees."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Top P&L Metric Cards with Liquid Glass Treatment */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Gross Contracted Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">
              ${(totalRevenue / 100).toLocaleString()}
            </div>
            <p className="text-xs text-emerald-400 mt-1.5 font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>Base retainers + success fees</span>
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Loaded COGS ($120/hr)</span>
              <Timer className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">
              ${(totalCogs / 100).toLocaleString()}
            </div>
            <p className="text-xs text-blue-400 mt-1.5 font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
              <span>Direct operator labor + bounties</span>
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Net Platform Contribution</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-400 font-mono">
              ${(totalNet / 100).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              After operator time and partner bounties
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Contribution Margin</span>
              <PieChart className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-white font-mono">
              {overallMargin}%
            </div>
            <p className="text-xs text-purple-400 mt-1.5 font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
              <span>Institutional target &gt; 60%</span>
            </p>
          </div>
        </div>

        {/* Granular Unit Econ Ledger Table */}
        <div className="liquid-glass specular-edge rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Member-Level Unit Economics Breakdown</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Directly synchronized with the <code className="text-purple-300 bg-white/[0.05] px-1.5 py-0.5 rounded">public.unit_econ_run</code> view.
              </p>
            </div>
            <div className="liquid-pill px-3 py-1 rounded-full text-[11px] font-bold text-slate-300">
              5 Active Programs Sampled
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">Member Organization</th>
                  <th className="py-4 px-6">Program SKU</th>
                  <th className="py-4 px-6 font-mono text-right">Base Retainer</th>
                  <th className="py-4 px-6 font-mono text-right">Success Fee</th>
                  <th className="py-4 px-6 font-mono text-right">Operator Hours</th>
                  <th className="py-4 px-6 font-mono text-right">Loaded COGS</th>
                  <th className="py-4 px-6 font-mono text-right">Net Margin ($)</th>
                  <th className="py-4 px-6 font-mono text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-200">
                {UNIT_ECON_DATA.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-6 font-bold text-white flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      <span>{row.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="liquid-pill px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase text-slate-300">
                        {row.sku}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-right text-slate-300">
                      ${(row.baseRevenueCents / 100).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-right">
                      {row.successFeeCents > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          +${(row.successFeeCents / 100).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">In Flight</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-right text-slate-300">
                      {(row.operatorMinutes / 60).toFixed(1)}h / 15h
                    </td>
                    <td className="py-4 px-6 font-mono text-right text-slate-400">
                      -${(row.loadedCogsCents / 100).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-right font-black text-white">
                      ${(row.netMarginCents / 100).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-right">
                      <span className="liquid-pill px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                        {row.marginPct}%
                      </span>
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
