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
  Zap,
  Activity
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
    <div className="min-h-screen bg-[#030712] text-white selection:bg-emerald-500 selection:text-black relative overflow-x-hidden font-sans">
      {/* Background Ambient Fluid Mesh Glows */}
      <div className="fixed top-[-150px] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-emerald-500/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none -z-0 animate-fluid-1" />
      <div className="fixed top-[600px] -left-[250px] w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none -z-0 animate-fluid-2" />
      <div className="fixed top-[1400px] -right-[250px] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-0 animate-fluid-1" />

      {/* FLOATING LIQUID GLASS NAVIGATION BAR */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 max-w-7xl mx-auto">
        <header className="liquid-glass specular-edge rounded-full px-6 h-18 flex items-center justify-between backdrop-blur-2xl bg-slate-950/60 shadow-2xl">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-all duration-300">
              M
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">
                MAGNUS PROCURA
              </span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block -mt-0.5">
                The Conversion File
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#teardown" className="hover:text-emerald-400 transition-colors">The Teardown</a>
            <a href="#the-file" className="hover:text-emerald-400 transition-colors">The File</a>
            <a href="#scoreboard" className="hover:text-emerald-400 transition-colors">Open Scoreboard</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Commercial Architecture</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Live System Status Pill */}
            <div className="hidden sm:flex items-center space-x-2 liquid-pill px-3 py-1.5 rounded-full text-[11px] font-bold text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span>SLA Clocks Active</span>
            </div>

            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-full transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/apply"
              className="liquid-pill bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4.5 py-2 rounded-full transition-all duration-300 shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)] flex items-center space-x-1.5"
            >
              <span>Apply for Fit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className="pt-20 pb-20 px-6 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center space-x-2 liquid-pill text-emerald-300 text-xs uppercase tracking-widest font-black px-4 py-1.5 rounded-full mb-8 border-emerald-500/30 bg-emerald-500/10 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>The Anti-Opaque Enterprise Intermediary</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-5xl mx-auto leading-[1.05] mb-8 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Accountable Supplier Readiness &amp; Named-Buyer Introductions.
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          No captive broker markups. No house-issued certificates. Exactly <strong className="text-white font-semibold">5 primary enterprise accounts</strong>, 
          a verified buyer-native compliance packet, and introductions delivered against a contractually audited SLA clock.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link
            href="/apply"
            className="w-full sm:w-auto liquid-pill bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_30px_-5px_rgba(16,185,129,0.6)] flex items-center justify-center space-x-2"
          >
            <span>Apply for Fit Review (2 Minutes)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#scoreboard"
            className="w-full sm:w-auto liquid-pill text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span>View Verified Scoreboard</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </a>
        </div>

        {/* Institutional Invariant Proof Cards with Liquid Glass Treatment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="w-10 h-10 rounded-2xl liquid-pill flex items-center justify-center mb-4 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-white font-mono">8 Attempts</div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1">
              Contractual SLA
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Clock starts only when The File is certified READY. Never on vague retainers.
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="w-10 h-10 rounded-2xl liquid-pill flex items-center justify-center mb-4 text-blue-400">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-white font-mono">5 + 5 Targets</div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-1">
              Zero Generic Spam
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              5 primary enterprise accounts plus 5 bench. Deep research on specific procurement desks.
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="w-10 h-10 rounded-2xl liquid-pill flex items-center justify-center mb-4 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-white font-mono">$8,000 Cap</div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1">
              8% Success Fee Max
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Net 15 success fee strictly capped at $8,000 on first PO. You keep compounding enterprise value.
            </p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl relative">
            <div className="w-10 h-10 rounded-2xl liquid-pill flex items-center justify-center mb-4 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-white font-mono">15 Orgs Max</div>
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mt-1">
              Operator Allocation
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Human operators capped at 15 suppliers, backed by a 15h annual labor budget.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: INCUMBENT TEARDOWN MATRIX */}
      <section id="teardown" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-rose-400 tracking-widest uppercase block mb-2">
            The Brokerage Friction Breakdown
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Traditional Intermediaries vs. Magnus Procura
          </h2>
          <p className="text-slate-400 text-sm mt-4">
            Most government &amp; defense lead brokers trap suppliers in opaque retainers with phantom pipelines.
          </p>
        </div>

        {/* Liquid Glass Teardown Comparison Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Broker Column */}
          <div className="liquid-glass p-8 rounded-3xl border-rose-500/20 bg-rose-950/10 relative">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-black uppercase tracking-wider mb-6">
              <AlertTriangle className="w-4 h-4" />
              <span>The Incumbent Broker Playbook</span>
            </div>

            <div className="space-y-6 text-xs text-slate-300">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-white text-sm">Opaque Monthly Retainers ($5k-$15k/mo)</h3>
                <p className="text-slate-400 mt-1">Paid indefinitely with zero contractual delivery dates or refunds.</p>
              </div>

              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-white text-sm">20% - 35% Lifetime Commission Traps</h3>
                <p className="text-slate-400 mt-1">Brokers take permanent percentages of all downstream master service agreements.</p>
              </div>

              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-white text-sm">Automated AI Cold Spam</h3>
                <p className="text-slate-400 mt-1">Blasts generic emails to 500+ unverified inboxes, burning your corporate reputation.</p>
              </div>

              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-white text-sm">No Buyer-Side Readiness Audit</h3>
                <p className="text-slate-400 mt-1">Introductions are made without COI, NAICS, or security clearance; buyers discard you.</p>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">Phantom Pipelines</h3>
                <p className="text-slate-400 mt-1">Conference hall greetings and webinar registrations count as "delivered intros".</p>
              </div>
            </div>
          </div>

          {/* Magnus Procura Column */}
          <div className="liquid-glass specular-edge p-8 rounded-3xl border-emerald-500/30 bg-emerald-950/15 relative">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>The Magnus Procura Standard</span>
            </div>

            <div className="space-y-6 text-xs text-slate-200">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-emerald-300 text-sm">Fixed Transparent Tiers + 30-Day Refund</h3>
                <p className="text-slate-300 mt-1">$3,600 (90-Day Sprint) or $4,800 (Annual). Full refund if not satisfied in 30 days.</p>
              </div>

              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-emerald-300 text-sm">Strictly Capped 8% Success Fee ($8,000 Max)</h3>
                <p className="text-slate-300 mt-1">Applies only to the first awarded PO. Never touches your recurring or follow-on contracts.</p>
              </div>

              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-emerald-300 text-sm">Dedicated Human Champions (Zero Spam)</h3>
                <p className="text-slate-300 mt-1">Every introduction requires a named champion with member-approved custom copy.</p>
              </div>

              <div className="border-b border-white/5 pb-4">
                <h3 className="font-bold text-emerald-300 text-sm">"The File" 7-Point Procurement Dossier</h3>
                <p className="text-slate-300 mt-1">SLA clock stays paused until your COI, NAICS, and past performance are certified ready.</p>
              </div>

              <div>
                <h3 className="font-bold text-emerald-300 text-sm">Contractual 8-Attempt Delivery SLA</h3>
                <p className="text-slate-300 mt-1">Audited SLA clocks track delivery. Delinquencies trigger automatic operator alerts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE FILE (PROCUREMENT READINESS) */}
      <section id="the-file" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-emerald-400 tracking-widest uppercase block mb-2">
            Procurement Readiness Architecture
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            "The File" — What Enterprise Buyers Actually Demand
          </h2>
          <p className="text-slate-400 text-sm mt-4">
            Fortune 500 and Defense prime contractors reject 94% of suppliers due to missing compliance artifacts. 
            Magnus Procura audits and packages your 7-point readiness dossier before making contact.
          </p>
        </div>

        {/* Interactive Dossier Inspector */}
        <div className="liquid-glass specular-edge rounded-3xl overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto p-3 border-b border-white/10 gap-2">
            {artifacts.map((art, idx) => (
              <button
                key={art.title}
                onClick={() => setActiveArtifactTab(idx)}
                className={`liquid-pill px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  activeArtifactTab === idx
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {art.title.split('.')[1]}
              </button>
            ))}
          </div>

          {/* Active Artifact Inspection Panel */}
          <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="liquid-pill px-3 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                {artifacts[activeArtifactTab].badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {artifacts[activeArtifactTab].title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {artifacts[activeArtifactTab].summary}
              </p>
              
              <div className="liquid-pill p-4 rounded-2xl border-emerald-500/20 bg-emerald-950/20 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200">
                  <strong className="text-white block mb-0.5">Procurement Proof Point:</strong>
                  {artifacts[activeArtifactTab].proofPoint}
                </div>
              </div>
            </div>

            {/* Dossier Mock Window */}
            <div className="lg:col-span-5 liquid-glass-interactive p-6 rounded-2xl border-white/15">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[10px] font-mono text-slate-400">
                <span>SECTION_D // READINESS_ARTIFACT</span>
                <span className="text-emerald-400 font-bold">STATUS: AUDITED</span>
              </div>
              <div className="mt-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Artifact Index:</span>
                  <span className="text-white font-bold">{activeArtifactTab + 1} of 7</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Buyer Tier Compliance:</span>
                  <span className="text-emerald-400 font-bold">Fortune 500 / DoD Prime</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SLA Dependency:</span>
                  <span className="text-purple-300 font-bold">Gating Requirement</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-1.5 mt-3 overflow-hidden border border-white/10">
                  <div className="bg-emerald-400 h-full w-full shadow-[0_0_8px_#34d399]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: OPEN CONVERSION SCOREBOARD */}
      <section id="scoreboard" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-blue-400 tracking-widest uppercase block mb-2">
            Radical Open Metrics
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            The Conversion Scoreboard
          </h2>
          <p className="text-slate-400 text-sm mt-4">
            Aggregated conversion rates published across all active and completed member cohorts (n &ge; 10 required).
          </p>
        </div>

        {/* Liquid Funnel Progression */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stage 1</span>
            <div className="text-3xl font-black text-white font-mono mt-2">100%</div>
            <h3 className="text-xs font-bold text-slate-200 mt-1">Introductions Sent</h3>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">112 Delivered</p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Stage 2</span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-2">79%</div>
            <h3 className="text-xs font-bold text-slate-200 mt-1">Champion Met</h3>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">88 Meetings Held</p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl text-center">
            <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Stage 3</span>
            <div className="text-3xl font-black text-teal-400 font-mono mt-2">54%</div>
            <h3 className="text-xs font-bold text-slate-200 mt-1">Desk Qualified</h3>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">60 Qualified Desks</p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl text-center">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Stage 4</span>
            <div className="text-3xl font-black text-blue-400 font-mono mt-2">33%</div>
            <h3 className="text-xs font-bold text-slate-200 mt-1">Active RFQ / Opp</h3>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">37 Subcontracts</p>
          </div>

          <div className="liquid-glass-interactive specular-edge p-6 rounded-3xl text-center border-emerald-500/40 bg-emerald-950/20">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Stage 5</span>
            <div className="text-3xl font-black text-emerald-300 font-mono mt-2">19%</div>
            <h3 className="text-xs font-bold text-white mt-1">PO Awarded</h3>
            <p className="text-[11px] text-emerald-400 mt-2 font-mono font-bold">$1.45M GMV</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-400 font-mono">
            Median Time to PO Award: <strong className="text-white">62 Days</strong> · Average Award Value: <strong className="text-white">$161,000</strong>
          </p>
        </div>
      </section>

      {/* SECTION 5: TRANSPARENT PRICING TIERS */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-emerald-400 tracking-widest uppercase block mb-2">
            Commercial Architecture
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Transparent Pricing. Capped Success Fees.
          </h2>
          <p className="text-slate-400 text-sm mt-4">
            Zero indefinite commissions. All tiers include full audit of The File, named enterprise targeting, and our 30-day money-back guarantee.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tier 1: 90-Day Sprint */}
          <div className="liquid-glass-interactive specular-edge p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Fast-Track Validation</div>
              <h3 className="text-2xl font-black text-white mt-1">90-Day Capture Sprint</h3>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-black text-white font-mono">$3,600</span>
                <span className="text-xs text-slate-400 ml-2">/ one-time</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">For suppliers seeking swift validation against 5 target accounts.</p>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>4 Target Enterprise Introductions (SLA)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>5 Primary + 5 Bench Targets</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>7-Point File Audit &amp; Readiness Stamp</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>8% Success Fee (Capped at $8,000)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>30-Day Money-Back Refund Window</span>
                </li>
              </ul>
            </div>

            <Link
              href="/apply"
              className="mt-8 liquid-pill w-full py-3.5 rounded-2xl text-center text-xs font-black text-white hover:bg-white/10 transition block"
            >
              Apply for 90-Day Sprint
            </Link>
          </div>

          {/* Tier 2: Year-1 Annual (Featured) */}
          <div className="liquid-glass specular-edge p-8 rounded-3xl border-emerald-500/40 bg-emerald-950/20 relative flex flex-col justify-between shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Annual Procurement Scale</span>
                <span className="liquid-pill px-3 py-1 rounded-full text-[10px] font-bold text-slate-950 bg-emerald-400">
                  MOST CHOSEN
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">Year-1 Annual Retainer</h3>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-black text-white font-mono">$4,800</span>
                <span className="text-xs text-slate-400 ml-2">/ year (or $400/mo)</span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-2">Comprehensive institutional pipeline development with ongoing account rotation.</p>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-200">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>8 Target Enterprise Introductions (SLA)</strong></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated Lead Human Operator (15h Budget)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Account Rotation (Swap Inactive Accounts)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Continuous 7-Point Dossier Refresh</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>8% Success Fee (Capped at $8,000)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>30-Day Money-Back Guarantee</span>
                </li>
              </ul>
            </div>

            <Link
              href="/apply"
              className="mt-8 liquid-pill bg-emerald-500 hover:bg-emerald-400 text-slate-950 w-full py-3.5 rounded-2xl text-center text-xs font-black transition shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)] block"
            >
              Apply for Year-1 Program
            </Link>
          </div>

          {/* Tier 3: Partner Mesh */}
          <div className="liquid-glass-interactive specular-edge p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Ecosystem Network</div>
              <h3 className="text-2xl font-black text-white mt-1">Partner Referral Mesh</h3>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-black text-white font-mono">$500</span>
                <span className="text-xs text-slate-400 ml-2">Keep-90 Bounty</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">For trade associations, fractional executives, and procurement advisors.</p>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>$500 Paid on Day 91 of Retained Membership</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Real-Time Referral Tracking Portal</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Automatic Clawback Protection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Partner Mesh Co-Marketing Badging</span>
                </li>
              </ul>
            </div>

            <Link
              href="/partner/referrals"
              className="mt-8 liquid-pill w-full py-3.5 rounded-2xl text-center text-xs font-black text-purple-300 hover:text-white border-purple-500/30 hover:bg-purple-500/20 transition block"
            >
              Join Partner Mesh
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6: DOCTRINE & FAQ */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-black text-emerald-400 tracking-widest uppercase block mb-2">
            Non-Negotiables
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div 
                key={faq.q}
                className="liquid-glass-interactive specular-edge rounded-3xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-sm text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="liquid-glass specular-edge border-t border-white/10 py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-[10px]">
              M
            </div>
            <span className="text-white font-black tracking-tight">MAGNUS PROCURA</span>
            <span className="text-slate-500">·</span>
            <span>The Enterprise Supplier Readiness &amp; Conversion System</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400 font-semibold">
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/apply" className="hover:text-white transition">Apply for Fit</Link>
            <Link href="/admin" className="hover:text-purple-400 transition">Executive Admin</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/5 text-[11px] text-slate-500 text-center">
          &copy; 2026 Magnus Procura. All rights reserved. 8-Attempt SLA • $8,000 Success Fee Cap • Zero Captured Brokers.
        </div>
      </footer>
    </div>
  );
}
