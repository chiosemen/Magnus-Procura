'use client';

import { useState } from 'react';
import OperatorHeader from '@/components/OperatorHeader';
import { 
  CheckSquare, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Building2,
  Calendar,
  XCircle,
  ShieldCheck
} from 'lucide-react';

interface AttestationItem {
  id: string;
  orgId: string;
  orgName: string;
  buyer: string;
  poNumber: string;
  amountCents: number;
  submittedAt: string;
  evidencePath: string;
  status: 'submitted' | 'accepted' | 'rejected';
  categoryMatch: boolean;
  notes?: string;
}

const INITIAL_ATTESTATIONS: AttestationItem[] = [
  {
    id: 'att_001',
    orgId: 'org_strata_clean',
    orgName: 'Strata Clean Energy Sensors',
    buyer: 'Siemens Energy North America',
    poNumber: 'PO-2026-98144',
    amountCents: 12000000, // $120,000
    submittedAt: '2026-09-14T10:15:00Z',
    evidencePath: 'evidence/org_strata_clean/PO-2026-98144.pdf',
    status: 'submitted',
    categoryMatch: true,
    notes: 'Subcontract for turbine emission monitoring modules resulting from intro to Siemens desk.',
  },
  {
    id: 'att_002',
    orgId: 'org_apex',
    orgName: 'Apex Industrial Robotics',
    buyer: 'Ford Motor Company',
    poNumber: 'PO-FORD-44102',
    amountCents: 4500000, // $45,000
    submittedAt: '2026-09-15T16:20:00Z',
    evidencePath: 'evidence/org_apex/PO-FORD-44102.pdf',
    status: 'submitted',
    categoryMatch: true,
    notes: 'Initial test fixture tooling cell fabrication.',
  },
  {
    id: 'att_003',
    orgId: 'org_cyber_sec',
    orgName: 'Vanguard Cyber Logistics',
    buyer: 'Lockheed Martin',
    poNumber: 'PO-LM-00912',
    amountCents: 8500000, // $85,000
    submittedAt: '2026-08-20T09:00:00Z',
    evidencePath: 'evidence/org_cyber_sec/PO-LM-00912.pdf',
    status: 'accepted',
    categoryMatch: true,
    notes: 'Secure supply chain audit software licensing.',
  },
];

export default function OperatorAttestationsPage() {
  const [attestations, setAttestations] = useState<AttestationItem[]>(INITIAL_ATTESTATIONS);
  const [feedback, setFeedback] = useState<string | null>(null);

  const calculateFee = (amountCents: number) => {
    // 8% capped strictly at $8,000 (800,000 cents)
    const rawFee = Math.round(amountCents * 0.08);
    return Math.min(rawFee, 800000);
  };

  const handleApprove = (id: string) => {
    setAttestations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'accepted' } : a))
    );
    setFeedback(`Attestation ${id} approved. Net 15 Success Fee invoice generated in Stripe.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleReject = (id: string) => {
    setAttestations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
    );
    setFeedback(`Attestation ${id} flagged for evidence resubmission.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  const pendingCount = attestations.filter((a) => a.status === 'submitted').length;

  return (
    <div>
      <OperatorHeader 
        title="Attestations & Success Fee Review" 
        subtitle="Audit member-submitted purchase orders, verify category match, and authorize 8% (max $8k) success invoices."
        urgentSlaCount={0}
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {feedback && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Pricing Policy Card */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold">Success Fee Formula & Net 15 Policy (Founding Teardown §3)</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Magnus Procura takes <strong>8% of the first purchase order or subcontract value</strong>, 
            with a strict <strong>$8,000 maximum cap</strong>. 
            Once approved by an operator, an invoice tracked as Net 15 is automatically emitted, 
            and the 90-day retention clock starts.
          </p>
        </div>

        {/* Pending Attestations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Submitted Attestations Requiring Audit ({pendingCount})
            </h3>
          </div>

          {attestations.map((att) => {
            const amountUsd = att.amountCents / 100;
            const feeCents = calculateFee(att.amountCents);
            const feeUsd = feeCents / 100;
            const isCapped = feeCents === 800000;

            return (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                      {att.orgName}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      &rarr; {att.buyer}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      PO #{att.poNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">PO Amount</span>
                      <strong className="text-sm font-black text-slate-900">${amountUsd.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">Success Fee</span>
                      <div className="flex items-baseline space-x-1">
                        <strong className="text-sm font-black text-indigo-600">${feeUsd.toLocaleString()}</strong>
                        {isCapped && <span className="text-[10px] text-amber-600 font-bold">(Capped)</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">Terms</span>
                      <strong className="text-slate-900 font-bold">Net 15 Days</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                        att.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        att.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {att.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Auditor Notes:</strong> {att.notes}
                  </p>

                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Preview Uploaded PO Evidence (PDF)</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Submitted: {new Date(att.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Audit Actions */}
                <div className="flex-shrink-0 flex flex-col space-y-2 w-full lg:w-auto">
                  {att.status === 'submitted' ? (
                    <>
                      <button
                        onClick={() => handleApprove(att.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve &amp; Invoice Net 15 (${feeUsd.toLocaleString()})</span>
                      </button>
                      <button
                        onClick={() => handleReject(att.id)}
                        className="bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject / Request Proof</span>
                      </button>
                    </>
                  ) : att.status === 'accepted' ? (
                    <div className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Approved · Net 15 Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Rejected</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
