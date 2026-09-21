'use client';

import { useState } from 'react';
import MemberHeader from '@/components/MemberHeader';
import { CreditCard, ExternalLink, ShieldCheck, Check, DollarSign } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function BillingPage() {
  const [buyerName, setBuyerName] = useState('');
  const [poAmount, setPoAmount] = useState('');
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const numAmount = parseFloat(poAmount) || 0;
  const rawFee = numAmount * 0.08;
  const cappedFee = Math.min(rawFee, 8000);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const orgId = '10000000-0000-0000-0000-000000000002';
      const res = await apiFetch('/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        alert('Stripe customer portal session could not be created in mock mode.');
      }
    } catch {
      alert('Could not open billing portal. Please check API server.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleAttestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <MemberHeader 
        title="Membership & Commercial Billing" 
        subtitle="Stripe Invoicing · Success Fee Exhibit · PRD §8 & §10.7"
        attemptsDelivered={2}
        attemptsOwed={8}
        isPaused={false}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Membership Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Active Program
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Year-1 Enterprise Program</h2>
              <p className="text-xs text-slate-500 mt-1">
                8 named introduction attempts · Full packet vault · Quarterly review meetings
              </p>
            </div>

            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{portalLoading ? 'Opening...' : 'Stripe Customer Portal'}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-60" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider">Program Fee</span>
              <p className="text-xl font-bold text-slate-900 mt-1">$4,800.00 / year</p>
              <p className="text-slate-500 mt-0.5">Paid via Stripe Checkout</p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider">Refund Rule (MSA §4)</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">Earned</p>
              <p className="text-slate-500 mt-0.5">30-day window completed or 2 accepted intros delivered</p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider">Success Fee Rate</span>
              <p className="text-xl font-bold text-slate-900 mt-1">8% (Capped at $8,000)</p>
              <p className="text-slate-500 mt-0.5">Only on attested, category-matched POs</p>
            </div>
          </div>
        </div>

        {/* PO Attestation Workflow */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Attest Purchase Order (PO) or Award</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              When an introduction converts into a purchase order or executed SOW, submit your attestation below with redacted verification. Success fees are calculated at 8% capped at $8,000, invoiced on Net 15.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                <Check className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">Attestation Submitted for Verification</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Attestation for {buyerName} (${parseFloat(poAmount).toLocaleString()}) has been queued for operator verification. Success fee: ${cappedFee.toLocaleString()} (Net 15).
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-emerald-800 hover:text-emerald-900 font-bold underline pt-2"
              >
                Submit another attestation
              </button>
            </div>
          ) : (
            <form onSubmit={handleAttestSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Buyer / Enterprise Name
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Boeing Defense"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Purchase Order Value ($ USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      required
                      min="100"
                      value={poAmount}
                      onChange={(e) => setPoAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Matched Category / Scope
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Composite Tooling Machining"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {numAmount > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Calculated Success Fee:</span>
                    <strong className="text-slate-900 ml-2">
                      8% × ${numAmount.toLocaleString()} = ${rawFee.toLocaleString()}
                    </strong>
                    {rawFee > 8000 && (
                      <span className="text-emerald-600 font-bold ml-2">(Capped at $8,000 maximum)</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Invoice Due on Net 15</span>
                    <span className="text-sm font-black text-slate-900">${cappedFee.toLocaleString()} USD</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Redacted PO or SOW Document (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  required
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Files land in private Supabase Storage bucket &apos;evidence&apos;. Strictly accessible by Member Owner and Admin only.
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  I attest that this purchase order was received in our category and resulted from a verified introduction or opportunity.
                </span>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-md transition"
              >
                Submit PO Attestation for Verification →
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
