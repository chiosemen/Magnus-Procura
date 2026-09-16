'use client';

import { useState } from 'react';
import MemberHeader from '@/components/MemberHeader';
import { Target, User, ShieldAlert, Plus, Layers } from 'lucide-react';

interface AccountTarget {
  id: string;
  name: string;
  tier: 'primary' | 'bench';
  status: 'research' | 'approached' | 'met' | 'qualified' | 'opp' | 'dead';
  whyUs: string;
  knownDesk: string;
  championName?: string;
  championRole?: string;
  championEmail?: string;
  doNotHit?: boolean;
}

export default function TargetAccountsPage() {
  const [activeTier, setActiveTier] = useState<'primary' | 'bench'>('primary');

  const [targets] = useState<AccountTarget[]>([
    {
      id: '1',
      name: 'Lockheed Martin',
      tier: 'primary',
      status: 'approached',
      whyUs: 'Specialized composite tooling supplier with 99.8% on-time delivery.',
      knownDesk: 'Tactical Missiles Procurement Desk',
      championName: 'Arthur Pendelton',
      championRole: 'Category Manager - Structural Components',
      championEmail: 'a.pendelton@lockheed.example.com',
      doNotHit: false,
    },
    {
      id: '2',
      name: 'Boeing Defense',
      tier: 'primary',
      status: 'met',
      whyUs: 'ITAR certified machining partner with active Ariba registration.',
      knownDesk: 'Commercial Derivative Aircraft Category',
      championName: 'Brenda Miller',
      championRole: 'Supplier Diversity Director',
      championEmail: 'b.miller@boeing.example.com',
      doNotHit: false,
    },
    {
      id: '3',
      name: 'Northrop Grumman',
      tier: 'primary',
      status: 'research',
      whyUs: 'Payload shroud manufacturing capacity available Q4.',
      knownDesk: 'Aeronautics Systems Desk',
      championName: 'Pending Desk Sourcing',
      championRole: 'Sourcing Lead',
      doNotHit: false,
    },
    {
      id: '4',
      name: 'General Dynamics',
      tier: 'primary',
      status: 'research',
      whyUs: 'Land systems hydraulic assembly specialist.',
      knownDesk: 'Combat Systems Sourcing Desk',
      championName: 'Pending Desk Sourcing',
      championRole: 'Category Specialist',
      doNotHit: false,
    },
    {
      id: '5',
      name: 'Raytheon Technologies',
      tier: 'primary',
      status: 'research',
      whyUs: 'RF sensor housing precision casting.',
      knownDesk: 'Missiles & Defense Supply Management',
      championName: 'Pending Desk Sourcing',
      championRole: 'Sourcing Director',
      doNotHit: false,
    },
    {
      id: '6',
      name: 'BAE Systems',
      tier: 'bench',
      status: 'research',
      whyUs: 'Bench account for naval surface warfare hardware.',
      knownDesk: 'Platforms & Services',
      doNotHit: false,
    },
  ]);

  const filteredTargets = targets.filter((t) => t.tier === activeTier);

  return (
    <>
      <MemberHeader 
        title="Target Account Map" 
        subtitle="Enforced 5 Primary + 5 Bench Architecture · PRD §10.2"
        attemptsDelivered={2}
        attemptsOwed={8}
        isPaused={false}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Anti-TAM Inflation Rule Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Account-First Targeting Discipline
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                We reject “anyone in the Fortune 500” or blast directories. Every account in your primary allotment requires an articulated why-us proof point, known desk, and named champion.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTier('primary')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTier === 'primary'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Primary (5)
            </button>
            <button
              onClick={() => setActiveTier('bench')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTier === 'bench'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bench (1)
            </button>
          </div>
        </div>

        {/* Target List Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-2 text-blue-600" />
              {activeTier === 'primary' ? 'Active Primary Targets (Wave 1)' : 'Bench Reserve Targets'}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {filteredTargets.length} of 5 slots filled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTargets.map((target, idx) => (
              <div
                key={target.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black text-slate-400">#0{idx + 1}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      target.status === 'met' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : target.status === 'approached'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {target.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{target.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{target.knownDesk}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Why Us</p>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{target.whyUs}</p>
                  </div>
                </div>

                {target.championName && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/60 -mx-6 -mb-6 p-4 rounded-b-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{target.championName}</p>
                        <p className="text-[10px] text-slate-500">{target.championRole}</p>
                      </div>
                    </div>
                    {target.doNotHit && (
                      <span title="Conflict disclosed: do not contact" className="text-amber-500">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredTargets.length < 5 && (
              <button
                onClick={() => alert('New target slot open. Operator will evaluate alignment at Day 30 QBR.')}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition min-h-[220px]"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Add Target Slot</span>
                <span className="text-[11px] text-slate-400 mt-1">Available at QBR</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
