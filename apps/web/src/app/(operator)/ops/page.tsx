'use client';

import { useState } from 'react';
import Link from 'next/link';
import OperatorHeader from '@/components/OperatorHeader';
import { 
  Users, 
  Clock, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  Timer, 
  CheckCircle2, 
  Search,
  Plus
} from 'lucide-react';

interface MemberOrg {
  id: string;
  name: string;
  sku: 'year_1' | 'sprint_90';
  contactName: string;
  contactEmail: string;
  packetStatus: 'ready' | 'blocked';
  attemptsDelivered: number;
  attemptsOwed: number;
  hoursSpentMinutes: number; // Max 900 (15 hours)
  slaStatus: 'on_track' | 'at_risk' | 'paused';
  nextAction: string;
  joinedDaysAgo: number;
}

const INITIAL_ORGS: MemberOrg[] = [
  {
    id: 'org_apex',
    name: 'Apex Industrial Robotics',
    sku: 'year_1',
    contactName: 'Marcus Vance',
    contactEmail: 'm.vance@apexrobotics.io',
    packetStatus: 'ready',
    attemptsDelivered: 3,
    attemptsOwed: 8,
    hoursSpentMinutes: 380, // 6.3 hours
    slaStatus: 'on_track',
    nextAction: 'Draft Intro #4 to Ford Powertrain',
    joinedDaysAgo: 45,
  },
  {
    id: 'org_cyber_sec',
    name: 'Vanguard Cyber Logistics',
    sku: 'sprint_90',
    contactName: 'Elena Rostova',
    contactEmail: 'elena@vanguardlogistics.com',
    packetStatus: 'ready',
    attemptsDelivered: 2,
    attemptsOwed: 4,
    hoursSpentMinutes: 210, // 3.5 hours
    slaStatus: 'on_track',
    nextAction: 'Await Champion meeting feedback (Target: Lockheed)',
    joinedDaysAgo: 28,
  },
  {
    id: 'org_bio_fluidics',
    name: 'Nova BioFluidics Ltd',
    sku: 'year_1',
    contactName: 'Dr. Arthur Pendelton',
    contactEmail: 'a.pendelton@novabio.org',
    packetStatus: 'blocked',
    attemptsDelivered: 1,
    attemptsOwed: 8,
    hoursSpentMinutes: 420, // 7.0 hours
    slaStatus: 'paused',
    nextAction: 'Review missing Past Performance artifact (Clock Paused)',
    joinedDaysAgo: 60,
  },
  {
    id: 'org_quantum_cast',
    name: 'Quantum Precision Casting',
    sku: 'year_1',
    contactName: 'David Kelling',
    contactEmail: 'dkelling@quantumcast.com',
    packetStatus: 'ready',
    attemptsDelivered: 1,
    attemptsOwed: 8,
    hoursSpentMinutes: 510, // 8.5 hours
    slaStatus: 'at_risk',
    nextAction: 'Urgent: Member behind schedule (>50% velocity gap)',
    joinedDaysAgo: 75,
  },
  {
    id: 'org_strata_clean',
    name: 'Strata Clean Energy Sensors',
    sku: 'sprint_90',
    contactName: 'Claire Zhang',
    contactEmail: 'claire@stratasensors.com',
    packetStatus: 'ready',
    attemptsDelivered: 4,
    attemptsOwed: 4,
    hoursSpentMinutes: 310, // 5.1 hours
    slaStatus: 'on_track',
    nextAction: 'Attestation submitted ($120k PO) — Awaiting audit',
    joinedDaysAgo: 72,
  },
];

