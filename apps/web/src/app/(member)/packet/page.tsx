'use client';

import { useState } from 'react';
import MemberHeader from '@/components/MemberHeader';
import { 
  CheckCircle2, 
  Download, 
  FileText, 
  ExternalLink,
  Shield,
  Info
} from 'lucide-react';

interface ArtifactItem {
  id: string;
  kind: string;
  label: string;
  bar: string;
  status: 'have' | 'gap' | 'waived';
  fileName?: string;
  lastUpdated?: string;
}

export default function PacketVaultPage() {
  const [artifacts] = useState<ArtifactItem[]>([
    {
      id: '1',
      kind: 'offer_one_liner',
      label: 'Offer One-Liner',
      bar: 'One sentence a category manager can repeat without a deck.',
      status: 'have',
      fileName: 'apex_offer_statement.txt',
      lastUpdated: 'Sep 2, 2026',
    },
    {
      id: '2',
      kind: 'capability_statement',
      label: 'Capability Statement (2 Pages Max)',
      bar: 'Who you are, what you sell, where, and verified metrics.',
      status: 'have',
      fileName: 'Apex_Capability_Statement_2026.pdf',
      lastUpdated: 'Sep 3, 2026',
    },
    {
      id: '3',
      kind: 'naics_list',
      label: 'Category & NAICS List',
      bar: 'The exact codes corporate buyers search in Ariba/Coupa (e.g. 541512, 332710).',
      status: 'have',
      fileName: 'naics_unspsc_codes.pdf',
      lastUpdated: 'Sep 3, 2026',
    },
    {
      id: '4',
      kind: 'coi',
      label: 'Certificate of Insurance (COI)',
      bar: 'Active certificate ($2M+ GL, Cyber / Auto / WC as category requires).',
      status: 'have',
      fileName: 'Apex_COI_Travelers_2026_2027.pdf',
      lastUpdated: 'Sep 4, 2026',
    },
    {
      id: '5',
      kind: 'financials',
      label: 'Financials Status (3-Year Summary)',
      bar: 'Have / decline-to-share / gap. Decline is allowed; surprise is not.',
      status: 'have',
      fileName: '3yr_revenue_summary_redacted.pdf',
      lastUpdated: 'Sep 4, 2026',
    },
    {
      id: '6',
      kind: 'past_performance',
      label: 'Past Performance Briefs (× 2–3)',
      bar: 'Customer name, scope, result. No adjectives without a verifiable fact.',
      status: 'have',
      fileName: 'Past_Performance_Case_Studies.pdf',
      lastUpdated: 'Sep 5, 2026',
    },
    {
      id: '7',
      kind: 'portal_list',
      label: 'Enterprise Portal Registrations',
      bar: 'SAM.gov, SAP Ariba, Coupa, Jaggaer — active vendor IDs.',
      status: 'have',
      fileName: 'portal_registrations.json',
      lastUpdated: 'Sep 5, 2026',
    },
    {
      id: '8',
      kind: 'logo',
      label: 'High-Res Brand Mark',
      bar: 'Vector / high-res asset for packet header only.',
      status: 'have',
      fileName: 'apex_logo_vector.svg',
      lastUpdated: 'Sep 2, 2026',
    },
  ]);

  const [downloading, setDownloading] = useState(false);

  const handleExportZip = async () => {
    setDownloading(true);
    try {
      // Direct call to privileged Railway API zip export endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
      const orgId = '10000000-0000-0000-0000-000000000002';
      const res = await fetch(`${apiUrl}/exports/org/${orgId}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Export generation failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magnus-procura-packet-${orgId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export error:', err);
      alert('Could not generate export. Please verify backend API is reachable.');
    } finally {
      setDownloading(false);
    }
  };

  const isAllReady = artifacts.every(a => a.status === 'have' || a.status === 'waived');

  return (
    <>
      <MemberHeader 
        title="Packet Vault & The File" 
        subtitle="Buyer-Native Risk Artifacts · Governed by Kickoff Checklist Section D"
        attemptsDelivered={2}
        attemptsOwed={8}
        isPaused={!isAllReady}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Status Callout */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Status: Ready
                </span>
                <span className="text-xs text-slate-500 font-medium">Sprint Clock Active</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Risk Packet Cleared for Corporate Procurement Desks
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                All 8 required buyer-native artifacts are verified. Signed URLs (24h TTL) will be minted automatically when your operator dispatches approved intros.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportZip}
            disabled={downloading}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Building ZIP...' : 'One-Click Packet ZIP'}</span>
          </button>
        </div>

        {/* Operating Rules Note */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>PRD Principle:</strong> Buyer-native artifacts only. If a procurement portal does not ask for it, we do not require or charge extra for it. No proprietary badges or vanity credentials.
          </span>
        </div>

        {/* Artifact Checklist Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Required Artifact Checklist</h3>
            <span className="text-xs text-slate-500 font-semibold">8 of 8 Completed</span>
          </div>

          <div className="divide-y divide-slate-100">
            {artifacts.map((a) => (
              <div key={a.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{a.label}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{a.bar}</p>
                    {a.fileName && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md flex items-center">
                          {a.fileName}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </span>
                        <span className="text-[11px] text-slate-400">Verified {a.lastUpdated}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>HAVE</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
