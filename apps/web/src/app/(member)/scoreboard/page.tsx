'use client';

import { useState, useEffect } from 'react';
import MemberHeader from '@/components/MemberHeader';
import { ArrowRight, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function ScoreboardPage() {
  const [metrics, setMetrics] = useState({
    funnel: {
      sent: 2,
      accepted: 1,
      met: 1,
      qualified: 1,
      opportunity: 1,
      poAwarded: 0,
      kept90: 1,
    },
    rates: {
      sentToMetRate: 50.0,
      metToQualifiedRate: 100.0,
      poConversionRate: 0.0,
    },
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        const orgId = '10000000-0000-0000-0000-000000000002';
        const res = await apiFetch(`/scoreboard/org/${orgId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.funnel && data.rates) {
            setMetrics({
              funnel: data.funnel,
              rates: data.rates,
              loading: false,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic scoreboard metrics:', err);
      } finally {
        if (isMounted) {
          setMetrics(prev => ({ ...prev, loading: false }));
        }
      }
    }
    loadMetrics();
    return () => { isMounted = false; };
  }, []);

  const funnelStages = [
    { label: 'Sent', count: metrics.funnel.sent, subtext: 'Delivered attempts', color: 'bg-blue-600' },
    { label: 'Accepted', count: metrics.funnel.accepted, subtext: 'Written yes to meet', color: 'bg-indigo-600' },
    { label: 'Met', count: metrics.funnel.met, subtext: 'Both sides showed up', color: 'bg-emerald-600' },
    { label: 'Qualified', count: metrics.funnel.qualified, subtext: 'Stated corporate need', color: 'bg-teal-600' },
    { label: 'Opportunity', count: metrics.funnel.opportunity, subtext: 'RFP / proposal in-flight', color: 'bg-cyan-600' },
    { label: 'PO Awarded', count: metrics.funnel.poAwarded, subtext: 'Attested contract / PO', color: 'bg-amber-600' },
    { label: 'Kept-90', count: metrics.funnel.kept90, subtext: 'Active past refund', color: 'bg-purple-600' },
  ];

  return (
    <>
      <MemberHeader 
        title="Open Funnel Scoreboard" 
        subtitle="Normative SQL View: member_funnel(org_id) · PRD §10.5 & §14"
        attemptsDelivered={2}
        attemptsOwed={8}
        isPaused={false}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Anti-Theater Doctrine Callout */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>The Denominator Principle (PRD §6.7)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Incumbents publish an aggregated &quot;$4.75M won&quot; headline with no denominator of intros or active members. Magnus Procura publishes the open conversion file for your firm and the cohort—even when the numbers are early and ugly.
          </p>
        </div>

        {/* Funnel Stage Progression Visualizer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">
            Stage Board: Sent → Met → Qualified → Opportunity → PO → Kept-90
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {funnelStages.map((stage, idx) => (
              <div key={stage.label} className="relative bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-black">0{idx + 1}</span>
                    {idx < funnelStages.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-300 hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{stage.label}</h4>
                  <div className="text-3xl font-black text-slate-900 mt-2">{stage.count}</div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3">{stage.subtext}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stage-to-Stage Conversion Benchmarks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sent → Met Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics.rates.sentToMetRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.funnel.met} meeting{metrics.funnel.met === 1 ? '' : 's'} held out of {metrics.funnel.sent} attempt{metrics.funnel.sent === 1 ? '' : 's'} delivered.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px]">
              <span className="text-slate-400">PRD Target</span>
              <span className="text-emerald-600 font-bold">≥ 50% (Healthy)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Met → Qualified Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics.rates.metToQualifiedRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.funnel.qualified} corporate need{metrics.funnel.qualified === 1 ? '' : 's'} identified with buyer next step.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px]">
              <span className="text-slate-400">PRD Target</span>
              <span className="text-emerald-600 font-bold">≥ 40% (Healthy)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PO Base Rate Model</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">~1 in 7</div>
            <p className="text-xs text-slate-500 mt-1">Expected members landing a PO in year 1 (15%).</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px]">
              <span className="text-slate-400">Honest Baseline</span>
              <span className="text-slate-700 font-bold">PRD §15 Economic Model</span>
            </div>
          </div>
        </div>

        {/* Normative Definitions Reference */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Normative Scoreboard Definitions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="bg-slate-50 p-4 rounded-xl">
              <strong className="text-slate-900 block mb-1">Accepted:</strong>
              Written yes to a meeting or packet review within 10 business days. Silence after two pings = declined.
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <strong className="text-slate-900 block mb-1">Met:</strong>
              Meeting held with both sides attending. No-show $\neq$ met. Group Zooms are events, never counted as intros.
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <strong className="text-slate-900 block mb-1">Qualified:</strong>
              ICP fit + stated need + next step owner on the buyer side within 14 days of meeting.
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <strong className="text-slate-900 block mb-1">Kept-90:</strong>
              Membership fee not refunded and purchase order not cancelled at day 91.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
