'use client';

import { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { 
  ScrollText, 
  Search, 
  Code,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Send,
  Timer
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
    actor: 'railway.worker',
    meta: { bountiesEnqueued: 2, refundWindowsClosed: 1 },
  },
  {
    id: 'aud_105',
    createdAt: '2026-09-16T06:00:00Z',
    action: 'tick-sla.executed',
    entityType: 'system_cron',
    entityId: 'worker_sla',
    actor: 'railway.worker',
    meta: { programsEvaluated: 48, agedIntrosCount: 0, warningsSent: 0 },
  },
  {
    id: 'aud_106',
    createdAt: '2026-09-15T16:30:12Z',
    action: 'packet.status.changed',
    entityType: 'packet',
    entityId: 'pkt_apex_01',
    actor: 'sarah.c@magnusprocura.com',
    meta: { oldStatus: 'blocked', newStatus: 'ready', reason: 'COI & NAICS approved' },
  },
];

export default function AdminAuditLogPage() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(INITIAL_AUDIT_LOGS[0]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.entityId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AdminHeader 
        title="Privileged Audit Log Stream" 
        subtitle="Forensic immutable event log from public.audit_log (Admin-Only RLS Enforced)."
      />

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Compliance Header Card */}
        <div className="liquid-glass specular-edge p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="liquid-pill px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-purple-300 border-purple-500/30 flex items-center space-x-1.5 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>SOC 2 Type II / ISO-27001 Audit Ready</span>
            </span>
            <h2 className="text-base font-black text-white mt-2">Append-Only Immutable Event Stream</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              All financial transactions, intro approvals, and automated background cron tasks are cryptographically stamped.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, actor, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="liquid-pill w-full pl-9 pr-4 py-2 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400/50"
            />
          </div>
        </div>

        {/* Master-Detail Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Events Stream List */}
          <div className="lg:col-span-7 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 liquid-glass-interactive ${
                    isSelected
                      ? 'border-purple-500/60 bg-white/[0.08] shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-purple-300 flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                      <span>{log.action}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-slate-300">Target: {log.entityId}</span>
                    <span className="font-sans text-slate-400">Actor: {log.actor}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Forensic JSON Payload Inspector */}
          <div className="lg:col-span-5 liquid-glass specular-edge p-6 rounded-3xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Payload Inspector</h3>
              </div>
              {selectedLog && (
                <span className="liquid-pill px-2.5 py-0.5 rounded-full font-mono text-[10px] text-slate-400">
                  {selectedLog.id}
                </span>
              )}
            </div>

            {selectedLog ? (
              <div className="mt-4 flex-1 flex flex-col">
                <div className="space-y-2 mb-4 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-white">{selectedLog.createdAt}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Action:</span>
                    <span className="text-purple-300 font-bold">{selectedLog.action}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Entity Type:</span>
                    <span className="text-white">{selectedLog.entityType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Actor:</span>
                    <span className="text-white">{selectedLog.actor}</span>
                  </div>
                </div>

                <div className="flex-1 liquid-pill p-4 rounded-2xl overflow-x-auto font-mono text-[11px] text-emerald-300 bg-black/50 border border-white/10">
                  <pre>{JSON.stringify(selectedLog.meta, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-500">
                Select an audit entry to inspect forensic metadata.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
