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
  {
    id: 'cohort_2026_q4',
    name: 'Cohort 3 — Aerospace Composites & Avionics',
    quarter: 'Q4 2026',
    memberCount: 11, // >= 10 -> Eligible!
    sentCount: 34,
    metCount: 28,
    qualifiedCount: 18,
    oppCount: 11,
    poCount: 6,
    keptCount: 11,
    medianDaysToPo: 58,
    isPublished: true,
  },
  {
    id: 'cohort_2027_q1',
    name: 'Cohort 4 — BioPharma & Precision Tooling',
    quarter: 'Q1 2027',
    memberCount: 4, // In formation
    sentCount: 8,
    metCount: 4,
    qualifiedCount: 2,
    oppCount: 1,
    poCount: 0,
    keptCount: 4,
    medianDaysToPo: 0,
    isPublished: false,
  },
];

export default function AdminCohortsPage() {
  const [cohorts, setCohorts] = useState<CohortRecord[]>(INITIAL_COHORTS);

  const togglePublish = (id: string) => {
    setCohorts((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          if (c.memberCount < 10 && !c.isPublished) {
            alert('Cannot publish cohort: Strictly requires minimum n >= 10 active organizations per PRD governance standards.');
            return c;
          }
          return { ...c, isPublished: !c.isPublished };
        }
        return c;
      })
    );
  };

  return (
    <div>
      <AdminHeader 
        title="Cohort Governance &amp; Publication Gate" 
        subtitle="Enforcing statistical validity (n ≥ 10) before publishing public scoreboard metrics."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Governance Doctrine Rule Card */}
        <div className="liquid-glass specular-edge p-6 rounded-3xl border-purple-500/30 bg-purple-950/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-purple-400 font-black text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Normative Rule: cohort_card Gate (n ≥ 10)</span>
            </div>
            <h3 className="text-lg font-black text-white">Statistical Integrity Protection</h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              To prevent cherry-picked conversion rates and sample distortion, the public conversion scoreboard strictly suppresses 
              cohorts with fewer than 10 participating organizations. Only cohorts meeting the <strong className="text-purple-300">n ≥ 10 gate</strong> may 
              be broadcast to the public.
            </p>
          </div>
          <div className="shrink-0 liquid-pill px-4 py-2 rounded-2xl text-xs font-mono font-bold text-purple-300 border-purple-500/30">
            VIEW: public.cohort_card
          </div>
        </div>

        {/* Cohorts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cohorts.map((cohort) => {
            const isEligible = cohort.memberCount >= 10;
            const metRate = cohort.sentCount > 0 ? Math.round((cohort.metCount / cohort.sentCount) * 100) : 0;
            const poRate = cohort.metCount > 0 ? Math.round((cohort.poCount / cohort.metCount) * 100) : 0;

            return (
              <div 
                key={cohort.id} 
                className={`liquid-glass-interactive specular-edge p-6 rounded-3xl relative flex flex-col justify-between ${
                  cohort.isPublished ? 'border-emerald-500/30' : 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="liquid-pill px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-slate-400">
                        {cohort.quarter}
                      </span>
                      <h3 className="text-base font-black text-white mt-2">{cohort.name}</h3>
                    </div>
                    {cohort.isPublished ? (
                      <span className="liquid-pill px-3 py-1 rounded-full text-[10px] font-bold text-emerald-300 border-emerald-500/30 bg-emerald-500/10 flex items-center space-x-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                        <span>Public Scoreboard</span>
                      </span>
                    ) : (
                      <span className="liquid-pill px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 shrink-0 flex items-center space-x-1.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Unpublished</span>
                      </span>
                    )}
                  </div>

                  {/* Size Gate Indicator */}
                  <div className="mt-4 p-3.5 rounded-2xl liquid-glass border border-white/10">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400">Cohort Sample Size:</span>
                      <span className={`font-mono ${isEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                        n = {cohort.memberCount} / 10 required
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2 mt-2 overflow-hidden border border-white/10">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isEligible ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                        }`}
                        style={{ width: `${Math.min((cohort.memberCount / 10) * 100, 100)}%` }}
                      />
                    </div>
                    {!isEligible && (
                      <p className="text-[11px] text-amber-400 mt-2 font-medium flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Gate locked: Requires {10 - cohort.memberCount} more active orgs before publication.</span>
                      </p>
                    )}
                  </div>

                  {/* Conversion Pipeline Snapshot */}
                  <div className="grid grid-cols-4 gap-2 mt-5 text-center font-mono">
                    <div className="liquid-pill p-2.5 rounded-xl">
                      <div className="text-slate-400 text-[10px] uppercase font-sans">Sent</div>
                      <div className="text-sm font-black text-white mt-1">{cohort.sentCount}</div>
                    </div>
                    <div className="liquid-pill p-2.5 rounded-xl">
                      <div className="text-slate-400 text-[10px] uppercase font-sans">Met</div>
                      <div className="text-sm font-black text-emerald-400 mt-1">{cohort.metCount}</div>
                      <span className="text-[9px] text-slate-500 block">{metRate}%</span>
                    </div>
                    <div className="liquid-pill p-2.5 rounded-xl">
                      <div className="text-slate-400 text-[10px] uppercase font-sans">PO Won</div>
                      <div className="text-sm font-black text-blue-400 mt-1">{cohort.poCount}</div>
                      <span className="text-[9px] text-slate-500 block">{poRate}%</span>
                    </div>
                    <div className="liquid-pill p-2.5 rounded-xl">
                      <div className="text-slate-400 text-[10px] uppercase font-sans">Days to PO</div>
                      <div className="text-sm font-black text-purple-400 mt-1">{cohort.medianDaysToPo}d</div>
                    </div>
                  </div>
                </div>

                {/* Publish Action Button */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {cohort.isPublished ? 'Live on public conversion scoreboard' : 'Hidden from unauthenticated visitors'}
                  </span>
                  <button
                    onClick={() => togglePublish(cohort.id)}
                    className={`liquid-pill px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      cohort.isPublished
                        ? 'text-rose-400 hover:text-white border-rose-500/30 hover:bg-rose-500/20'
                        : isEligible
                        ? 'text-emerald-300 hover:text-white border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20'
                        : 'text-slate-500 border-white/5 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {cohort.isPublished ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Publish to Scoreboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
