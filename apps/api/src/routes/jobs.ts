import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabase';
import { sendSlaWarningEmail } from '../lib/resend';
import { writeAuditLog } from '../lib/audit';

const jobs = new Hono();

// Auth Middleware for cron tasks
jobs.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return c.json({ error: 'Unauthorized: Invalid CRON_SECRET' }, 401);
  }
  await next();
});

// 1. tick-sla (Daily 06:00 ET)
jobs.post('/tick-sla', async (c) => {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // A. 10-business-day no_response aging
    const { data: agedIntros, error: agedError } = await supabase
      .from('intros')
      .update({ result: 'no_response' })
      .eq('result', 'sent')
      .lt('sent_at', tenDaysAgo)
      .select('id');

    if (agedError) throw agedError;

    // B. Check for SLA warning on active programs
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
        warningsSent,
        timestamp: now.toISOString(),
      },
    });

    return c.json({
      job: 'tick-sla',
      agedIntrosCount: agedIntros?.length || 0,
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

export default jobs;
