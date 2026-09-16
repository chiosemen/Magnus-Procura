'use client';

import { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Timer, 
  ShieldCheck, 
  Plus, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface OperatorAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedOrgs: string[];
  maxCapacity: number; // 15 hard cap
  totalHoursLogged: number;
  avgHoursPerMember: number;
}

const INITIAL_OPERATORS: OperatorAccount[] = [
  {
    id: 'op_01',
    name: 'Sarah Chen',
    email: 'sarah.c@magnusprocura.com',
    role: 'Lead Operator · Industrial Sourcing',
    assignedOrgs: [
      'Apex Industrial Robotics',
      'Nova BioFluidics Ltd',
      'Quantum Precision Casting',
      'Strata Clean Energy Sensors',
      'Vanguard Cyber Logistics',
      'Helios Advanced Composites',
      'Titan Hydraulics Group',
      'Orbital Sensor Dynamics',
      'Cascade Micro-Optics',
      'AeroShield Defense Metals',
      'Summit Precision Fabrication',
    ],
    maxCapacity: 15,
    totalHoursLogged: 78.5,
    avgHoursPerMember: 7.1,
  },
  {
    id: 'op_02',
    name: 'David Kelling',
    email: 'd.kelling@magnusprocura.com',
    role: 'Senior Operator · Defense & Aerospace',
    assignedOrgs: [
      'NorthStar Avionics Corp',
      'Sentinel Armor Systems',
      'Falcon Tactical Power',
      'Ceramic Armor Matrix',
      'Vanguard Propulsion Labs',
      'IronClad Secure Hardware',
      'Triton Marine Systems',
      'Apex Subsea Tooling',
    ],
    maxCapacity: 15,
    totalHoursLogged: 52.0,
    avgHoursPerMember: 6.5,
  },
  {
    id: 'op_03',
    name: 'Amanda Miller',
    email: 'a.miller@magnusprocura.com',
    role: 'Staff Operator · Electronics & BioTech',
    assignedOrgs: [
      'MicroCell BioDiagnostics',
      'Vector Cleanroom Assemblies',
      'Silicon Precision Slices',
      'CleanPower Inverters Inc',
      'Nexus RF Components',
      'BioSynthetics International',
    ],
    maxCapacity: 15,
    totalHoursLogged: 36.5,
    avgHoursPerMember: 6.1,
  },
];

export default function AdminOperatorsPage() {
  const [operators] = useState<OperatorAccount[]>(INITIAL_OPERATORS);

  return (
    <div>
      <AdminHeader 
        title="Operator Capacity &amp; Allocation" 
        subtitle="15-member hard capacity cap per operator, loaded COGS governance, and portfolio distribution."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Capacity Warning Banner */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Capacity Invariant: Max 15 Live Members per Operator</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            To preserve high introduction signal quality and ensure operators deliver 8 custom intros within the 15-hour annual budget, 
            the system flags warnings when an operator reaches 12 members and prevents assignments beyond 15.
          </p>
        </div>

        {/* Operator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {operators.map((op) => {
            const count = op.assignedOrgs.length;
            const pct = Math.round((count / op.maxCapacity) * 100);
            const isHigh = count >= 12;

            return (
              <div key={op.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-white">{op.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{op.role}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                      isHigh ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {count} / {op.maxCapacity} Max
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Book Load</span>
                      <span className="font-mono font-bold text-white">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full ${isHigh ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Hours</span>
                      <strong className="text-sm font-black text-white font-mono mt-0.5 block">{op.totalHoursLogged}h</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Avg / Member</span>
                      <strong className="text-sm font-black text-indigo-400 font-mono mt-0.5 block">{op.avgHoursPerMember}h</strong>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Assigned Portfolio ({count})</label>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-xs">
                      {op.assignedOrgs.map((org, i) => (
                        <div key={i} className="p-2 bg-slate-950 rounded-lg text-slate-300 font-medium truncate">
                          {org}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
