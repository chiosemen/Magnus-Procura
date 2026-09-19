/**
 * Magnus Procura — Standalone Background Worker
 * 
 * Scheduled runner for background invariant enforcement, SLA clocks, Keep-90 window,
 * partner activation checks, and operator capacity monitoring.
 */

import dotenv from 'dotenv';
import { getSupabaseAdmin } from '../lib/supabase';
import { writeAuditLog } from '../lib/audit';
import { sendSlaWarningEmail, sendQbrDueEmail } from '../lib/resend';

dotenv.config();

console.log('[Magnus Worker] Initializing autonomous background worker daemon...');

let isRunning = true;

async function runSlaTick() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: agedIntros, error: agedError } = await supabase
      .from('intros')
      .update({ result: 'no_response' })
      .eq('result', 'sent')
      .lt('sent_at', tenDaysAgo)
      .select('id');

    if (agedError) throw agedError;

    const { data: slaRows } = await supabase
      .from('programs_sla')
      .select('*')
      .eq('is_paused', false);

    let warningsSent = 0;
    for (const row of slaRows || []) {
      const halfOwed = Math.ceil(row.attempts_owed / 2);
      if (row.attempts_delivered < halfOwed) {
        await sendSlaWarningEmail({
          operatorEmail: 'operator@magnusprocura.com',
          orgName: row.org_name,
          attemptsOwed: row.attempts_owed,
          attemptsDelivered: row.attempts_delivered,
          daysRemaining: 45,
        });
        warningsSent++;
      }
    }

    if ((agedIntros && agedIntros.length > 0) || warningsSent > 0) {
      await writeAuditLog({
        action: 'worker.tick_sla.completed',
        entityType: 'worker',
        meta: { agedCount: agedIntros?.length || 0, warningsSent },
      });
      console.log(`[Magnus Worker] tick-sla executed: ${agedIntros?.length || 0} aged intros, ${warningsSent} warnings.`);
    }
  } catch (err) {
    console.error('[Magnus Worker] Error in tick-sla:', err);
  }
}

async function runKeep90Tick() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const ninetyOneDaysAgo = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: activePrograms } = await supabase
      .from('programs')
      .select('id, org_id')
      .eq('status', 'active')
      .lte('starts_on', ninetyOneDaysAgo);

    let bountiesEnqueued = 0;
    for (const prog of activePrograms || []) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, partner_id')
        .eq('resulting_org_id', prog.org_id)
        .single();

      if (referral) {
        const { data: existingBounty } = await supabase
          .from('bounties')
          .select('id')
          .eq('referral_id', referral.id)
          .maybeSingle();

        if (!existingBounty) {
          await supabase.from('bounties').insert({
            referral_id: referral.id,
            due_on: now.toISOString().split('T')[0],
            amount_cents: 25000,
          });
          bountiesEnqueued++;
        }
      }
    }

    if (bountiesEnqueued > 0) {
      await writeAuditLog({
        action: 'worker.tick_keep90.completed',
        entityType: 'worker',
        meta: { bountiesEnqueued },
      });
      console.log(`[Magnus Worker] tick-keep90 executed: ${bountiesEnqueued} bounties enqueued.`);
    }
  } catch (err) {
    console.error('[Magnus Worker] Error in tick-keep90:', err);
  }
}

async function runQbrTick() {
  const supabase = getSupabaseAdmin();
  const now = new Date();

  try {
    const { data: activePrograms } = await supabase
      .from('programs')
      .select(`
        id,
        org_id,
        starts_on,
        organizations!inner ( id, name )
      `)
      .eq('status', 'active');

    let noticesSent = 0;
    for (const prog of activePrograms || []) {
      const org = Array.isArray(prog.organizations) ? prog.organizations[0] : prog.organizations;
      const startsOn = new Date(prog.starts_on);
      const diffDays = Math.floor((now.getTime() - startsOn.getTime()) / (1000 * 60 * 60 * 24));

      let milestone: 'Day 30' | 'Day 60' | 'Day 90' | null = null;
      if (diffDays >= 30 && diffDays <= 34) milestone = 'Day 30';
      else if (diffDays >= 60 && diffDays <= 64) milestone = 'Day 60';
      else if (diffDays >= 90 && diffDays <= 94) milestone = 'Day 90';

      if (milestone) {
        const { count } = await supabase
          .from('audit_log')
          .select('id', { count: 'exact', head: true })
          .eq('action', 'cadence.qbr_notice_sent')
          .eq('entity_id', prog.id)
          .contains('meta', { milestone });

        if (!count || count === 0) {
          await sendQbrDueEmail({
            operatorEmail: 'operator@magnusprocura.com',
            orgName: org?.name || 'Member Org',
            milestone,
            daysSinceStart: diffDays,
          });
          await writeAuditLog({
            action: 'cadence.qbr_notice_sent',
            entityType: 'program',
            entityId: prog.id,
            meta: { orgId: prog.org_id, orgName: org?.name, milestone, daysSinceStart: diffDays },
          });
          noticesSent++;
        }
      }
    }

    if (noticesSent > 0) {
      console.log(`[Magnus Worker] tick-qbr executed: ${noticesSent} QBR notices dispatched.`);
    }
  } catch (err) {
    console.error('[Magnus Worker] Error in tick-qbr:', err);
  }
}

async function runLoop() {
  console.log('[Magnus Worker] Worker loop started. Polling every 60 seconds.');

  while (isRunning) {
    try {
      await runSlaTick();
      await runKeep90Tick();
      await runQbrTick();
    } catch (err) {
      console.error('[Magnus Worker] Error in worker tick:', err);
    }

    // Wait 60s between ticks unless shutdown requested
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }

  console.log('[Magnus Worker] Worker loop stopped gracefully.');
  process.exit(0);
}

// Signal handling
process.on('SIGTERM', () => {
  console.log('[Magnus Worker] Received SIGTERM. Shutting down gracefully...');
  isRunning = false;
});

process.on('SIGINT', () => {
  console.log('[Magnus Worker] Received SIGINT. Shutting down gracefully...');
  isRunning = false;
});

if (process.env.NODE_ENV !== 'test') {
  runLoop().catch((err) => {
    console.error('[Magnus Worker] Fatal worker error:', err);
    process.exit(1);
  });
}
