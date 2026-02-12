import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';

import type { ToolContext } from 'agent-core';
import { scoringTriggerTool } from '../src/tools.js';

const logger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

const ctx: ToolContext = {
  correlationId: 'corr-1',
  runId: 'run-1',
  mode: 'live',
  actor: { username: 'supplier', role: 'SUPPLIER' },
  now: () => new Date('2026-02-12T00:00:00.000Z'),
  logger,
  confirmations: new Set(['call-1']),
  approvals: new Set()
};

describe('scoring.trigger idempotency', () => {
  it('returns DUPLICATE_IGNORED for duplicate idempotency keys', async () => {
    const jobs = new Map<string, { id: string; created_at: string }>();

    const db = {
      query: async <T = unknown>(sql: string, params: readonly unknown[] = []): Promise<{ rows: T[] }> => {
        if (sql.includes('INSERT INTO scoring_jobs') && sql.includes('ON CONFLICT')) {
          const idempotencyKey = String(params[2] ?? '');
          if (jobs.has(idempotencyKey)) {
            return { rows: [] as T[] };
          }
          const id = crypto.randomUUID();
          const created_at = new Date('2026-02-12T00:00:00.000Z').toISOString();
          jobs.set(idempotencyKey, { id, created_at });
          return { rows: [{ id, created_at }] as T[] };
        }

        if (sql.includes('SELECT id, created_at') && sql.includes('FROM scoring_jobs') && sql.includes('idempotency_key')) {
          const idempotencyKey = String(params[0] ?? '');
          const row = jobs.get(idempotencyKey);
          return { rows: row ? ([row] as T[]) : ([] as T[]) };
        }

        if (sql.includes('INSERT INTO scoring_audit')) {
          return { rows: [] as T[] };
        }

        throw new Error(`Unexpected SQL in unit test stub: ${sql}`);
      }
    };

    const tool = scoringTriggerTool({
      db,
      access: {
        assertReadAccess: async () => {},
        assertWriteAccess: async () => {}
      }
    });

    const first = await tool.handler(
      ctx,
      { supplierId: 'sup-1', reason: 'profile updated', idempotencyKey: 'idem-1234567890' },
      'idem-1234567890'
    );
    expect(first.status).toBe('ENQUEUED');

    const second = await tool.handler(
      ctx,
      { supplierId: 'sup-1', reason: 'profile updated', idempotencyKey: 'idem-1234567890' },
      'idem-1234567890'
    );
    expect(second.status).toBe('DUPLICATE_IGNORED');
  });
});

