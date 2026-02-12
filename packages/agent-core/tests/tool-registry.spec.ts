import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { ToolContext, ToolDefinition } from '../src/types/tooling.js';
import { ToolRegistry } from '../src/registry/index.js';

const logger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

const baseCtx = (overrides: Partial<ToolContext> = {}): ToolContext => {
  return {
    correlationId: 'corr-1',
    runId: 'run-1',
    mode: 'live',
    actor: { username: 'supplier', role: 'SUPPLIER' },
    now: () => new Date('2026-02-12T00:00:00.000Z'),
    logger,
    confirmations: new Set(),
    approvals: new Set(),
    ...overrides
  };
};

describe('ToolRegistry', () => {
  it('denies tier 2 tool calls for suppliers without explicit confirmation', async () => {
    const registry = new ToolRegistry();

    const tool: ToolDefinition<{ supplierId: string; idempotencyKey: string }, { ok: true }> = {
      name: 'scoring.trigger',
      description: 'trigger scoring',
      riskTier: 2,
      allowedRoles: ['SUPPLIER', 'ADMIN'],
      idempotency: 'required',
      inputSchemaId: 'tool.scoring.trigger.input',
      outputSchemaId: 'tool.scoring.trigger.output',
      inputSchema: z.object({ supplierId: z.string().min(1), idempotencyKey: z.string().min(10) }).strict(),
      outputSchema: z.object({ ok: z.literal(true) }).strict(),
      handler: async () => ({ ok: true })
    };

    registry.register(tool);

    const outcome = await registry.execute(baseCtx(), {
      id: 'call-1',
      toolName: 'scoring.trigger',
      input: { supplierId: 'sup-1', idempotencyKey: 'idem-1234567890' },
      idempotencyKey: 'idem-1234567890'
    });

    expect(outcome.status).toBe('DENIED');
    expect(outcome.error?.code).toBe('FORBIDDEN');
  });

  it('allows tier 2 tool calls for suppliers with explicit confirmation', async () => {
    const registry = new ToolRegistry();

    const tool: ToolDefinition<{ supplierId: string; idempotencyKey: string }, { ok: true }> = {
      name: 'scoring.trigger',
      description: 'trigger scoring',
      riskTier: 2,
      allowedRoles: ['SUPPLIER', 'ADMIN'],
      idempotency: 'required',
      inputSchemaId: 'tool.scoring.trigger.input',
      outputSchemaId: 'tool.scoring.trigger.output',
      inputSchema: z.object({ supplierId: z.string().min(1), idempotencyKey: z.string().min(10) }).strict(),
      outputSchema: z.object({ ok: z.literal(true) }).strict(),
      handler: async () => ({ ok: true })
    };

    registry.register(tool);

    const ctx = baseCtx({ confirmations: new Set(['call-1']) });

    const outcome = await registry.execute(ctx, {
      id: 'call-1',
      toolName: 'scoring.trigger',
      input: { supplierId: 'sup-1', idempotencyKey: 'idem-1234567890' },
      idempotencyKey: 'idem-1234567890'
    });

    expect(outcome.status).toBe('SUCCESS');
    expect(outcome.output).toEqual({ ok: true });
  });

  it('denies tier 3 tool calls unless admin + dual approvals are present', async () => {
    const registry = new ToolRegistry();

    const tool: ToolDefinition<{ reason: string }, { ok: true }> = {
      name: 'admin.override',
      description: 'override',
      riskTier: 3,
      allowedRoles: ['ADMIN'],
      idempotency: 'none',
      inputSchemaId: 'tool.admin.override.input',
      outputSchemaId: 'tool.admin.override.output',
      inputSchema: z.object({ reason: z.string().min(1) }).strict(),
      outputSchema: z.object({ ok: z.literal(true) }).strict(),
      handler: async () => ({ ok: true })
    };

    registry.register(tool);

    const denied = await registry.execute(
      baseCtx({ actor: { username: 'admin', role: 'ADMIN' }, approvals: new Set(['a1']) }),
      { id: 'call-1', toolName: 'admin.override', input: { reason: 'x' } }
    );
    expect(denied.status).toBe('DENIED');

    const allowed = await registry.execute(
      baseCtx({ actor: { username: 'admin', role: 'ADMIN' }, approvals: new Set(['a1', 'a2']) }),
      { id: 'call-2', toolName: 'admin.override', input: { reason: 'x' } }
    );
    expect(allowed.status).toBe('SUCCESS');
  });

  it('denies tier 2+ tool calls in replay mode (fail-closed)', async () => {
    const registry = new ToolRegistry();

    const tool: ToolDefinition<{ supplierId: string; idempotencyKey: string }, { ok: true }> = {
      name: 'scoring.trigger',
      description: 'trigger scoring',
      riskTier: 2,
      allowedRoles: ['ADMIN'],
      idempotency: 'required',
      inputSchemaId: 'tool.scoring.trigger.input',
      outputSchemaId: 'tool.scoring.trigger.output',
      inputSchema: z.object({ supplierId: z.string().min(1), idempotencyKey: z.string().min(10) }).strict(),
      outputSchema: z.object({ ok: z.literal(true) }).strict(),
      handler: async () => ({ ok: true })
    };

    registry.register(tool);

    const outcome = await registry.execute(
      baseCtx({ mode: 'replay', actor: { username: 'admin', role: 'ADMIN' }, approvals: new Set(['a1', 'a2']) }),
      {
        id: 'call-1',
        toolName: 'scoring.trigger',
        input: { supplierId: 'sup-1', idempotencyKey: 'idem-1234567890' },
        idempotencyKey: 'idem-1234567890'
      }
    );

    expect(outcome.status).toBe('DENIED');
  });

  it('fails closed on invalid tool input schema', async () => {
    const registry = new ToolRegistry();

    const tool: ToolDefinition<{ supplierId: string }, { ok: true }> = {
      name: 'vault.getUploadChecklist',
      description: 'checklist',
      riskTier: 0,
      allowedRoles: ['SUPPLIER'],
      idempotency: 'none',
      inputSchemaId: 'tool.vault.uploadChecklist.input',
      outputSchemaId: 'tool.vault.uploadChecklist.output',
      inputSchema: z.object({ supplierId: z.string().min(1) }).strict(),
      outputSchema: z.object({ ok: z.literal(true) }).strict(),
      handler: async () => ({ ok: true })
    };

    registry.register(tool);

    const outcome = await registry.execute(baseCtx(), {
      id: 'call-1',
      toolName: 'vault.getUploadChecklist',
      // @ts-expect-error
      input: {}
    });

    expect(outcome.status).toBe('FAIL');
    expect(outcome.error?.code).toBe('SCHEMA_VALIDATION_FAILED');
  });
});

