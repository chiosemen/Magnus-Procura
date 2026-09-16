'use client';

import { useState } from 'react';
import PartnerHeader from '@/components/PartnerHeader';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Building2, 
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';

interface PartnerReferral {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  category: string;
  submittedAt: string;
  stage: 'submitted' | 'fit_reviewed' | 'active_program' | 'kept_90' | 'declined';
  bountyStatus: 'pending_conversion' | 'pending_day_91' | 'earned_bounty' | 'ineligible';
  notes?: string;
}

const INITIAL_REFERRALS: PartnerReferral[] = [
  {
    id: 'ref_001',
    companyName: 'Apex Industrial Robotics',
    contactName: 'Marcus Vance',
    contactEmail: 'm.vance@apexrobotics.io',
    category: 'Advanced Manufacturing & Automation',
    submittedAt: '2026-06-15',
    stage: 'kept_90',
    bountyStatus: 'earned_bounty',
    notes: 'Completed Day 91 keep without refund. $500 bounty paid.',
  },
  {
    id: 'ref_002',
    companyName: 'Vanguard Cyber Logistics',
    contactName: 'Elena Rostova',
    contactEmail: 'elena@vanguardlogistics.com',
    category: 'Cybersecurity Supply Chain Logistics',
    submittedAt: '2026-07-20',
    stage: 'active_program',
    bountyStatus: 'pending_day_91',
    notes: 'Active Year-1 program. Day 91 milestone on 2026-10-19.',
  },
  {
    id: 'ref_003',
    companyName: 'Helios Advanced Composites',
    contactName: 'Brian Torres',
    contactEmail: 'b.torres@helioscomposites.com',
    category: 'Aerospace Carbon Structures',
    submittedAt: '2026-09-10',
    stage: 'fit_reviewed',
    bountyStatus: 'pending_conversion',
    notes: 'Fit score 85/100. Commercial proposal and SOW sent.',
  },
  {
    id: 'ref_004',
    companyName: 'Strata Clean Energy Sensors',
    contactName: 'Claire Zhang',
    contactEmail: 'claire@stratasensors.com',
    category: 'Sensor Telemetry Hardware',
    submittedAt: '2026-06-01',
    stage: 'kept_90',
    bountyStatus: 'earned_bounty',
    notes: 'Completed 90-Day Sprint with accepted attestation.',
  },
];

export default function PartnerReferralsPage() {
  const [referrals, setReferrals] = useState<PartnerReferral[]>(INITIAL_REFERRALS);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [category, setCategory] = useState('');
  const [estRevenue, setEstRevenue] = useState('$1M - $5M');
  const [notes, setNotes] = useState('');

  const handleSubmitReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef: PartnerReferral = {
      id: `ref_${Date.now()}`,
      companyName,
      contactName,
      contactEmail,
      category,
      submittedAt: new Date().toISOString().split('T')[0],
      stage: 'submitted',
      bountyStatus: 'pending_conversion',
      notes: `Estimated Revenue: ${estRevenue}. Context: ${notes}`,
    };

    setReferrals([newRef, ...referrals]);
    setSubmittedMessage(`Referral for ${companyName} submitted successfully! Our operators will initiate fit review.`);
    
    // Clear form
    setCompanyName('');
    setContactName('');
    setContactEmail('');
    setCategory('');
    setNotes('');

    setTimeout(() => setSubmittedMessage(null), 5000);
  };

  const totalSubmitted = referrals.length;
  const activeCount = referrals.filter((r) => r.stage === 'active_program').length;
  const keptCount = referrals.filter((r) => r.stage === 'kept_90').length;

  return (
    <div>
      <PartnerHeader 
        title="Supplier Referral Pipeline" 
        subtitle="Submit high-capability B2B suppliers, track qualification stages, and unlock Keep-90 bounties."
        totalReferrals={totalSubmitted}
        earnedBountiesTotalUsd={keptCount * 500}
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {submittedMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{submittedMessage}</span>
          </div>
        )}

        {/* Pipeline Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted Referrals</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{totalSubmitted}</span>
              <span className="text-xs text-slate-400 font-bold">Total</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">All supplier submissions to date</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active in Program</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{activeCount}</span>
              <span className="text-xs text-blue-600 font-bold">In Flight</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Under active Magnus Procura intro delivery</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Day 91 Kept Suppliers</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-600">{keptCount}</span>
              <span className="text-xs text-slate-400 font-bold">Earned (${keptCount * 500})</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Retained past 30-day refund window</p>
          </div>
        </div>

        {/* Confidentiality & Ethics Guardrail */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold">Ecosystem Confidentiality Invariant</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              In accordance with Row Level Security (RLS) policies, you have visibility exclusively into suppliers referred by your organization. 
              Buyer target notes, supplier financial disclosures, and other partner accounts are strictly segregated.
            </p>
          </div>
        </div>

        {/* Referral Intake Form & Pipeline Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Intake Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Submit New Supplier</h3>
            </div>
            <p className="text-xs text-slate-500">
              Introduce high-potential industrial, aerospace, defense, or technical B2B suppliers.
            </p>

            <form onSubmit={handleSubmitReferral} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Precision Micro-Optics Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Primary Executive Contact</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jason Reynolds, CEO"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="jreynolds@micro-optics.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Capability / Industry</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cleanroom Laser Optics, AS9100"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Estimated Annual Revenue</label>
                <select
                  value={estRevenue}
                  onChange={(e) => setEstRevenue(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="<$1M">&lt; $1M (Early Traction)</option>
                  <option value="$1M - $5M">$1M - $5M (Sweet Spot)</option>
                  <option value="$5M - $25M">$5M - $25M (Growth)</option>
                  <option value=">$25M">&gt; $25M (Enterprise Subcontractor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Strategic Readiness Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why are they ready for enterprise procurement? Current certifications, key customers, or delivery capacity..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Supplier Referral</span>
              </button>
            </form>
          </div>

          {/* Referral Pipeline Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Active Referral Ledger</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5">Capability</th>
                    <th className="px-6 py-3.5">Submission Date</th>
                    <th className="px-6 py-3.5">Pipeline Stage</th>
                    <th className="px-6 py-3.5">Keep-90 Bounty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <strong className="font-bold text-slate-900 block">{ref.companyName}</strong>
                        <span className="text-[11px] text-slate-500">{ref.contactName}</span>
                      </td>

                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {ref.category}
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {ref.submittedAt}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center space-x-1 ${
                          ref.stage === 'kept_90' ? 'bg-emerald-100 text-emerald-800' :
                          ref.stage === 'active_program' ? 'bg-blue-100 text-blue-800' :
                          ref.stage === 'fit_reviewed' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {ref.stage.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {ref.bountyStatus === 'earned_bounty' ? (
                          <span className="font-black text-emerald-600 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>$500 Paid</span>
                          </span>
                        ) : ref.bountyStatus === 'pending_day_91' ? (
                          <span className="font-bold text-amber-600 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>$500 on Day 91</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            Pending Conversion
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