export default function OperatorDashboardPage() {
  const [search, setSearch] = useState('');
  const [filterSku, setFilterSku] = useState<'all' | 'year_1' | 'sprint_90'>('all');

  const filteredOrgs = INITIAL_ORGS.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.contactName.toLowerCase().includes(search.toLowerCase());
    const matchesSku = filterSku === 'all' || org.sku === filterSku;
    return matchesSearch && matchesSku;
  });

  const totalMembers = INITIAL_ORGS.length;
  const maxCapacity = 15;
  const totalDelivered = INITIAL_ORGS.reduce((acc, o) => acc + o.attemptsDelivered, 0);
  const totalOwed = INITIAL_ORGS.reduce((acc, o) => acc + o.attemptsOwed, 0);

  return (
    <div>
      <OperatorHeader 
        title="Book of Organizations" 
        subtitle="Manage assigned supplier cohorts, execute kickoffs, and enforce SLA and hours discipline."
        activeCount={totalMembers}
        urgentSlaCount={1}
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Top Operational Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Book Load</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{totalMembers}</span>
              <span className="text-xs text-slate-400 font-bold">/ {maxCapacity} Max</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Capacity at {Math.round((totalMembers / maxCapacity) * 100)}% (Cap: 15)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Delivery</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{totalDelivered}</span>
              <span className="text-xs text-slate-400 font-bold">/ {totalOwed} Owed</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{Math.round((totalDelivered / totalOwed) * 100)}% aggregate attempts fulfilled</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Intros In Flight</span>
              <Send className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">8</span>
              <span className="text-xs text-emerald-600 font-bold">Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Under 10-day no-response window</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Actions</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">3</span>
              <span className="text-xs text-amber-600 font-bold">Require Review</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">1 Kickoff, 1 Blocked Packet, 1 Attestation</p>
          </div>
        </div>

        {/* Operational Guardrail Notice */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 rounded-2xl text-white border border-indigo-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                COGS Discipline
              </span>
              <h3 className="text-sm font-bold text-white">Operator Capacity & 15-Hour Budget Protection</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every member has a strict 15-hour loaded annual envelope ($120/hr loaded COGS = $1,800 per $4,800 contract). 
              Hours exceeding 80% (720 min) flag early warnings. Operators manage a maximum of 15 members.
            </p>
          </div>
          <Link
            href="/ops/hours"
            className="flex-shrink-0 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Open Hours Tracker</span>
          </Link>
        </div>

        {/* Directory Controls & Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search members or contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
              </div>

              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold">
                <button
                  onClick={() => setFilterSku('all')}
                  className={`px-3 py-1 rounded-md transition ${filterSku === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  All ({INITIAL_ORGS.length})
                </button>
                <button
                  onClick={() => setFilterSku('year_1')}
                  className={`px-3 py-1 rounded-md transition ${filterSku === 'year_1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  Year-1 (3)
                </button>
                <button
                  onClick={() => setFilterSku('sprint_90')}
                  className={`px-3 py-1 rounded-md transition ${filterSku === 'sprint_90' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  90-Day Sprint (2)
                </button>
              </div>
            </div>

            <Link
              href="/ops/orgs/org_apex"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kickoff Checklist Wizard</span>
            </Link>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Organization & Lead</th>
                  <th className="px-6 py-3.5">Program SKU</th>
                  <th className="px-6 py-3.5">Packet Status</th>
                  <th className="px-6 py-3.5">SLA Attempts</th>
                  <th className="px-6 py-3.5">Hours Burned</th>
                  <th className="px-6 py-3.5">Next Operational Action</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.map((org) => {
                  const hoursHours = (org.hoursSpentMinutes / 60).toFixed(1);
                  const hoursPct = Math.round((org.hoursSpentMinutes / 900) * 100);
                  const isHoursHigh = hoursPct >= 80;

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Contact */}
                      <td className="px-6 py-4">
                        <Link href={`/ops/orgs/${org.id}`} className="font-bold text-slate-900 hover:text-indigo-600 flex items-center space-x-1 group">
                          <span>{org.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-600 transition" />
                        </Link>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {org.contactName} · <span className="font-mono">{org.contactEmail}</span>
                        </p>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          org.sku === 'year_1' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {org.sku === 'year_1' ? 'Year-1 ($4,800)' : '90-Day ($3,600)'}
                        </span>
                      </td>

                      {/* Packet Status */}
                      <td className="px-6 py-4">
                        {org.packetStatus === 'ready' ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>READY · Clock On</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>BLOCKED · Clock Off</span>
                          </span>
                        )}
                      </td>

                      {/* SLA Progress */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">
                            {org.attemptsDelivered} / {org.attemptsOwed}
                          </span>
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                org.slaStatus === 'at_risk' ? 'bg-rose-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${(org.attemptsDelivered / org.attemptsOwed) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 block ${
                          org.slaStatus === 'on_track' ? 'text-emerald-600' :
                          org.slaStatus === 'at_risk' ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                          {org.slaStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-bold ${isHoursHigh ? 'text-amber-700 font-black' : 'text-slate-700'}`}>
                            {hoursHours}h
                          </span>
                          <span className="text-slate-400 text-[10px]">/ 15h</span>
                        </div>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full ${isHoursHigh ? 'bg-amber-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min(hoursPct, 100)}%` }}
                          />
                        </div>
                      </td>

                      {/* Next Action */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-slate-700 font-medium truncate" title={org.nextAction}>
                          {org.nextAction}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/ops/orgs/${org.id}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold transition"
                          >
                            Checklist
                          </Link>
                          <Link
                            href="/ops/intros"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold transition"
                          >
                            Draft
                          </Link>
                        </div>
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
