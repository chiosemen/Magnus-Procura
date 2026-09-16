'use client';

import { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { 
  ScrollText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Send, 
  ShieldCheck,
  Code
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  meta: Record<string, unknown>;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_101',
    createdAt: '2026-09-16T11:20:14Z',
    action: 'attestation.accepted',
    entityType: 'attestation',
    entityId: 'att_001',
    actor: 'sarah.c@magnusprocura.com',
    meta: { buyer: 'Siemens Energy', amountCents: 12000000, feeCents: 800000, terms: 'Net 15' },
  },
  {
    id: 'aud_102',
    createdAt: '2026-09-16T10:45:00Z',
    action: 'intro.dispatched',
    entityType: 'intro',
    entityId: 'intro_001',
    actor: 'sarah.c@magnusprocura.com',
    meta: { champion: 'Michael Thornton', target: 'Ford Motor Co', resendMessageId: 're_msg_8841' },
  },
  {
    id: 'aud_103',
    createdAt: '2026-09-16T09:15:32Z',
    action: 'billing.checkout.completed',
    entityType: 'program',
    entityId: 'org_nova_bio',
    actor: 'stripe.webhook',
    meta: { sku: 'year_1', amountCents: 480000, customerId: 'cus_R8102941' },
  },
  {
    id: 'aud_104',
    createdAt: '2026-09-16T06:15:00Z',
    action: 'tick-keep90.executed',
    entityType: 'system_cron',
    entityId: 'worker_keep90',
    actor: 'railway.cron',
    meta: { activeProgramsAudited: 25, bountiesActivated: 1, bountiesReleasedTotalCents: 50000 },
  },
  {
    id: 'aud_105',
    createdAt: '2026-09-16T06:00:00Z',
    action: 'tick-sla.executed',
    entityType: 'system_cron',
    entityId: 'worker_sla',
    actor: 'railway.cron',
    meta: { programsAudited: 25, introsAged: 2, delinquencyAlertsSent: 0 },
  },
  {
    id: 'aud_106',
    createdAt: '2026-09-15T16:30:12Z',
    action: 'resend.email.suppressed',
    entityType: 'people',
    entityId: 'bad-lead@company.com',
    actor: 'resend.webhook',
    meta: { reason: 'email.bounced', doNotContactUntil: '2099-12-31' },
  },
];

export default function AdminAuditLogPage() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter((l) => {
    const matchesFilter = filterAction === 'all' || l.action.startsWith(filterAction);
    const matchesSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entityId.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      <AdminHeader 
        title="Privileged System Audit Trail" 
        subtitle="Append-only immutable record from public.audit_log covering billing, dispatches, crons, and suppressions."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Search & Action Filters */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit actions, entity IDs, or actors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex rounded-xl border border-slate-800 p-1 bg-slate-950 text-xs font-bold w-full md:w-auto overflow-x-auto">
              {['all', 'billing', 'intro', 'attestation', 'tick', 'resend'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterAction(cat)}
                  className={`px-3 py-1.5 rounded-lg transition uppercase text-[10px] tracking-wider ${
                    filterAction === cat ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table & Metadata Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Event Log ({filteredLogs.length} Events)</h3>
              <span className="text-[10px] text-slate-400 font-mono">Immutable append-only</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Entity</th>
                    <th className="px-6 py-3.5">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        selectedLog?.id === log.id ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-950 border border-slate-800 text-purple-300">
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 font-mono text-slate-300">
                        {log.entityType}:{log.entityId}
                      </td>

                      <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                        {log.actor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* JSON Metadata Inspector */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
              <Code className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Payload Inspector</h3>
            </div>

            {selectedLog ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Event ID</span>
                  <p className="font-mono text-white font-bold">{selectedLog.id}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Action &amp; Target</span>
                  <p className="font-mono text-purple-300">{selectedLog.action} &rarr; {selectedLog.entityType}:{selectedLog.entityId}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Exact Timestamp</span>
                  <p className="font-mono text-slate-300">{selectedLog.createdAt}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Metadata (JSONB)</span>
                  <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Select an event row to inspect full JSON payload and audit context.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
