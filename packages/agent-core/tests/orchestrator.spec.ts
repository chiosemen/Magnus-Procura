import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { LlmProvider, PlanToolCallsRequest, ToolCallPlan } from '../src/types/provider.js';
import type { StructuredLogger } from '../src/types/index.js';
import type { ToolContext, ToolDefinition } from '../src/types/tooling.js';
import { AgentOrchestrator } from '../src/orchestrator/index.js';
import { ToolRegistry } from '../src/registry/index.js';

const logger: StructuredLogger = {
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
  confirmations: new Set(),
  approvals: new Set()
};

const makeProvider = (plan: ToolCallPlan | null, shouldThrow = false): LlmProvider => {
  return {
    name: 'test',
    generateText: async () => ({ text: '', raw: null }),
    planToolCalls: async (_ctx: ToolContext, _req: PlanToolCallsRequest) => {
      if (shouldThrow) {
        throw new Error('provider down');
      }
      if (!plan) {
        throw new Error('no plan');
      }
      return plan;
    }
  };
};

describe('AgentOrchestrator', () => {
  it('fails closed when provider errors (no tools executed)', async () => {
    const tools = new ToolRegistry();
    const provider = makeProvider(null, true);
    const orchestrator = new AgentOrchestrator(provider, tools, logger);

    const result = await orchestrator.run(ctx, {
      provider: 'test',
      model: 'x',
      promptId: 'p',
      promptVersion: '1',
      inputSummary: {},
      system: 's',
      user: 'u',
      timeoutMs: 1000
    });

    expect(result.status).toBe('FAILED');
    expect(result.toolOutcomes).toHaveLength(0);
    expect(result.plan).toBeNull();
    expect(result.error?.code).toBe('PROVIDER_ERROR');
  });

  it('marks run FAILED when a tier 2 tool call is denied', async () => {
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

    const provider = makeProvider({
      finalMessage: 'planned',
      toolCalls: [
        {
          id: 'call-1',
          toolName: 'scoring.trigger',
          input: { supplierId: 'sup-1', idempotencyKey: 'idem-1234567890' }
        }
      ]
    });

    const orchestrator = new AgentOrchestrator(provider, registry, logger);

    const result = await orchestrator.run(ctx, {
      provider: 'test',
      model: 'x',
      promptId: 'p',
      promptVersion: '1',
      inputSummary: {},
      system: 's',
      user: 'u',
      timeoutMs: 1000
    });

    expect(result.status).toBe('FAILED');
    expect(result.toolOutcomes).toHaveLength(1);
    expect(result.toolOutcomes[0]?.status).toBe('DENIED');
  });

  it('marks run SUCCESS when all tools succeed', async () => {
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

    const provider = makeProvider({
      finalMessage: 'done',
      toolCalls: [{ id: 'call-1', toolName: 'vault.getUploadChecklist', input: { supplierId: 'sup-1' } }]
    });

    const orchestrator = new AgentOrchestrator(provider, registry, logger);

    const result = await orchestrator.run(ctx, {
      provider: 'test',
      model: 'x',
      promptId: 'p',
      promptVersion: '1',
      inputSummary: {},
      system: 's',
      user: 'u',
      timeoutMs: 1000
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.finalMessage).toBe('done');
    expect(result.toolOutcomes).toHaveLength(1);
    expect(result.toolOutcomes[0]?.status).toBe('SUCCESS');
  });
});

