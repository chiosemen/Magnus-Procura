import { Hono } from 'hono';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '../lib/supabase';
import { 
  sendSlaWarningEmail, 
  sendQbrDueEmail, 
  sendCopyApprovalReminderEmail 
} from '../lib/resend';
import { writeAuditLog } from '../lib/audit';

const jobs = new Hono();

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Auth Middleware for cron tasks: Fail-Closed & Constant-Time Verification
jobs.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'test') {
    if (!expectedSecret || (authHeader && authHeader === `Bearer ${expectedSecret}`)) {
      return next();
    }
  }

  if (!expectedSecret) {
    console.error('[Jobs] CRON_SECRET is not configured in environment. Rejecting cron request.');
    return c.json({ error: 'Unauthorized: Cron service unconfigured' }, 401);
  }

  const expectedHeader = `Bearer ${expectedSecret}`;
  if (!authHeader || !timingSafeEqualStr(authHeader, expectedHeader)) {
    return c.json({ error: 'Unauthorized: Invalid CRON_SECRET' }, 401);
  }

  await next();
});

// 1. tick-sla (Daily 06:00 ET)
jobs.post('/tick-sla', async (c) => {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // A. 10-business-day no_response aging
    const { data: agedIntros, error: agedError } = await supabase
      .from('intros')
      .update({ result: 'no_response' })
      .eq('result', 'sent')
      .lt('sent_at', tenDaysAgo)
      .select('id');

    if (agedError) throw agedError;

    // B. Client copy turnaround reminders (3 business days pending)
    const { data: pendingIntros } = await supabase
      .from('intros')
      .select(`
        id,
        org_id,
        created_at,
        account_targets!inner ( name ),
        people!inner ( name ),
        organizations!inner ( name )
      `)
      .not('copy', 'is', null)
      .is('approved_at', null)
      .is('sent_at', null)
      .lt('created_at', threeDaysAgo);

    let copyRemindersSent = 0;
    for (const intro of pendingIntros || []) {
      const org = Array.isArray(intro.organizations) ? intro.organizations[0] : intro.organizations;
      const target = Array.isArray(intro.account_targets) ? intro.account_targets[0] : intro.account_targets;
      const person = Array.isArray(intro.people) ? intro.people[0] : intro.people;

      const daysPending = Math.floor((now.getTime() - new Date(intro.created_at).getTime()) / (1000 * 60 * 60 * 24));

      // Get owner email
      const { data: ownerMember } = await supabase
        .from('org_members')
        .select('profiles!inner(email)')
        .eq('org_id', intro.org_id)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle();

      const memberProfile = ownerMember && (Array.isArray(ownerMember.profiles) ? ownerMember.profiles[0] : ownerMember.profiles);
      const memberEmail = memberProfile?.email || 'member@magnusprocura.com';

      await sendCopyApprovalReminderEmail({
        memberEmail,
        orgName: org?.name || 'Member Organization',
        championName: person?.name || 'Champion',
        targetAccount: target?.name || 'Target Account',
        daysPending,
      });

      await writeAuditLog({
        action: 'intro.copy_reminder_sent',
        entityType: 'intro',
        entityId: intro.id,
        meta: {
          orgId: intro.org_id,
          memberEmail,
          daysPending,
        },
      });
      copyRemindersSent++;
    }

    // C. 14-day silence SLA pause (3 pings / 14 days -> pause SLA by marking org 'unresponsive')
    const { data: unapprovedOldIntros } = await supabase
      .from('intros')
      .select('org_id')
      .not('copy', 'is', null)
      .is('approved_at', null)
      .lt('created_at', fourteenDaysAgo);

    const unresponsiveOrgIds = new Set<string>();
    for (const item of unapprovedOldIntros || []) {
      unresponsiveOrgIds.add(item.org_id);
    }

    let pausedOrgsCount = 0;
    for (const orgId of unresponsiveOrgIds) {
      const { data: updatedOrg } = await supabase
        .from('organizations')
        .update({ status: 'unresponsive' })
        .eq('id', orgId)
        .eq('status', 'active')
        .select('id, name')
        .maybeSingle();

      if (updatedOrg) {
        pausedOrgsCount++;
        await writeAuditLog({
          action: 'organization.status_unresponsive_paused',
          entityType: 'organization',
          entityId: orgId,
          meta: {
            reason: '14 days silence on copy approval / packet',
            previousStatus: 'active',
            newStatus: 'unresponsive',
          },
        });
      }
    }

    // D. Check for SLA warning on active programs
    const { data: slaRows } = await supabase
      .from('programs_sla')
      .select('*')
      .eq('is_paused', false);

    let warningsSent = 0;
    for (const row of slaRows || []) {
      const halfOwed = Math.ceil(row.attempts_owed / 2);
      if (row.attempts_delivered < halfOwed) {
        // Send alert email to operator if email configured
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

    await writeAuditLog({
      action: 'job.tick_sla.completed',
      entityType: 'job',
      meta: {
        agedCount: agedIntros?.length || 0,
        copyRemindersSent,
        pausedOrgsCount,
        warningsSent,
        timestamp: now.toISOString(),
      },
    });

    return c.json({
      job: 'tick-sla',
      agedIntrosCount: agedIntros?.length || 0,
      copyRemindersSent,
      pausedOrgsCount,
      warningsSent,
      timestamp: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Jobs] tick-sla error:', err);
    const msg = err instanceof Error ? err.message : 'tick-sla failed';
    return c.json({ error: msg }, 500);
  }
});

// 2. tick-keep90 (Daily 06:15 ET)
jobs.post('/tick-keep90', async (c) => {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const ninetyOneDaysAgo = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // A. Day 91 keep check: flip bounties to due_on = today for qualifying referrals
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
        // Check if bounty already exists
        const { data: existingBounty } = await supabase
          .from('bounties')
          .select('id')
          .eq('referral_id', referral.id)
          .maybeSingle();

        if (!existingBounty) {
          await supabase.from('bounties').insert({
            referral_id: referral.id,
            due_on: now.toISOString().split('T')[0],
            amount_cents: 25000, // $250 standard bounty
          });
          bountiesEnqueued++;
        }
      }
    }

    // B. Flip refund window to now() (earned) if 2 or more accepted intros
    const { data: programsToCheck } = await supabase
      .from('programs')
      .select('id, org_id, refund_until')
      .eq('status', 'active')
      .gt('refund_until', now.toISOString());

    let refundWindowsClosed = 0;
    for (const p of programsToCheck || []) {
      const { count } = await supabase
        .from('intros')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', p.org_id)
        .in('result', ['accepted', 'met']);

      if (count && count >= 2) {
        await supabase
          .from('programs')
          .update({ refund_until: now.toISOString() })
          .eq('id', p.id);
        refundWindowsClosed++;
      }
    }

    await writeAuditLog({
      action: 'job.tick_keep90.completed',
      entityType: 'job',
      meta: { bountiesEnqueued, refundWindowsClosed },
    });

    return c.json({
      job: 'tick-keep90',
      bountiesEnqueued,
      refundWindowsClosed,
      timestamp: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Jobs] tick-keep90 error:', err);
    const msg = err instanceof Error ? err.message : 'tick-keep90 failed';
    return c.json({ error: msg }, 500);
  }
});

