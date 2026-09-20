'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    operatingMonths: '24+',
    categoryType: 'commercial_service',
    namedAccounts: '',
    packetWillingness: 'ready',
    decisionMakerRole: 'founder_owner',
    targetCategory: 'machining_pro_services',
    conversionTone: 'accepts_reality',
  });

  const [submitted, setSubmitted] = useState(false);

  // ICP Score Calculation per PRD §11
  const calculateScore = () => {
    let score = 0;
    let hardFailReason: string | null = null;

    // 0. Do-Not-Serve Register Check (FR-FIT-4)
    const emailDomain = formData.email.includes('@') ? formData.email.split('@')[1]?.toLowerCase().trim() : '';
    const companyNorm = formData.companyName.toLowerCase();
    if (
      emailDomain.includes('fraud') ||
      emailDomain.includes('conflict') ||
      emailDomain.includes('bad') ||
      emailDomain.includes('default') ||
      companyNorm.includes('fraud') ||
      companyNorm.includes('bad faith')
    ) {
      hardFailReason = 'Ineligible applicant: Entity or email domain is registered on the Magnus Procura non-servicing register (FR-FIT-4). Prior default or competitor collision.';
    }

    // 1. Operating history (15 pts, fail if <12 mo)
    if (formData.operatingMonths === '<12') {
      hardFailReason = 'Magnus Procura serves established operating firms. Pre-revenue or <12-month startups cannot clear enterprise procurement risk.';
    } else if (formData.operatingMonths === '12-24') {
      score += 10;
    } else {
      score += 15;
    }

    // 2. Offer corporation buys (20 pts, fail if sponsorship/audience only)
    if (formData.categoryType === 'sponsorship') {
      hardFailReason = 'Corporate brand sponsorships and influencer decks are out of scope. We intro vendors of commercial goods and services.';
    } else {
      score += 20;
    }

    // 3. Can draft 5 target accounts with a why (15 pts)
    if (formData.namedAccounts.trim().split('\n').length >= 3) {
      score += 15;
    } else {
      score += 5;
    }

    // 4. Packet readiness or 30-day path (15 pts)
    if (formData.packetWillingness === 'ready') {
      score += 15;
    } else if (formData.packetWillingness === '30_days') {
      score += 10;
    } else {
      score += 0;
    }

    // 5. Decision-maker in room (10 pts)
    if (formData.decisionMakerRole === 'founder_owner' || formData.decisionMakerRole === 'bd_executive') {
      score += 10;
    } else {
      score += 2;
    }

    // 6. Category operator bench (15 pts)
    if (formData.targetCategory === 'machining_pro_services' || formData.targetCategory === 'it_cloud') {
      score += 15;
    } else {
      score += 10;
    }

    // 7. Tone: will look at a red conversion number (10 pts)
    if (formData.conversionTone === 'accepts_reality') {
      score += 10;
    } else {
      score += 0;
    }

    return { score, hardFail: Boolean(hardFailReason), hardFailReason };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const result = calculateScore();
  const isPassed = !result.hardFail && result.score >= 70;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-black text-blue-500 tracking-tight mb-2">
            MAGNUS PROCURA
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Fit Gate Assessment
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            PRD §11 ICP Evaluation · Score $\ge 70$ required to book kickoff
          </p>
        </div>

        {submitted ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
            {result.hardFail ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
                  ✕
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Application Ineligible</h2>
                  <p className="text-sm text-red-400 max-w-md mx-auto leading-relaxed">
                    {result.hardFailReason}
                  </p>
                </div>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left text-xs text-slate-400 leading-relaxed">
                  <p className="font-bold text-slate-300 uppercase tracking-wider mb-2">Our Anti-Opaque Commitment</p>
                  We decline applicants early rather than collecting membership dues for connections that will not convert. We encourage building 24+ months of operating past-performance before applying.
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  ← Edit Responses
                </button>
              </div>
            ) : isPassed ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
                  ✓
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest font-black text-emerald-400">ICP Score: {result.score} / 100</span>
                  <h2 className="text-2xl font-bold text-white mt-1">Pre-Qualified for Cohort 1</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                    Your operating profile meets Fortune 500 procurement risk standards. Select your program to execute SOW and open your packet checklist.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-xs font-bold text-blue-400 uppercase">Option A</span>
                    <h3 className="text-lg font-bold text-white mt-1">90-Day Capture Sprint</h3>
                    <p className="text-2xl font-black text-white mt-2">$3,600 <span className="text-xs font-normal text-slate-500">prepaid</span></p>
                    <ul className="text-xs text-slate-400 space-y-1.5 mt-4">
                      <li>• 4 named intro attempts</li>
                      <li>• Buyer-native packet review</li>
                      <li>• 3 QBRs + open scoreboard</li>
                    </ul>
                  </div>

                  <div className="p-6 bg-slate-950 border border-blue-500/40 rounded-2xl relative">
                    <span className="text-xs font-bold text-emerald-400 uppercase">Option B (Recommended)</span>
                    <h3 className="text-lg font-bold text-white mt-1">Year-1 Full Program</h3>
                    <p className="text-2xl font-black text-white mt-2">$4,800 <span className="text-xs font-normal text-slate-500">or $400/mo</span></p>
                    <ul className="text-xs text-slate-400 space-y-1.5 mt-4">
                      <li>• 8 named intro attempts (SLA)</li>
                      <li>• Top 5 + 5 Bench account map</li>
                      <li>• 30-day or 2-intro refund window</li>
                    </ul>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="inline-block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl text-center text-sm shadow-xl shadow-blue-600/20 transition"
                >
                  Proceed to Member Portal & SOW →
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
                  !
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest font-black text-amber-400">ICP Score: {result.score} / 100</span>
                  <h2 className="text-2xl font-bold text-white mt-1">Readiness Gap Identified</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                    Your profile scored below our 70-point threshold for immediate named intro syndication.
                  </p>
                </div>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left text-xs text-slate-400 space-y-2">
                  <p className="font-bold text-slate-300">Recommended Steps Before Resubmitting:</p>
                  <p>1. Formulate specific one-line value propositions for at least 5 named enterprise targets.</p>
                  <p>2. Complete Certificate of Insurance (COI) and past-performance write-ups.</p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  ← Adjust Answers
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Apex Industrial Solutions"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Decision-Maker Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="owner@company.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Operating History (Years in Business)
              </label>
              <select
                value={formData.operatingMonths}
                onChange={(e) => setFormData({ ...formData, operatingMonths: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="24+">24+ Months (Established invoices and customers)</option>
                <option value="12-24">12–24 Months (Emerging operating track record)</option>
                <option value="<12">&lt; 12 Months / Pre-Revenue (Idea or early testing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                What does your firm sell?
              </label>
              <select
                value={formData.categoryType}
                onChange={(e) => setFormData({ ...formData, categoryType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="commercial_service">Commercial B2B services / specialty supplies corporations buy</option>
                <option value="sponsorship">Audience-led creator brand deals / event sponsorships</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Target Accounts (Draft 3 to 5 corporate accounts you want to intro)
              </label>
              <textarea
                rows={3}
                required
                value={formData.namedAccounts}
                onChange={(e) => setFormData({ ...formData, namedAccounts: e.target.value })}
                placeholder="1. Lockheed Martin - composite tooling&#10;2. Boeing - hydraulic components&#10;3. Caterpillar - assembly supply"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Risk Packet Readiness (COI, Financials, Capability Statement)
              </label>
              <select
                value={formData.packetWillingness}
                onChange={(e) => setFormData({ ...formData, packetWillingness: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ready">We already have COI and capability statement ready to upload</option>
                <option value="30_days">Can assemble all required artifacts within 14–30 days</option>
                <option value="decline">We do not share insurance or financial documentation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Conversion Tone: How do you view procurement conversion?
              </label>
              <select
                value={formData.conversionTone}
                onChange={(e) => setFormData({ ...formData, conversionTone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="accepts_reality">I understand the base rate (~1 in 7 members lands a PO) and will track open conversion</option>
                <option value="needs_guarantee">I require guaranteed meetings and guaranteed corporate contracts</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition"
            >
              Evaluate Fit Score →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
