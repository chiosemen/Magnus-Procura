'use client';

import { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Calendar, 
  TrendingUp,
  Lock
} from 'lucide-react';

interface CohortRecord {
  id: string;
  name: string;
  quarter: string;
  memberCount: number; // Must be >= 10 to publish
  sentCount: number;
  metCount: number;
  qualifiedCount: number;
  oppCount: number;
  poCount: number;
  keptCount: number;
  medianDaysToPo: number;
  isPublished: boolean;
}

const INITIAL_COHORTS: CohortRecord[] = [
  {
    id: 'cohort_2026_q2',
    name: 'Cohort 1 — Advanced Manufacturing & Defense',
    quarter: 'Q2 2026',
    memberCount: 14, // >= 10 -> Eligible!
    sentCount: 48,
    metCount: 38,
    qualifiedCount: 26,
    oppCount: 16,
    poCount: 9,
    keptCount: 14,
    medianDaysToPo: 62,
    isPublished: true,
  },
  {
    id: 'cohort_2026_q3',
    name: 'Cohort 2 — Clean Energy & Automation',
    quarter: 'Q3 2026',
    memberCount: 8, // < 10 -> Ineligible!
    sentCount: 22,
    metCount: 16,
    qualifiedCount: 10,
    oppCount: 5,
    poCount: 2,
    keptCount: 8,
    medianDaysToPo: 45,
    isPublished: false,
  },
];

export default function AdminCohortsPage() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>(INITIAL_COHORTS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const togglePublish = (cohortId: string) => {
    const cohort = cohorts.find((c) => c.id === cohortId);
    if (!cohort) return;

    if (cohort.memberCount < 10 && !cohort.isPublished) {
      setStatusMessage(`Cannot publish ${cohort.name}: System invariant requires minimum n >= 10 members.`);
      setTimeout(() => setStatusMessage(null), 5000);
      return;
    }

    setCohorts((prev) =>
      prev.map((c) => (c.id === cohortId ? { ...c, isPublished: !c.isPublished } : c))
    );

    const newStatus = !cohort.isPublished ? 'published on public landing page' : 'unpublished from public view';
    setStatusMessage(`${cohort.name} is now ${newStatus}.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div>
      <AdminHeader 
        title="Cohort Governance &amp; Publication" 
        subtitle="Normative view cohort_card: strict n >= 10 public threshold, conversion velocities, and founder release gates."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {statusMessage && (
          <div className="p-4 bg-purple-500/20 border border-purple-500/40 text-purple-200 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* The Anti-Vanity Cohort Rule */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">The Publication Invariant (PRD §8 &amp; Architecture §15)</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            To prevent statistical cherry-picking or false marketing claims, the <code className="font-mono text-emerald-400">cohort_card</code> SQL view enforces:
            <br />
            <code className="font-mono bg-slate-950 px-2 py-1 rounded text-emerald-300 inline-block mt-2">
              is_publishable = (member_count &gt;= 10) AND (founder_toggle = true)
            </code>
            <br />
            Cohorts with fewer than 10 members cannot be published publicly under any circumstances.
          </p>
        </div>

        {/* Cohort Cards List */}
        <div className="space-y-6">
          {cohorts.map((c) => {
            const isEligible = c.memberCount >= 10;
            const metPct = Math.round((c.metCount / c.sentCount) * 100);
            const qualPct = Math.round((c.qualifiedCount / c.sentCount) * 100);
            const poPct = Math.round((c.poCount / c.sentCount) * 100);

            return (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-black text-white">{c.name}</h3>
                      <span className="text-xs font-mono text-slate-400">({c.quarter})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sample Size: <strong className="text-white font-mono">{c.memberCount} Members</strong> 
                      {isEligible ? (
                        <span className="text-emerald-400 ml-2 font-bold">(Meets n &ge; 10 threshold)</span>
                      ) : (
                        <span className="text-amber-400 ml-2 font-bold">(Requires {10 - c.memberCount} more members to publish)</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => togglePublish(c.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                        c.isPublished
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : isEligible
                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      {c.isPublished ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Published Live</span>
                        </>
                      ) : isEligible ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Publish Cohort</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked (n &lt; 10)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Conversion Funnel Row */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-left">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Intros Sent</span>
                    <strong className="text-lg font-black text-white font-mono mt-0.5 block">{c.sentCount}</strong>
                    <span className="text-[10px] text-slate-400">100% baseline</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Meetings Met</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">{c.metCount}</strong>
                    <span className="text-[10px] text-emerald-400/80 font-bold">{metPct}% conversion</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Qualified Desks</span>
                    <strong className="text-lg font-black text-blue-400 font-mono mt-0.5 block">{c.qualifiedCount}</strong>
                    <span className="text-[10px] text-blue-400/80 font-bold">{qualPct}% conversion</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Active SOWs</span>
                    <strong className="text-lg font-black text-purple-400 font-mono mt-0.5 block">{c.oppCount}</strong>
                    <span className="text-[10px] text-purple-400/80 font-bold">{Math.round((c.oppCount/c.sentCount)*100)}% conversion</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">PO Contracts Won</span>
                    <strong className="text-lg font-black text-amber-400 font-mono mt-0.5 block">{c.poCount}</strong>
                    <span className="text-[10px] text-amber-400/80 font-bold">{poPct}% win rate</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Median Velocity</span>
                    <strong className="text-lg font-black text-white font-mono mt-0.5 block">{c.medianDaysToPo} Days</strong>
                    <span className="text-[10px] text-slate-400">Intro to PO Award</span>
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
