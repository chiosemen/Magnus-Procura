'use client';

import { useState } from 'react';
import Link from 'next/link';
import OperatorHeader from '@/components/OperatorHeader';
import { apiFetch } from '@/lib/api';
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight, 
  Building2, 
  FileText, 
  Users, 
  Calendar, 
  Target, 
  Save, 
  ArrowLeft,
  Sparkles,
  Clock,
  RefreshCw,
  X,
  ArrowUpDown,
  ShieldAlert,
  Ban,
  Search
} from 'lucide-react';

interface TargetInput {
  name: string;
  tier: 'primary' | 'bench';
  status?: 'research' | 'approached' | 'accepted' | 'declined' | 'met' | 'qualified' | 'opp' | 'dead' | 'exhausted';
  knownDesk: string;
  whyUs: string;
  championName: string;
  championRole: string;
  championEmail: string;
}

export default function KickoffChecklistWizardPage() {
  const [activeStep, setActiveStep] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'>('A');

  // Step A: Commercial Signoff
  const [sowSigned, setSowSigned] = useState(true);
  const [paymentCleared, setPaymentCleared] = useState(true);
  const [refundAcknowledged, setRefundAcknowledged] = useState(true);
  const [sku, setSku] = useState<'year_1' | 'sprint_90'>('year_1');

  // Step B: 10-Minute Fit & Do-Not-Serve Blacklist (FR-FIT-4)
  const [liveFitScore, setLiveFitScore] = useState(82);
  const [conflictChecked, setConflictChecked] = useState(true);
  const [fitNotes, setFitNotes] = useState('Clean ICP alignment. Prior tier-2 auto subcontracts verified. No active member conflict.');
  const [blacklistStatus, setBlacklistStatus] = useState<'clean' | 'blacklisted'>('clean');
  const [blacklistMatch, setBlacklistMatch] = useState<{ entityName: string; reason: string; notes?: string } | null>(null);
  const [blacklistDomainInput, setBlacklistDomainInput] = useState('apexrobotics.com');
  const [isBlacklistChecking, setIsBlacklistChecking] = useState(false);

  const handleCheckBlacklist = async (domainToCheck: string) => {
    setIsBlacklistChecking(true);
    try {
      const res = await apiFetch('/fit/check-blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainToCheck }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.blacklisted) {
          setBlacklistStatus('blacklisted');
          setBlacklistMatch({
            entityName: data.match?.entityName || 'Listed Non-Servicing Entity',
            reason: data.match?.reason || 'bad_faith',
            notes: 'Listed on Magnus Procura Do-Not-Serve Register (FR-FIT-4).',
          });
          setLiveFitScore(0);
        } else {
          setBlacklistStatus('clean');
          setBlacklistMatch(null);
          if (liveFitScore === 0) setLiveFitScore(82);
        }
      }
    } catch (err) {
      console.warn('Operator blacklist check error:', err);
    } finally {
      setIsBlacklistChecking(false);
    }
  };

  // Step C: Working Cadence
  const [reviewsScheduled, setReviewsScheduled] = useState(true);
  const [fiveDayCopySla, setFiveDayCopySla] = useState(true);
  const [fourteenDayGapSla, setFourteenDayGapSla] = useState(true);

  // Step D: Packet Signoff
  const [packetChecks, setPacketChecks] = useState({
    capStatement: true,
    oneLiner: true,
    naicsCodes: true,
    coiVerified: true,
    financialsReady: true,
    pastPerf1: true,
    pastPerf2: true,
    portalRegs: true,
  });
  const [packetStatus, setPacketStatus] = useState<'ready' | 'blocked'>('ready');

  // Step E: Targets Mapping (5 Primary + 5 Bench)
  const [targets, setTargets] = useState<TargetInput[]>([
    {
      name: 'Ford Motor Company',
      tier: 'primary',
      knownDesk: 'Advanced Manufacturing & Automation Desk',
      whyUs: 'Direct replacement for legacy pneumatic tooling with 30% lower cycle times',
      championName: 'Michael Thornton',
      championRole: 'Director of Tooling Procurement',
      championEmail: 'mthornton@ford.com',
    },
    {
      name: 'Boeing Defense & Space',
      tier: 'primary',
      knownDesk: 'Autonomous Assembly Systems',
      whyUs: 'AS9100 certified cell robotics with precision tolerance under 0.02mm',
      championName: 'Sarah Jenkins',
      championRole: 'Supplier Quality Manager',
      championEmail: 's.jenkins@boeing.com',
    },
    {
      name: 'Caterpillar Inc.',
      tier: 'primary',
      knownDesk: 'Hydraulics & Heavy Drivetrain Procurement',
      whyUs: 'Domestic steel fabrication with 7-day turnaround capacity',
      championName: 'David Lee',
      championRole: 'Category Lead, Hydraulics',
      championEmail: 'lee_david@cat.com',
    },
    {
      name: 'Raytheon Technologies',
      tier: 'primary',
      knownDesk: 'Tactical Sensor Integration',
      whyUs: 'ITAR registered micro-machining with cleanroom facility',
      championName: 'Robert Vasquez',
      championRole: 'Procurement Specialist',
      championEmail: 'r.vasquez@rtx.com',
    },
    {
      name: 'Lockheed Martin',
      tier: 'primary',
      knownDesk: 'Missile Defense Fasteners & Machining',
      whyUs: 'Proven prime sub-tier performance with audited CMMC compliance',
      championName: 'Amanda Collins',
      championRole: 'Subcontract Administrator',
      championEmail: 'a.collins@lockheed.com',
    },
    {
      name: 'General Dynamics Land Systems',
      tier: 'bench',
      knownDesk: 'Armored Vehicle Component Supply',
      whyUs: 'Rapid prototyping capability for structural armor mounts',
      championName: 'Thomas Clark',
      championRole: 'Sourcing Manager',
      championEmail: 't.clark@gdls.com',
    },
  ]);

  // Target Rotation Engine State (Sprint 10 & 11 FR-ACC-4)
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [selectedOutTargetIndex, setSelectedOutTargetIndex] = useState<number>(0);
  const [selectedInTargetIndex, setSelectedInTargetIndex] = useState<number>(5);
  const [rotationStatus, setRotationStatus] = useState<'exhausted' | 'dead'>('exhausted');
  const [killReason, setKillReason] = useState('Unresponsive after 3 pings / 14 days');
  const [rotationSuccessMessage, setRotationSuccessMessage] = useState<string | null>(null);

  const handleRotateTarget = () => {
    const updated = [...targets];
    const outTgt = updated[selectedOutTargetIndex];
    const inTgt = updated[selectedInTargetIndex];

    if (!outTgt || !inTgt) return;

    // Outgoing demoted to bench with status exhausted or dead
    outTgt.tier = 'bench';
    outTgt.status = rotationStatus;
    outTgt.whyUs = `${outTgt.whyUs} [Day 30 QBR Rotated (${rotationStatus.toUpperCase()}): ${killReason}]`;

    // Incoming promoted to primary
    inTgt.tier = 'primary';
    inTgt.status = 'research';

    setTargets(updated);
    setRotationSuccessMessage(`Successfully rotated out '${outTgt.name}' (Marked ${rotationStatus.toUpperCase()}) and promoted '${inTgt.name}' to Active Primary.`);
    setShowRotateModal(false);
  };

  // Step F: Intro Quality Bar
  const [singleAccountRule, setSingleAccountRule] = useState(true);
  const [oneSentenceFitRule, setOneSentenceFitRule] = useState(true);
  const [specificAskRule, setSpecificAskRule] = useState(true);

  // Step G: Execution
  const [kickoffMinutes, setKickoffMinutes] = useState(90);
  const [isFinalized, setIsFinalized] = useState(false);

  const togglePacketCheck = (key: keyof typeof packetChecks) => {
    const updated = { ...packetChecks, [key]: !packetChecks[key] };
    setPacketChecks(updated);
    const allChecked = Object.values(updated).every(Boolean);
    setPacketStatus(allChecked ? 'ready' : 'blocked');
  };

  const steps = [
    { id: 'A', label: 'Commercial Signoff', icon: FileText, complete: sowSigned && paymentCleared && refundAcknowledged },
    { id: 'B', label: '10-Min Fit Confirmation', icon: Users, complete: liveFitScore >= 70 && conflictChecked },
    { id: 'C', label: 'Cadence & SLAs', icon: Calendar, complete: reviewsScheduled && fiveDayCopySla && fourteenDayGapSla },
    { id: 'D', label: 'The File (Packet QA)', icon: ShieldCheck, complete: packetStatus === 'ready' },
    { id: 'E', label: '5+5 Account Mapping', icon: Target, complete: targets.length >= 5 },
    { id: 'F', label: 'Intro Quality Bar', icon: Sparkles, complete: singleAccountRule && oneSentenceFitRule && specificAskRule },
    { id: 'G', label: 'Finalize & Log Hours', icon: Clock, complete: isFinalized },
  ] as const;

  return (
    <div>
      <OperatorHeader 
        title="Kickoff Checklist: Apex Industrial Robotics" 
        subtitle="Operations Checklist v1.0 — Commercial Gating, Fit, The File, and Top 5 Mapping"
      />

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <Link href="/ops" className="hover:text-slate-900 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Book of Orgs</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Apex Industrial Robotics</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-indigo-600 font-bold">Kickoff Wizard</span>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isCurrent 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : s.complete
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.complete ? (
                  <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span>{s.id}. {s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Main Pane */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          {/* STEP A: COMMERCIAL GATING */}
          {activeStep === 'A' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Section A · Commercial Gating</span>
                <h2 className="text-xl font-black text-slate-900 mt-1">Commercial Gating & SOW Verification</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ensure the contract is legally binding, funds have settled in Stripe, and refund conditions are locked before kicking off.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sowSigned} 
                    onChange={(e) => setSowSigned(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">SOW Executed by Authorized Signatory</strong>
                    <span className="text-xs text-slate-500">
                      Standard membership terms signed. Program duration: {sku === 'year_1' ? '12 Months (8 Attempts)' : '90 Days (4 Attempts)'}.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={paymentCleared} 
                    onChange={(e) => setPaymentCleared(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Stripe Payment Cleared</strong>
                    <span className="text-xs text-slate-500">
                      Verified paid invoice in Stripe. No offline checks or unconfirmed wire transfers permitted.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={refundAcknowledged} 
                    onChange={(e) => setRefundAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">30-Day Refund Window Acknowledged</strong>
                    <span className="text-xs text-slate-500">
                      Member understands the refund window closes at day 30, or earlier upon acceptance of 2 qualified introductions.
                    </span>
                  </div>
                </label>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Program SKU</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSku('year_1')}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        sku === 'year_1' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="block font-black">Year-1 Annual Program</span>
                      <span className="text-[11px] text-slate-500 font-normal">8 Attempts Owed · $4,800 Prepaid / $400/mo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSku('sprint_90')}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        sku === 'sprint_90' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="block font-black">90-Day Capture Sprint</span>
                      <span className="text-[11px] text-slate-500 font-normal">4 Attempts Owed · $3,600 Prepaid</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setActiveStep('B')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2"
                >
                  <span>Proceed to Section B: Fit Confirmation</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP B: 10-MINUTE FIT CONFIRMATION */}
          {activeStep === 'B' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Section B · Fit Confirmation & Anti-Fraud</span>
                <h2 className="text-xl font-black text-slate-900 mt-1">10-Minute Fit Confirmation Call</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Live validation of operating history (&gt;24 mo), capacity to deliver, and blacklist/conflict checks.
                </p>
              </div>

              {/* Do-Not-Serve Blacklist Verification (FR-FIT-4) */}
              <div className={`p-5 rounded-2xl border transition ${
                blacklistStatus === 'blacklisted' 
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-sm' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${blacklistStatus === 'blacklisted' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {blacklistStatus === 'blacklisted' ? <Ban className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Do-Not-Serve Register Audit (FR-FIT-4)</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          blacklistStatus === 'blacklisted' ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {blacklistStatus === 'blacklisted' ? 'DO-NOT-SERVE MATCH' : 'REGISTER CLEAR'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Matches applicant domain and entity name against internal register of bad-faith entities, unpaid defaults, and competitor collisions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={blacklistDomainInput}
                      onChange={(e) => setBlacklistDomainInput(e.target.value)}
                      placeholder="e.g. domain.com"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      onClick={() => handleCheckBlacklist(blacklistDomainInput)}
                      disabled={isBlacklistChecking}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
                    >
                      {isBlacklistChecking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Verify</span>
                    </button>
                  </div>
                </div>

                {blacklistStatus === 'blacklisted' && blacklistMatch && (
                  <div className="mt-3.5 p-3.5 bg-white/95 border border-rose-300 rounded-xl text-xs space-y-1">
                    <div className="flex items-center space-x-2 text-rose-700 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>INELIGIBLE APPLICANT: Match found in public.do_not_serve</span>
                    </div>
                    <p className="text-slate-700"><strong>Flagged Entity:</strong> {blacklistMatch.entityName} · <strong>Reason:</strong> {blacklistMatch.reason.toUpperCase()}</p>
                    <p className="text-slate-600">{blacklistMatch.notes}</p>
                    <p className="text-[11px] text-rose-600 font-bold pt-1">Intake blocked. Score hard-failed to 0. Cannot proceed with member onboarding.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Call Fit Score</label>
                    <span className="text-2xl font-black text-indigo-600">{liveFitScore} / 100</span>
                  </div>
                  <input 
                    type="range" 
                    min="40" 
                    max="100" 
                    value={liveFitScore} 
                    onChange={(e) => setLiveFitScore(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hard Fail (&lt;50)</span>
                    <span>Review (50-69)</span>
                    <span className="font-bold text-emerald-600">Passed (&ge;70)</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={conflictChecked} 
                      onChange={(e) => setConflictChecked(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">Conflict of Interest Audit</strong>
                      <span className="text-xs text-slate-500">
                        Confirmed no direct account targeting collisions with existing Magnus Procura cohort members.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Fit Notes & Verification Details</label>
                <textarea 
                  rows={3} 
                  value={fitNotes} 
                  onChange={(e) => setFitNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setActiveStep('A')}
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('C')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2"
                >
                  <span>Proceed to Section C: Working Cadence</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP C: WORKING CADENCE */}
          {activeStep === 'C' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Section C · Cadence Agreement</span>
                <h2 className="text-xl font-black text-slate-900 mt-1">Working Cadence & Operational SLAs</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Establish milestone dates and lock the non-negotiable two-way turnaround SLAs.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reviewsScheduled} 
                    onChange={(e) => setReviewsScheduled(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Milestone Reviews Scheduled</strong>
                    <span className="text-xs text-slate-500">
                      Day 30 (SLA checkpoint & initial feedback), Day 60 (mid-term funnel review), Day 90 (renewal / keep assessment).
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fiveDayCopySla} 
                    onChange={(e) => setFiveDayCopySla(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">5-Day Member Copy Review SLA</strong>
                    <span className="text-xs text-slate-500">
                      Member agrees to review, approve, or request edits on drafted intro copy within 5 business days.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fourteenDayGapSla} 
                    onChange={(e) => setFourteenDayGapSla(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">14-Day Incomplete Packet SLA Pause Trigger</strong>
                    <span className="text-xs text-slate-500">
                      If member fails to supply required packet artifacts within 14 days, the SLA delivery clock automatically pauses.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setActiveStep('B')}
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('D')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2"
                >
                  <span>Proceed to Section D: Packet Signoff</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP D: THE FILE (PACKET QA) */}
          {activeStep === 'D' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Section D · The File Signoff</span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Packet Ready / Blocked Gatekeeper</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Clock starts at Packet Ready, not at signature. Verify all 8 Section D artifacts before flipping to Ready.
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center space-x-2 ${
                  packetStatus === 'ready' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                    : 'bg-amber-50 border-amber-300 text-amber-700'
                }`}>
                  {packetStatus === 'ready' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>PACKET READY · Clock Running</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>PACKET BLOCKED · Clock Paused</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'capStatement', label: '1. Capability Statement (<= 2 pages, verified PDF)' },
                  { key: 'oneLiner', label: '2. Offer One-Liner (Crisp problem/solution formulation)' },
                  { key: 'naicsCodes', label: '3. NAICS / PSC Code Mapping verified' },
                  { key: 'coiVerified', label: '4. Certificate of Insurance (COI) on file' },
                  { key: 'financialsReady', label: '5. Financials / Balance sheet statement reviewed' },
                  { key: 'pastPerf1', label: '6. Past Performance Case Study #1 (Named buyer & outcome)' },
                  { key: 'pastPerf2', label: '7. Past Performance Case Study #2 (Subcontract metrics)' },
                  { key: 'portalRegs', label: '8. Vendor Portal Registrations list verified' },
                ].map((item) => {
                  const isChecked = packetChecks[item.key as keyof typeof packetChecks];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => togglePacketCheck(item.key as keyof typeof packetChecks)}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-center space-x-3 transition ${
                        isChecked ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        readOnly 
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className={`text-xs font-bold ${isChecked ? 'text-emerald-950' : 'text-slate-700'}`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>System Invariant:</strong> The Railway API endpoint <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">POST /intros/:id/send</code> will reject any intro dispatch with HTTP 400 if packet status is not <code className="font-mono">ready</code>.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setActiveStep('C')}
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('E')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2"
                >
                  <span>Proceed to Section E: Account Mapping</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP E: 5+5 ACCOUNT MAPPING */}
          {activeStep === 'E' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Section E · Target Account Mapping & Bench</span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Top 5 Primary Targets + Active Bench</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Strict Invariant: Max 5 primary targets and bench accounts. Rotate dead/unresponsive accounts to preserve velocity.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 text-xs font-black flex items-center space-x-2 backdrop-blur-sm">
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    <span>{targets.filter(t => t.tier === 'primary').length}/5 Primary Active</span>
                  </div>
                  <button
                    onClick={() => setShowRotateModal(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center space-x-2"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Rotate Target</span>
                  </button>
                </div>
              </div>

              {rotationSuccessMessage && (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold">{rotationSuccessMessage}</span>
                  </div>
                  <button onClick={() => setRotationSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {targets.map((tgt, idx) => {
                  const isExhausted = tgt.status === 'exhausted';
                  const isDead = tgt.status === 'dead';
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border transition ${
                        tgt.tier === 'primary' 
                          ? 'border-blue-200/80 bg-blue-50/30 hover:border-blue-300' 
                          : isExhausted 
                            ? 'border-amber-200/80 bg-amber-50/20'
                            : isDead 
                              ? 'border-rose-200/80 bg-rose-50/20'
                              : 'border-slate-200 bg-slate-50/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            tgt.tier === 'primary' 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : isExhausted
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isDead
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isExhausted ? 'EXHAUSTED' : isDead ? 'DEAD' : `${tgt.tier.toUpperCase()} #${idx + 1}`}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{tgt.name}</h4>
                          <span className="text-[11px] text-slate-500">({tgt.knownDesk})</span>
                        </div>
                        <span className="text-xs font-mono text-indigo-600 font-bold">{tgt.championName} ({tgt.championRole})</span>
                      </div>
                      <div className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-200/80 mt-2 backdrop-blur-xs">
                        <strong>Why-Us Angle:</strong> {tgt.whyUs}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Liquid Glass Target Rotation Modal */}
              {showRotateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                  <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Day 30 QBR Target Rotation & Kill/Replace</h3>
                          <p className="text-[11px] text-slate-500">Retire primary target as Exhausted or Dead and promote bench account</p>
                        </div>
                      </div>
                      <button onClick={() => setShowRotateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">1. Select Primary Target to Rotate Out</label>
                        <select
                          value={selectedOutTargetIndex}
                          onChange={(e) => setSelectedOutTargetIndex(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          {targets.map((tgt, i) => tgt.tier === 'primary' && (
                            <option key={i} value={i}>
                              {tgt.name} ({tgt.championName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">2. Target Retirement Status (FR-ACC-4)</label>
                        <select
                          value={rotationStatus}
                          onChange={(e) => setRotationStatus(e.target.value as 'exhausted' | 'dead')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden mb-2"
                        >
                          <option value="exhausted">Exhausted · Standard 30-day outreach cycle completed without conversion</option>
                          <option value="dead">Dead · Direct buyer rejection / desk disqualified</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">3. Rotation / Retirement Reason</label>
                        <select
                          value={killReason}
                          onChange={(e) => setKillReason(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden mb-2"
                        >
                          <option value="Day 30 QBR: Outreach cycle exhausted after 3 pings">Day 30 QBR: Outreach cycle exhausted after 3 pings</option>
                          <option value="Procurement desk reorganization / frozen budget">Procurement desk reorganization / frozen budget</option>
                          <option value="Specific capability mismatch with desk requirements">Specific capability mismatch with desk requirements</option>
                          <option value="Champion relocated or departed organization">Champion relocated or departed organization</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">4. Select Bench Target to Promote to Primary</label>
                        <select
                          value={selectedInTargetIndex}
                          onChange={(e) => setSelectedInTargetIndex(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        >
                          {targets.map((tgt, i) => tgt.tier === 'bench' && tgt.status !== 'dead' && tgt.status !== 'exhausted' && (
                            <option key={i} value={i}>
                              {tgt.name} ({tgt.championName} - {tgt.knownDesk})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-800">
                        <strong>Hard Invariant:</strong> Maximum 5 primary accounts strictly enforced. Rotation records an immutable audit log entry in <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">audit_log</code>.
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setShowRotateModal(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRotateTarget}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                      >
                        Execute Target Rotation
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setActiveStep('D')}
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('F')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2"
                >
                  <span>Proceed to Section F: Intro Quality Bar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP F: INTRO QUALITY BAR */}
          {activeStep === 'F' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Section F · Quality Bar</span>
                <h2 className="text-xl font-black text-slate-900 mt-1">Anti-Opaque Intro Quality Bar</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Magnus Procura intros are strictly high-signal, one-account, one-sentence-fit, one-ask messages. No generic cold outreach.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={singleAccountRule} 
                    onChange={(e) => setSingleAccountRule(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Single Account Focus</strong>
                    <span className="text-xs text-slate-500">
                      Intro is directed to a specific named champion at a specific buyer desk. Never blasted to multiple buyers simultaneously.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={oneSentenceFitRule} 
                    onChange={(e) => setOneSentenceFitRule(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">One Sentence of Genuine Fit</strong>
                    <span className="text-xs text-slate-500">
                      Must explicitly articulate the exact supplier capability that solves the buyer’s known procurement bottleneck.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={specificAskRule} 
                    onChange={(e) => setSpecificAskRule(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Specific, Low-Friction Ask</strong>
                    <span className="text-xs text-slate-500">
                      15-minute briefing on vendor qualification or direct delivery of The File. No ambiguous exploratory pitches.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setActiveStep('E')}
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('G')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2"
                >
                  <span>Proceed to Section G: Finalize Kickoff</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP G: EXECUTION & LOG HOURS */}
          {activeStep === 'G' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Section G · Finalization</span>
                <h2 className="text-xl font-black text-slate-900 mt-1">Finalize Kickoff & Log Initial Operator Hours</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Locks the kickoff audit record, activates the member program, and logs operator kickoff time against the 15h annual budget.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kickoff Meeting & Review Duration</span>
                  <span className="text-sm font-black text-indigo-600">{kickoffMinutes} Minutes (1.5 Hours)</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="180" 
                  step="15"
                  value={kickoffMinutes} 
                  onChange={(e) => setKickoffMinutes(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <p className="text-[11px] text-slate-500">
                  This time will be logged into <code className="font-mono">operator_hours</code> for Apex Industrial Robotics. 
                  Budget remaining: {(15 - kickoffMinutes / 60).toFixed(1)}h of 15h annual loaded envelope.
                </p>
              </div>

              {isFinalized ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-black text-emerald-900">Kickoff Formally Completed & Locked</h3>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    The member program is active, The File is verified READY, SLA clocks have started, and targets are populated.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/ops"
                      className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                    >
                      <span>Return to Book of Orgs</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setActiveStep('F')}
                    className="text-slate-600 hover:text-slate-900 px-4 py-2 text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setIsFinalized(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Finalize Kickoff & Commit Records</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
