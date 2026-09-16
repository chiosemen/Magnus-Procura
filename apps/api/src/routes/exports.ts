import { Hono } from 'hono';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { getSupabaseAdmin } from '../lib/supabase';
import { writeAuditLog } from '../lib/audit';

const exportsRoute = new Hono();

exportsRoute.post('/org/:id', async (c) => {
  const orgId = c.req.param('id');
  const supabase = getSupabaseAdmin();

  try {
    // 1. Fetch organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, type, created_at')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    // 2. Fetch intros
    const { data: introsList } = await supabase
      .from('intros')
      .select('id, channel, copy, approved_at, sent_at, result, created_at')
      .eq('org_id', orgId);

    // 3. Fetch account targets
    const { data: targetsList } = await supabase
      .from('account_targets')
      .select('id, name, tier, status, why_us, known_desk, created_at')
      .eq('org_id', orgId);

    // 4. Create CSV strings
    let introsCsv = 'id,channel,result,approved_at,sent_at,created_at\n';
    (introsList || []).forEach((i) => {
      introsCsv += `"${i.id}","${i.channel}","${i.result || ''}","${i.approved_at || ''}","${i.sent_at || ''}","${i.created_at}"\n`;
    });

    let targetsCsv = 'id,name,tier,status,why_us,known_desk,created_at\n';
    (targetsList || []).forEach((t) => {
      targetsCsv += `"${t.id}","${t.name.replace(/"/g, '""')}","${t.tier}","${t.status}","${(t.why_us || '').replace(/"/g, '""')}","${(t.known_desk || '').replace(/"/g, '""')}","${t.created_at}"\n`;
    });

    // 5. Build ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    archive.append(introsCsv, { name: 'intros.csv' });
    archive.append(targetsCsv, { name: 'targets.csv' });
    archive.append(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          organization: org,
          introsCount: introsList?.length || 0,
          targetsCount: targetsList?.length || 0,
        },
        null,
        2
      ),
      { name: 'manifest.json' }
    );

    // Finalize archive asynchronously
    void archive.finalize();

    // 6. Record audit log
    await writeAuditLog({
      action: 'export.generated',
      entityType: 'organization',
      entityId: orgId,
      meta: {
        introsCount: introsList?.length || 0,
        targetsCount: targetsList?.length || 0,
      },
    });

    c.header('Content-Type', 'application/zip');
    c.header('Content-Disposition', `attachment; filename="magnus-procura-export-${orgId.slice(0, 8)}.zip"`);

    // In Hono on Node server, response stream can be passed via ReadableStream
    return c.body(passthrough as unknown as ReadableStream);
  } catch (err: unknown) {
    console.error('[Exports] Error generating export:', err);
    const msg = err instanceof Error ? err.message : 'Error generating export';
    return c.json({ error: msg }, 500);
  }
});

export default exportsRoute;
