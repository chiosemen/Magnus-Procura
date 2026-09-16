'use client';

import { useState } from 'react';
import OperatorHeader from '@/components/OperatorHeader';
import { 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  User, 
  Building2, 
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';

interface OperatorIntro {
  id: string;
  orgId: string;
  orgName: string;
  targetAccount: string;
  championName: string;
  championRole: string;
  championEmail: string;
  copy: string;
  status: 'drafting' | 'pending_member_approval' | 'approved_ready_to_send' | 'sent' | 'met';
  approvedAt?: string;
  sentAt?: string;
  packetReady: boolean;
}

const TEMPLATES = [
  {
    id: 'anti_opaque_standard',
    title: 'Standard Anti-Opaque 3-Point Intro',
    description: '1 Account, 1 Sentence of Genuine Fit, 1 Low-Friction Ask',
    text: `Hi [Champion Name],

I am introducing [Member Org] regarding the [Known Desk] requirements at [Target Account].

[Member Org] operates an AS9100 / ISO certified facility delivering [Specific Capability] with [Specific Performance Metric], which directly matches your current sourcing need for [Target Initiative].

Their full verified procurement packet ("The File") — including capability statement, COI, and past performance — is available here: [Packet Link]

Would you be open to a 15-minute briefing next Tuesday to evaluate their vendor qualification?`,
  },
  {
    id: 'tier2_replacement',
    title: 'Tier-2 Supplier Replacement Angle',
    description: 'Addresses lead time bottlenecks or single-source dependency',
    text: `Hi [Champion Name],

Reaching out regarding your supplier diversification on the [Known Desk] line.

[Member Org] provides domestic [Capability] with guaranteed 10-day turnaround, currently serving tier-1 prime contracts with a 99.4% on-time acceptance rate.

I have attached their verified compliance packet for your review: [Packet Link]

Can we schedule a brief intro with their technical lead next week to review your vendor onboarding specifications?`,
  },
];

const INITIAL_INTROS: OperatorIntro[] = [
  {
    id: 'intro_001',
    orgId: 'org_apex',
    orgName: 'Apex Industrial Robotics',
    targetAccount: 'Ford Motor Company',
    championName: 'Michael Thornton',
    championRole: 'Director of Tooling Procurement',
    championEmail: 'mthornton@ford.com',
    copy: 'Hi Michael,\n\nI am introducing Apex Industrial Robotics regarding the Advanced Manufacturing & Automation Desk requirements at Ford.\n\nApex operates an automated robotic tooling cell delivering 30% lower cycle times with zero retooling downtime, directly matching your Dearborn powertrain modernization.\n\nTheir full verified procurement packet is attached.\n\nOpen to a 15-minute briefing next Tuesday?',
    status: 'approved_ready_to_send',
    approvedAt: '2026-09-15T14:30:00Z',
    packetReady: true,
  },
  {
    id: 'intro_002',
    orgId: 'org_apex',
    orgName: 'Apex Industrial Robotics',
    targetAccount: 'Boeing Defense & Space',
    championName: 'Sarah Jenkins',
    championRole: 'Supplier Quality Manager',
    championEmail: 's.jenkins@boeing.com',
    copy: 'Hi Sarah,\n\nIntroducing Apex Industrial Robotics for Autonomous Assembly Systems...\n',
    status: 'pending_member_approval',
    packetReady: true,
  },
  {
    id: 'intro_003',
    orgId: 'org_bio_fluidics',
    orgName: 'Nova BioFluidics Ltd',
    targetAccount: 'Pfizer Global Supply',
    championName: 'Dr. Katherine Wu',
    championRole: 'Senior Director, External Bioprocess Sourcing',
    championEmail: 'kwu@pfizer.com',
    copy: 'Hi Dr. Wu,\n\nIntroducing Nova BioFluidics regarding aseptic fluidic manifold fabrication...\n',
    status: 'pending_member_approval',
    packetReady: false, // BLOCKED!
  },
];

export default function OperatorIntroStudioPage() {
  const [intros, setIntros] = useState<OperatorIntro[]>(INITIAL_INTROS);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);

  // Drafting State
  const [orgName, setOrgName] = useState('Apex Industrial Robotics');
  const [targetAccount, setTargetAccount] = useState('Caterpillar Inc.');
  const [championName, setChampionName] = useState('David Lee');
  const [championRole, setChampionRole] = useState('Category Lead, Hydraulics');
  const [championEmail, setChampionEmail] = useState('lee_david@cat.com');
  const [copy, setCopy] = useState(TEMPLATES[0].text);
  const [dispatchSuccessId, setDispatchSuccessId] = useState<string | null>(null);

  const applyTemplate = (tmplId: string) => {
    setSelectedTemplate(tmplId);
    const tmpl = TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setCopy(tmpl.text);
    }
  };

  const handleSendForApproval = (e: React.FormEvent) => {
    e.preventDefault();
    const newIntro: OperatorIntro = {
      id: `intro_${Date.now()}`,
      orgId: 'org_apex',
      orgName,
      targetAccount,
      championName,
      championRole,
      championEmail,
      copy,
      status: 'pending_member_approval',
      packetReady: true,
    };
    setIntros([newIntro, ...intros]);
  };

  const handleDispatch = (introId: string) => {
    setIntros((prev) =>
      prev.map((i) =>
        i.id === introId
          ? { ...i, status: 'sent', sentAt: new Date().toISOString() }
          : i
      )
    );
    setDispatchSuccessId(introId);
    setTimeout(() => setDispatchSuccessId(null), 4000);
  };

  return (
    <div>
      <OperatorHeader 
        title="Intro Studio & Dispatch Queue" 
        subtitle="Draft high-signal introductions, enforce the anti-opaque quality bar, and dispatch signed-off intros."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Anti-Opaque Drafting Rule Banner */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <strong className="text-sm font-bold">The Anti-Opaque Intro Standard (PRD §8)</strong>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every introduction must name exactly <strong>one target account</strong>, articulate <strong>one sentence of genuine fit</strong>, 
              and include <strong>one specific, low-friction ask</strong>. Dispatches strictly require member approval and a READY packet.
            </p>
          </div>
        </div>

        {/* Ready to Dispatch Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Queue: Member-Approved Intros Awaiting Dispatch</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Privileged dispatch via Railway API <code className="font-mono text-indigo-600 font-bold">POST /intros/:id/send</code> with Resend transactional email.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              {intros.filter((i) => i.status === 'approved_ready_to_send').length} Ready to Send
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {intros.map((intro) => {
              const canDispatch = intro.status === 'approved_ready_to_send' && intro.packetReady;

              return (
                <div key={intro.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                        {intro.orgName}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        &rarr; {intro.targetAccount}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({intro.championName}, {intro.championRole})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 font-mono whitespace-pre-wrap">
                      {intro.copy}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px]">
                      {intro.approvedAt ? (
                        <span className="text-emerald-700 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Member Approved Copy</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Member Approval</span>
                        </span>
                      )}

                      {intro.packetReady ? (
                        <span className="text-emerald-700 font-bold flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>The File READY</span>
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>The File BLOCKED (Clock Paused)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dispatch Action */}
                  <div className="flex-shrink-0">
                    {intro.status === 'sent' ? (
                      <div className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Dispatched via Resend</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDispatch(intro.id)}
                        disabled={!canDispatch}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs ${
                          canDispatch
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Intro to Champion</span>
                      </button>
                    )}
                    {!canDispatch && intro.status !== 'sent' && (
                      <p className="text-[10px] text-slate-400 mt-1 text-right">
                        Requires member approval &amp; ready packet
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Intro Drafting Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Selector */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Anti-Opaque Template Library</h3>
            <div className="space-y-3">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedTemplate === tmpl.id
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <h4 className="text-xs font-bold text-slate-900">{tmpl.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tmpl.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Drafting Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Draft New Introduction</h3>

            <form onSubmit={handleSendForApproval} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Member Organization</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Account</label>
                  <input
                    type="text"
                    value={targetAccount}
                    onChange={(e) => setTargetAccount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Champion Name</label>
                  <input
                    type="text"
                    value={championName}
                    onChange={(e) => setChampionName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Champion Role</label>
                  <input
                    type="text"
                    value={championRole}
                    onChange={(e) => setChampionRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Verified Email</label>
                  <input
                    type="email"
                    value={championEmail}
                    onChange={(e) => setChampionEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Intro Copy</label>
                  <span className="text-[11px] text-slate-400">{copy.length} characters</span>
                </div>
                <textarea
                  rows={8}
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Send Copy for Member Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
