'use client';

import { useState } from 'react';
import MemberHeader from '@/components/MemberHeader';
import { Send, CheckCircle2, Clock, Mail, Check, AlertCircle } from 'lucide-react';

interface IntroItem {
  id: string;
  accountName: string;
  championName: string;
  championRole: string;
  channel: string;
  copy: string;
  approvedAt: string | null;
  sentAt: string | null;
  result: 'sent' | 'accepted' | 'declined' | 'no_response' | 'met' | 'no_show' | null;
}

export default function IntroLedgerPage() {
  const [intros, setIntros] = useState<IntroItem[]>([
    {
      id: '80000000-0000-0000-0000-000000000001',
      accountName: 'Lockheed Martin',
      championName: 'Arthur Pendelton',
      championRole: 'Category Manager - Structural Components',
      channel: 'email',
      copy: 'Arthur, Apex Industrial Solutions is an ITAR-certified composite tooling supplier currently delivering 99.8% on-time for precision programs. May I share their two-page buyer-ready risk packet?',
      approvedAt: null, // Pending member approval
      sentAt: null,
      result: null,
    },
    {
      id: '80000000-0000-0000-0000-000000000002',
      accountName: 'Boeing Defense',
      championName: 'Brenda Miller',
      championRole: 'Supplier Diversity Director',
      channel: 'email',
      copy: 'Brenda, Apex Industrial is registered in Boeing Ariba and meets all Tier-1 supplier diversity standards. Would you have 15 minutes next Tuesday to review their machining capacity?',
      approvedAt: 'Sep 7, 2026',
      sentAt: 'Sep 7, 2026',
      result: 'met',
    },
  ]);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setApprovingId(id);
    setTimeout(() => {
      setIntros((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, approvedAt: new Date().toISOString().split('T')[0] } : i
        )
      );
      setApprovingId(null);
    }, 400);
  };

  const pendingApprovals = intros.filter((i) => !i.approvedAt);
  const deliveredIntros = intros.filter((i) => Boolean(i.sentAt));

  return (
    <>
      <MemberHeader 
        title="Intro Ledger & The Factory" 
        subtitle="Named Attempts · Governed by PRD §10.4 · Strict Member Approval"
        attemptsDelivered={deliveredIntros.length}
        attemptsOwed={8}
        isPaused={false}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Quality Bar Guidelines */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
            <Send className="w-4 h-4" />
            <span>Intro Quality Bar (Appendix B)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800">
            <div>• One account per message</div>
            <div>• One sentence of category fit (no novel)</div>
            <div>• One ask (15 min or 2-page packet review)</div>
            <div>• Member has approved the copy</div>
            <div>• Packet is Ready</div>
            <div>• Champion not declined in 180 days</div>
          </div>
        </div>

        {/* Section 1: Pending Member Approval */}
        {pendingApprovals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <h3>Draft Introductions Awaiting Member Approval ({pendingApprovals.length})</h3>
            </div>

            <div className="space-y-4">
              {pendingApprovals.map((intro) => (
                <div
                  key={intro.id}
                  className="bg-white rounded-2xl border-2 border-blue-500/40 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-white bg-blue-600 px-2.5 py-0.5 rounded-full uppercase">
                        {intro.accountName}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {intro.championName} ({intro.championRole})
                      </span>
                      <span className="text-[11px] text-slate-400">via {intro.channel}</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-800 font-mono leading-relaxed">
                      &quot;{intro.copy}&quot;
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleApprove(intro.id)}
                      disabled={approvingId === intro.id}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{approvingId === intro.id ? 'Approving...' : 'Approve Copy'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Historic & Dispatched Introductions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Delivered Introduction Ledger
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {deliveredIntros.length} attempts counted against SLA
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Account & Champion</th>
                  <th className="py-3 px-6">Sent Date</th>
                  <th className="py-3 px-6">Channel</th>
                  <th className="py-3 px-6">Status / Result</th>
                  <th className="py-3 px-6">Stage Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveredIntros.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{i.accountName}</p>
                      <p className="text-slate-500 mt-0.5">{i.championName} · {i.championRole}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{i.sentAt}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 capitalize">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{i.channel}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{i.result}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      Met $\rightarrow$ Qualified (RFP In-Flight)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