// 3. tick-partners (Monday 07:00 ET)
jobs.post('/tick-partners', async (c) => {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: partnersList } = await supabase
      .from('partners')
      .select('id')
      .eq('status', 'active');

    let pausedCount = 0;
    for (const partner of partnersList || []) {
      const { count } = await supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partner.id)
        .gte('created_at', ninetyDaysAgo);

      if (count === 0) {
        await supabase
          .from('partners')
          .update({ status: 'paused' })
          .eq('id', partner.id);
        pausedCount++;
      }
    }

    await writeAuditLog({
      action: 'job.tick_partners.completed',
      entityType: 'job',
      meta: { pausedCount },
    });

    return c.json({
      job: 'tick-partners',
      partnersEvaluated: partnersList?.length || 0,
      partnersPaused: pausedCount,
      timestamp: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Jobs] tick-partners error:', err);
    const msg = err instanceof Error ? err.message : 'tick-partners failed';
    return c.json({ error: msg }, 500);
  }
});

// 4. tick-hours (Weekly Monday 08:00 ET)
jobs.post('/tick-hours', async (c) => {
  const supabase = getSupabaseAdmin();
  const now = new Date();

  try {
    // Query total logged minutes per member org
    const { data: hourRollups } = await supabase
      .from('unit_econ_run')
      .select('org_id, org_name, operator_minutes_logged');

    let alertsIssued = 0;
    for (const row of hourRollups || []) {
      // 80% of 15h (900 min) = 720 minutes
      if (row.operator_minutes_logged > 720) {
        alertsIssued++;
      }
    }

    await writeAuditLog({
      action: 'job.tick_hours.completed',
      entityType: 'job',
      meta: { alertsIssued },
    });

    return c.json({
      job: 'tick-hours',
      orgsEvaluated: hourRollups?.length || 0,
      alertsIssued,
      timestamp: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Jobs] tick-hours error:', err);
    const msg = err instanceof Error ? err.message : 'tick-hours failed';
    return c.json({ error: msg }, 500);
  }
});

// 5. tick-qbr (Daily 06:30 ET)
jobs.post('/tick-qbr', async (c) => {
  const supabase = getSupabaseAdmin();
  const now = new Date();

  try {
    // A. Query all active programs
    const { data: activePrograms, error: progError } = await supabase
      .from('programs')
      .select(`
        id,
        org_id,
        starts_on,
        sku,
        organizations!inner (
          id,
          name,
          status
        )
      `)
      .eq('status', 'active');

    if (progError) throw progError;

    let noticesSent = 0;
    const dispatchedMilestones: Array<{ programId: string; orgName: string; milestone: string; daysSinceStart: number }> = [];

    for (const prog of activePrograms || []) {
      const org = Array.isArray(prog.organizations) ? prog.organizations[0] : prog.organizations;
      const startsOn = new Date(prog.starts_on);
      const diffDays = Math.floor((now.getTime() - startsOn.getTime()) / (1000 * 60 * 60 * 24));

      // Determine milestone
      let milestone: 'Day 30' | 'Day 60' | 'Day 90' | null = null;
      if (diffDays >= 30 && diffDays <= 34) {
        milestone = 'Day 30';
      } else if (diffDays >= 60 && diffDays <= 64) {
        milestone = 'Day 60';
      } else if (diffDays >= 90 && diffDays <= 94) {
        milestone = 'Day 90';
      }

      if (milestone) {
        // Prevent duplicate notices for this milestone
        const { count } = await supabase
          .from('audit_log')
          .select('id', { count: 'exact', head: true })
          .eq('action', 'cadence.qbr_notice_sent')
          .eq('entity_id', prog.id)
          .contains('meta', { milestone });

        if (!count || count === 0) {
          // Look up assigned operator or fallback
          const { data: assignment } = await supabase
            .from('operator_assignments')
            .select(`
              profiles!inner (
                email
              )
            `)
            .eq('org_id', prog.org_id)
            .eq('active', true)
            .limit(1)
            .maybeSingle();

          const profile = assignment && (Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles);
          const operatorEmail = profile?.email || 'operator@magnusprocura.com';

          await sendQbrDueEmail({
            operatorEmail,
            orgName: org?.name || 'Unknown Member',
            milestone,
            daysSinceStart: diffDays,
          });

          await writeAuditLog({
            action: 'cadence.qbr_notice_sent',
            entityType: 'program',
            entityId: prog.id,
            meta: {
              orgId: prog.org_id,
              orgName: org?.name,
              milestone,
              daysSinceStart: diffDays,
              operatorEmail,
            },
          });

          noticesSent++;
          dispatchedMilestones.push({
            programId: prog.id,
            orgName: org?.name || 'Unknown',
            milestone,
            daysSinceStart: diffDays,
          });
        }
      }
    }

    await writeAuditLog({
      action: 'job.tick_qbr.completed',
      entityType: 'job',
      meta: {
        programsEvaluated: activePrograms?.length || 0,
        noticesSent,
        dispatchedMilestones,
        timestamp: now.toISOString(),
      },
    });

    return c.json({
      job: 'tick-qbr',
      programsEvaluated: activePrograms?.length || 0,
      noticesSent,
      dispatchedMilestones,
      timestamp: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Jobs] tick-qbr error:', err);
    const msg = err instanceof Error ? err.message : 'tick-qbr failed';
    return c.json({ error: msg }, 500);
  }
});

export default jobs;
