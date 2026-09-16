'use client';

import { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { 
  Users, 
  CheckCircle2, 
  Timer, 
  ShieldCheck, 
  TrendingUp,
  AlertTriangle
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
      'Hyperion Guidance Systems',
      'AeroPulse Composite Systems',
      'Aegis Sensor Labs',
    ],
    maxCapacity: 15,
    totalHoursLogged: 52.0,
    avgHoursPerMember: 6.5,
  },
  {
    id: 'op_03',
    name: 'Amanda Miller',
    email: 'amanda.m@magnusprocura.com',
    role: 'Staff Operator · Energy & Electronics',
    assignedOrgs: [
      'Voltaic Energy Cells',
      'Beacon Microelectronics',
      'Solaria Grid Hardware',
      'Ionix Power Systems',
      'GridMaster Inverters',
      'CoreFlow Fluidic Valves',
    ],
    maxCapacity: 15,
    totalHoursLogged: 36.5,
    avgHoursPerMember: 6.1,
  },
];

export default function AdminOperatorsPage() {
  const [operators] = useState<OperatorAccount[]>(INITIAL_OPERATORS);

  const totalAssigned = operators.reduce((acc, o) => acc + o.assignedOrgs.length, 0);
  const totalMax = operators.length * 15;
  const platformUtilization = Math.round((totalAssigned / totalMax) * 100);

  return (
    <div>
      <AdminHeader 
        title="Operator Capacity &amp; Load Balancer" 
        subtitle="Enforcing the 15-member hard cap and 15h annual budget per supplier organization."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Capacity Governance Banner */}
        <div className="liquid-glass specular-edge p-6 rounded-3xl border-blue-500/30 bg-blue-950/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-blue-400 font-black text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Operational Invariant: Maximum 15 Members Per Operator</span>
            </div>
            <h3 className="text-lg font-black text-white">Preventing Broker Dilution &amp; Attention Exhaustion</h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Traditional brokers assign 100+ accounts to single SDRs, guaranteeing automated generic spam. Magnus Procura enforces 
              a database-governed hard limit of <strong className="text-blue-300">15 active organizations</strong> per human operator, 
              ensuring bespoke outreach copy and rigorous compliance audits.
            </p>
          </div>
          <div className="shrink-0 liquid-pill px-4 py-2 rounded-2xl text-xs font-mono font-bold text-blue-300 border-blue-500/30">
            LOAD: {platformUtilization}% ({totalAssigned} / {totalMax} Seats)
          </div>
        </div>

        {/* Operators Roster Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {operators.map((op) => {
            const count = op.assignedOrgs.length;
            const pct = Math.round((count / op.maxCapacity) * 100);
            const isNearCap = pct >= 80;

            return (
              <div 
                key={op.id}
                className="liquid-glass-interactive specular-edge p-6 rounded-3xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-black text-white">{op.name}</h3>
                      <p className="text-xs text-purple-300 font-medium mt-0.5">{op.role}</p>
                      <span className="text-[11px] text-slate-400 font-mono block mt-1">{op.email}</span>
                    </div>
                    <span className="liquid-pill px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-slate-300">
                      {count} / {op.maxCapacity}
                    </span>
                  </div>

                  {/* Liquid Load Bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-400">Assigned Capacity:</span>
                      <span className={`font-mono ${isNearCap ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {pct}% ({op.maxCapacity - count} seats open)
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isNearCap 
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_#f43f5e]' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_#10b981]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Hours Tracking Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-5 font-mono text-xs">
                    <div className="liquid-pill p-3 rounded-2xl">
                      <span className="text-slate-400 text-[10px] uppercase block font-sans">Total Hours Logged</span>
                      <strong className="text-base text-white block mt-1">{op.totalHoursLogged}h</strong>
                    </div>
                    <div className="liquid-pill p-3 rounded-2xl">
                      <span className="text-slate-400 text-[10px] uppercase block font-sans">Avg Per Member</span>
                      <strong className="text-base text-emerald-400 block mt-1">{op.avgHoursPerMember}h / 15h</strong>
                    </div>
                  </div>

                  {/* Active Portfolio Roster */}
                  <div className="mt-5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Assigned Member Portfolio:
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {op.assignedOrgs.map((org) => (
                        <div 
                          key={org}
                          className="liquid-pill px-3 py-1.5 rounded-xl text-xs text-slate-300 truncate flex items-center justify-between"
                        >
                          <span className="truncate">{org}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-2 shadow-[0_0_6px_#34d399]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SLA On-Track</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">15h Budget Enforced</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
