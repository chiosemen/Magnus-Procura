import { getSupabaseAdmin } from './supabase';

export interface AuditLogEntry {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}

export const writeAuditLog = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('audit_log').insert({
      actor_id: entry.actorId || null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      meta: entry.meta || null,
    });

    if (error) {
      console.error('[Audit] Failed to write audit log:', error);
    }
  } catch (err) {
    console.error('[Audit] Unexpected error writing audit log:', err);
  }
};
