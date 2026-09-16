'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  DollarSign, 
  FileText, 
  Target, 
  Send, 
  TrendingUp, 
  Building2, 
  Lock, 
  AlertTriangle, 
  ChevronDown, 
  Sparkles,
  Layers,
  Award,
  Zap
} from 'lucide-react';

export default function HomePage() {
  const [activeArtifactTab, setActiveArtifactTab] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const artifacts = [
    {
      title: '1. Capability Statement',
      badge: '<= 2 Pages · PDF',
      summary: 'Strictly limited to 2 pages. Explicitly states core competencies, past prime contract performance, facility square footage, and equipment specifications without marketing fluff.',
      proofPoint: 'Verified against Fortune 500 tier-1 vendor qualification desk criteria.',
    },
    {
      title: '2. Offer One-Liner',
      badge: 'Formulaic Pitch',
      summary: 'A crisp, one-sentence problem/solution statement identifying the exact manufacturing bottleneck or subcontract need solved for the target enterprise desk.',
      proofPoint: 'Eliminates exploratory calls; champions know the scope within 5 seconds.',
    },
    {
      title: '3. NAICS & PSC Codes',
      badge: 'Procurement Taxonomy',
      summary: 'Comprehensive mapping of primary NAICS (e.g. 332710, 541512) and Product Service Codes (PSC) aligned to the buyer’s internal supplier diversity and sourcing databases.',
      proofPoint: 'Guarantees registration match in SAP Ariba, Coupa, and Defense portals.',
    },
    {
      title: '4. Certificate of Insurance (COI)',
      badge: 'Verified Coverage',
      summary: 'Pre-audited commercial general liability, errors & omissions, and cyber liability certificates meeting standard enterprise minimums ($2M - $5M aggregate).',
      proofPoint: 'No 3-week legal delay when buyer issues initial purchase order.',
    },
    {
      title: '5. Financial Soundness Statement',
      badge: 'Balance Sheet QA',
      summary: 'Proof of operating runway, creditworthiness, and bonding capacity to fulfill multi-six-figure delivery commitments without delivery failure.',
      proofPoint: 'Passes corporate risk assessment and Dun & Bradstreet checks.',
    },
    {
      title: '6. Past Performance Case Studies',
      badge: '2x Prime References',
      summary: 'Two detailed case studies citing named enterprise or defense subcontracts, technical tolerances delivered, and verifiable customer points of contact.',
      proofPoint: 'Demonstrates proven subcontract execution before intro is dispatched.',
    },
    {
      title: '7. Vendor Portal Registrations',
      badge: 'Pre-Registered',
      summary: 'Proof of active registration in target enterprise vendor portals (e.g. Lockheed Exostar, Boeing Supplier Portal, Ford Covisint).',
      proofPoint: 'Enables immediate vendor code assignment upon champion acceptance.',
    },
  ];

  const faqs = [
    {
      q: 'Why does Magnus Procura strictly limit target accounts to 5 primary and 5 bench?',
      a: 'Traditional lead brokers blast generic spam to hundreds of companies, destroying your firm’s market reputation. Magnus Procura enforces high-signal, deep-desk procurement intelligence. You map exactly 5 primary enterprise accounts plus 5 bench targets. Each account requires a named human champion (person_id NOT NULL) with a verifiable corporate email.',
    },
    {
      q: 'When does the SLA delivery clock start running?',
      a: 'The SLA delivery clock starts strictly when The File is verified READY by an assigned operator. It does NOT start at contract signature. If there are missing compliance artifacts (e.g. missing COI or past performance), the packet is BLOCKED and the SLA clock is paused until you provide the artifacts. We never introduce an unready supplier.',
    },
    {
      q: 'How does the Success Fee work, and why is it capped at $8,000?',
      a: 'Magnus Procura charges an 8% success fee on the first purchase order or subcontract awarded as a result of an introduction, capped strictly at $8,000 (800,000 cents) on Net 15 terms. Traditional brokers demand 20% to 35% indefinite commissions or equity kickbacks. Our cap aligns our incentives while letting you retain the compounding enterprise contract value.',
    },
    {
      q: 'Can a conference meetup, booth visit, or webinar be counted as an introduction?',
      a: 'No. Never. System database constraints strictly forbid promoting events to intros without a verified human champion. An introduction only counts toward the SLA if it is a formal, one-on-one introduction to a named enterprise decision-maker with member-approved copy.',
    },
    {
      q: 'What is the 30-Day Money-Back Refund Window?',
      a: 'Both our 90-Day Capture Sprint and Year-1 Annual Program include a 30-day refund window. If within the first 30 calendar days you decide Magnus Procura is not the right fit, you receive a full refund, no questions asked. The refund window closes at day 30 or earlier upon your acceptance of 2 qualified introductions.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-[300px] w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] pointer-events-none -z-10" />

      {/* STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              M
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block">
                MAGNUS PROCURA
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block -mt-1">
                The Conversion File
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#teardown" className="hover:text-blue-400 transition">The Broker Teardown</a>
            <a href="#the-file" className="hover:text-blue-400 transition">The File (Readiness)</a>
            <a href="#scoreboard" className="hover:text-blue-400 transition">Open Scoreboard</a>
            <a href="#pricing" className="hover:text-blue-400 transition">Commercial Architecture</a>
            <a href="#faq" className="hover:text-blue-400 transition">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Live System Status Pill */}
            <div className="hidden lg:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SLA Clocks Active</span>
            </div>

            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition"
            >
              Sign In
            </Link>

            <Link
              href="/apply"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center space-x-1.5"
            >
              <span>Apply for Fit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto text-center relative">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs uppercase tracking-widest font-black px-4 py-1.5 rounded-full mb-8 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>The Anti-Opaque Enterprise Intermediary</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-5xl mx-auto leading-[1.05] mb-8 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Accountable Supplier Readiness &amp; Named-Buyer Introductions.
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          No captive broker markups. No house-issued certificates. Exactly <strong>5 primary enterprise accounts</strong>, 
          a verified buyer-native compliance packet, and introductions delivered against a contractually audited SLA clock.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/apply"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-8 py-4 rounded-2xl transition shadow-xl shadow-blue-600/25 flex items-center justify-center space-x-2"
          >
            <span>Apply for Fit Review (2 Minutes)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#scoreboard"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm px-8 py-4 rounded-2xl transition flex items-center justify-center space-x-2"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>View Open Scoreboard</span>
          </a>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl text-left">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>SLA Guarantee</span>
            </div>
            <p className="text-3xl font-black text-white">8 Attempts</p>
            <p className="text-xs text-slate-400 mt-1">Contractual delivery velocity (approx 1 per 45 days)</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl text-left">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Success Fee Cap</span>
            </div>
            <p className="text-3xl font-black text-emerald-400">$8,000 Max</p>
            <p className="text-xs text-slate-400 mt-1">8% of first purchase order capped on Net 15</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl text-left">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Human Champions</span>
            </div>
            <p className="text-3xl font-black text-white">100% Named</p>
            <p className="text-xs text-slate-400 mt-1">Strict <code className="text-indigo-400 font-mono">person_id NOT NULL</code> constraint</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl text-left">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>COGS Discipline</span>
            </div>
            <p className="text-3xl font-black text-white">15h Budget</p>
            <p className="text-xs text-slate-400 mt-1">$120/hr loaded rate · Max 15 members per operator</p>
          </div>
        </div>

        {/* Compliance / Enterprise Readiness Strip */}
        <div className="mt-16 pt-8 border-t border-slate-900 flex flex-wrap items-center justify-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
          <span className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>CMMC Level 2 Ready</span></span>
          <span className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>AS9100 / ISO 9001 Format</span></span>
          <span className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>ITAR Compliant Data Vault</span></span>
          <span className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Forced RLS Multi-Tenant Security</span></span>
        </div>
      </section>

      {/* SECTION 1: THE BROKER TEARDOWN COMPARISON */}
      <section id="teardown" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-rose-400 uppercase tracking-widest block mb-2">The Founding Teardown</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Traditional Intermediaries vs. Magnus Procura
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Why the legacy matchmaking broker model extracts supplier equity while delivering zero accountability.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Opaque Broker Side */}
            <div className="p-8 lg:p-12 bg-rose-950/10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                  ✕
                </div>
                <div>
                  <h3 className="text-lg font-bold text-rose-200">The Traditional Broker / ProcuraFind Model</h3>
                  <span className="text-xs text-rose-400/80 font-mono">Opaque Intermediary Dynamic</span>
                </div>
              </div>

              <ul className="space-y-5 text-xs text-slate-300">
                <li className="flex items-start space-x-3">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">20% to 35% Hidden Markups</strong>
                    <span>Brokers mark up vendor quotes behind closed doors or demand permanent gross revenue commissions.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Generic Spray-and-Pray Spam</strong>
                    <span>Blasts hundreds of cold emails to generic procurement inboxes, destroying vendor reputation.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Vanity "Readiness Certificates"</strong>
                    <span>Issues house-branded certificates that Fortune 500 buyer desks discard immediately.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Webinars Counted as Introductions</strong>
                    <span>Counts conference meetups or group zoom calls as completed introduction deliverables.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Zero Refund &amp; Lock-in</strong>
                    <span>Annual contracts paid upfront with zero performance obligations or delivery refund windows.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Magnus Procura Side */}
            <div className="p-8 lg:p-12 bg-blue-950/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">The Magnus Procura Standard</h3>
                  <span className="text-xs text-emerald-400 font-mono">Anti-Opaque Contract</span>
                </div>
              </div>

              <ul className="space-y-5 text-xs text-slate-300">
                <li className="flex items-start space-x-3">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Zero Hidden Markups ($8,000 Cap)</strong>
                    <span>Transparent $4,800 Year-1 program with 8% success fee capped at $8,000 on Net 15. You keep 100% of renewals.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Strict 5 Primary + 5 Bench Accounts</strong>
                    <span>Hard database triggers prevent account spam. Tailored 3-point dispatches sent only to verified human champions.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Buyer-Native "The File"</strong>
                    <span>8 pre-audited artifacts (2-page capability statement, COI, NAICS, audited balance sheet) that buyers score instantly.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">Clock Starts at Packet Ready Only</strong>
                    <span>Introductions cannot be dispatched while The File is blocked. SLA delivery velocity is tracked in public SQL views.</span>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <div>
                    <strong className="text-white block font-bold">30-Day Money-Back Refund &amp; Day 91 Bounties</strong>
                    <span>30 calendar days to cancel for a full refund. Strategic partner bounties ($500) released only on kept outcomes.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: "THE FILE" INTERACTIVE SHOWCASE */}
      <section id="the-file" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-2">Section D Artifacts</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The File: Buyer-Native Procurement Dossier
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Every introduction delivers a 24-hour signed cryptographic vault containing the exact documentation enterprise procurement desks require.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Artifact Selector Tabs */}
          <div className="lg:col-span-1 space-y-2">
            {artifacts.map((art, idx) => (
              <button
                key={idx}
                onClick={() => setActiveArtifactTab(idx)}
                className={`w-full text-left p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                  activeArtifactTab === idx
                    ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-600/10'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{art.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                  activeArtifactTab === idx ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {art.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Artifact Deep Dive Inspector */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Inspecting Artifact Specification</span>
                <h3 className="text-xl font-black text-white mt-1">{artifacts[activeArtifactTab].title}</h3>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-mono font-bold">
                {artifacts[activeArtifactTab].badge}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Standard Requirements</label>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {artifacts[activeArtifactTab].summary}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Buyer Desk Advantage</label>
                <p className="text-sm text-emerald-400 font-semibold bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/40 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <span>{artifacts[activeArtifactTab].proofPoint}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Encrypted in private Supabase Storage</span>
              </span>
              <Link href="/apply" className="text-blue-400 font-bold hover:underline">
                Audit your packet in Fit Gate &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: OPEN SCOREBOARD & FUNNEL CONVERSION */}
      <section id="scoreboard" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block mb-2">Audited Performance</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The Open Scoreboard: Real Conversion Velocity
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Backed by the <code className="font-mono text-emerald-400">member_funnel</code> and <code className="font-mono text-emerald-400">cohort_card</code> SQL views. 
            Published only when cohort $n \ge 10$.
          </p>
        </div>

        {/* Funnel Visual Pipeline */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-12">
          {[
            { step: '1. Sent', rate: '100%', count: '48 Attempts', desc: 'Member approved copy', color: 'border-blue-500/40 bg-blue-950/20' },
            { step: '2. Met', rate: '79%', count: '38 Meetings', desc: '15-min qualification held', color: 'border-indigo-500/40 bg-indigo-950/20' },
            { step: '3. Qualified', rate: '54%', count: '26 Evaluated', desc: 'Vendor portal code issued', color: 'border-purple-500/40 bg-purple-950/20' },
            { step: '4. Opportunity', rate: '33%', count: '16 Live SOWs', desc: 'Active RFP / Subcontract', color: 'border-amber-500/40 bg-amber-950/20' },
            { step: '5. PO Won', rate: '19%', count: '9 Contracts', desc: 'Subcontract awarded', color: 'border-emerald-500/40 bg-emerald-950/20' },
            { step: '6. Kept-90', rate: '100%', count: 'Day 91 Active', desc: 'Zero refund clawbacks', color: 'border-emerald-500/80 bg-emerald-900/30' },
          ].map((item, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${item.color} text-left flex flex-col justify-between`}>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">{item.step}</span>
                <span className="text-2xl font-black text-white mt-1 block">{item.rate}</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block">{item.count}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-center max-w-2xl mx-auto">
          <p className="text-xs text-slate-300">
            <strong>The Anti-Vanity Doctrine:</strong> We do not publish anecdotal founder testimonials. 
            We publish programmatic cohort conversion cards verified against signed purchase orders.
          </p>
        </div>
      </section>

      {/* SECTION 4: COMMERCIAL ARCHITECTURE & PRICING */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-2">Transparent Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Unit Economics Aligned With Your Growth
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Two distinct programs designed for rapid market capture and sustained tier-1 subcontract positioning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Card 1: 90-Day Capture Sprint */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-mono font-bold uppercase">
                Sprint Option
              </span>
              <h3 className="text-2xl font-black text-white">90-Day Capture Sprint</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-white">$3,600</span>
                <span className="text-xs text-slate-400">Prepaid for 90 Days</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ideal for established sub-tier suppliers targeting an immediate qualification cycle at 5 named accounts.
              </p>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>4 Named Introductions</strong> guaranteed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>5 Primary + 5 Bench Account Map</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>7.5h Loaded Operator Budget envelope</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Full 30-Day Money-Back Refund Window</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/apply"
                className="w-full block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-6 rounded-xl text-center text-xs transition"
              >
                Apply for Sprint Review
              </Link>
            </div>
          </div>

          {/* Card 2: Year-1 Enterprise Program (FEATURED) */}
          <div className="bg-gradient-to-b from-blue-950/40 to-slate-900 border-2 border-blue-500/80 p-8 rounded-3xl flex flex-col justify-between relative shadow-2xl shadow-blue-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
              Most Popular · Full Annual Program
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-mono font-bold uppercase">
                Annual Program
              </span>
              <h3 className="text-2xl font-black text-white">Year-1 Enterprise Program</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-white">$4,800</span>
                <span className="text-xs text-slate-400">Prepaid / $400/mo</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full annual enterprise partnership with dedicated operator assignment and continuous introduction pacing.
              </p>

              <ul className="space-y-3 text-xs text-slate-200 pt-4 border-t border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span><strong>8 Named Introductions</strong> (1 per ~45 days)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Dedicated Lead Operator (Max 15 capacity)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>15-Hour Loaded Annual Operator Envelope</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Success Fee: 8% on first PO, capped at <strong>$8,000</strong></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Full 30-Day Money-Back Guarantee</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/apply"
                className="w-full block bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 px-6 rounded-xl text-center text-xs transition shadow-lg shadow-blue-600/20"
              >
                Apply for Year-1 Cohort
              </Link>
            </div>
          </div>

          {/* Card 3: Strategic Referral Mesh */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-mono font-bold uppercase">
                Ecosystem Partners
              </span>
              <h3 className="text-2xl font-black text-white">Referral Mesh</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-emerald-400">$500</span>
                <span className="text-xs text-slate-400">per Kept Member</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For manufacturing associations, advisory firms, and VC operators introducing qualified industrial suppliers.
              </p>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>$500 bounty paid automatically on Day 91</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Partner Portal with referral stage tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Direct ACH disbursement upon keep</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Zero supplier confidentiality leakage</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/partner/referrals"
                className="w-full block bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-6 rounded-xl text-center text-xs transition border border-slate-700"
              >
                Access Partner Mesh
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ & THE DOCTRINE */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-t border-slate-900">
        <div className="text-center mb-16">
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-2">Clarity &amp; Invariants</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between space-x-4 cursor-pointer"
                >
                  <span className="text-sm font-bold text-slate-100">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA STRIP */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 border border-blue-800/60 p-12 rounded-3xl text-center space-y-6 relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Ready to Prove Your Procurement Readiness?
          </h2>
          <p className="text-sm text-blue-200 max-w-2xl mx-auto">
            Take our 2-minute Fit Gate assessment. If your score is $\ge 70$, our operators will schedule your 10-minute Fit Confirmation call.
          </p>
          <div className="pt-2">
            <Link
              href="/apply"
              className="inline-flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-900 font-black text-sm px-8 py-4 rounded-2xl transition shadow-xl"
            >
              <span>Begin Fit Gate Application</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2">
            <span className="text-sm font-black text-white tracking-tight">MAGNUS PROCURA</span>
            <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
              Accountable B2B supplier readiness and named-buyer introduction. Connections count only after they convert.
            </p>
            <p className="text-[10px] text-slate-600 font-mono">
              Postgres System of Record · 100% Forced RLS · Zero-Client-Secret Architecture
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs font-medium">
            <div>
              <span className="font-bold text-slate-300 block mb-2 uppercase text-[10px]">Portals</span>
              <ul className="space-y-1.5">
                <li><Link href="/app" className="hover:text-blue-400 transition">Member Portal</Link></li>
                <li><Link href="/ops" className="hover:text-indigo-400 transition">Operator Console</Link></li>
                <li><Link href="/partner/referrals" className="hover:text-emerald-400 transition">Partner Portal</Link></li>
                <li><Link href="/admin" className="hover:text-purple-400 transition text-purple-400 font-bold">Admin Root</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-300 block mb-2 uppercase text-[10px]">Legal &amp; Policy</span>
              <ul className="space-y-1.5">
                <li><span className="hover:text-slate-400 cursor-pointer">SOW Standard Terms</span></li>
                <li><span className="hover:text-slate-400 cursor-pointer">30-Day Refund Policy</span></li>
                <li><span className="hover:text-slate-400 cursor-pointer">8% Success Fee Cap ($8k)</span></li>
                <li><span className="hover:text-slate-400 cursor-pointer">Enterprise Privacy</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-900 text-center text-[10px] text-slate-600">
          © 2026 Magnus Procura. All rights reserved. Operating under strict anti-opaque intermediary architectural invariants.
        </div>
      </footer>
    </div>
  );
}
