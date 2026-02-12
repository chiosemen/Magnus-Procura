import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { AgentOrchestrator, ProviderRegistry } from 'agent-core';
import { InMemoryTranscriptWriter } from 'agent-core';
import type { JsonObject, JsonValue, ToolContext } from 'agent-core';
import { createAnthropicProvider } from 'agent-provider-anthropic';
import { createGeminiProvider } from 'agent-provider-gemini';
import { createOpenAiProvider } from 'agent-provider-openai';
import { redact } from 'agent-policies';

import { env } from '../config/env.js';
import { BadRequestError, HttpError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { buildAgentToolRegistry } from '../agent/tool-registry.js';
import { completeAgentRun, createAgentRun, recordToolCall } from '../agent/persistence.js';
import { db } from '../lib/db.js';

export const agentRoutes = Router();

const runSchema = z
  .object({
    provider: z.enum(['openai', 'gemini', 'anthropic']),
    model: z.string().min(1),
    promptId: z.string().min(1),
    promptVersion: z.string().min(1),
    input: z.record(z.unknown()),
    confirmations: z.array(z.string().min(1)).default([]),
    approvals: z.array(z.string().min(1)).default([]),
    timeoutMs: z.number().int().min(1000).max(60_000).default(env.AGENT_MAX_RUNTIME_MS)
  })
  .strict();

const buildProviderRegistry = (): ProviderRegistry => {
  const providers = new ProviderRegistry();
  providers.register(createGeminiProvider({ apiKey: env.GEMINI_API_KEY }));
  if (typeof env.OPENAI_API_KEY === 'string' && env.OPENAI_API_KEY.length >= 10) {
    providers.register(createOpenAiProvider({ apiKey: env.OPENAI_API_KEY }));
  }
  if (typeof env.ANTHROPIC_API_KEY === 'string' && env.ANTHROPIC_API_KEY.length >= 10) {
    providers.register(createAnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY }));
  }
  return providers;
};

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)])
);
const jsonObjectSchema: z.ZodType<JsonObject> = z.record(jsonValueSchema);

const asJsonObject = (value: unknown): JsonObject => {
  const parsed = jsonObjectSchema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestError('Expected JSON object');
  }
  return parsed.data;
};

agentRoutes.post('/run', requireAuth, async (req, res, next) => {
  try {
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError('Invalid agent run request');
    }

    const correlationId = req.id != null ? String(req.id) : crypto.randomUUID();
    const runId = crypto.randomUUID();

    const actorRole = req.auth!.role;
    const userId = req.auth!.username;

    const perMinute = await db.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c
         FROM agent_runs
        WHERE user_id = $1
          AND created_at > NOW() - INTERVAL '1 minute'`,
      [userId]
    );
    if ((perMinute.rows[0]?.c ?? 0) >= env.AGENT_MAX_RUNS_PER_MINUTE) {
      throw new HttpError(429, 'RATE_LIMITED', 'Agent rate limit exceeded (per-minute)');
    }

    const perDay = await db.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c
         FROM agent_runs
        WHERE user_id = $1
          AND created_at > NOW() - INTERVAL '1 day'`,
      [userId]
    );
    if ((perDay.rows[0]?.c ?? 0) >= env.AGENT_MAX_RUNS_PER_DAY) {
      throw new HttpError(429, 'RATE_LIMITED', 'Agent rate limit exceeded (per-day)');
    }

    const inputSummary = asJsonObject(redact(parsed.data.input));

    await createAgentRun({
      runId,
      userId,
      actorRole,
      provider: parsed.data.provider,
      model: parsed.data.model,
      promptId: parsed.data.promptId,
      promptVersion: parsed.data.promptVersion,
      inputSummary,
      correlationId
    });

    const providers = buildProviderRegistry();

    let provider;
    try {
      provider = providers.require(parsed.data.provider);
    } catch {
      throw new HttpError(503, 'PROVIDER_NOT_CONFIGURED', `Provider is not configured: ${parsed.data.provider}`);
    }
    const tools = buildAgentToolRegistry();
    const transcript = new InMemoryTranscriptWriter();

    const ctx: ToolContext = {
      correlationId,
      runId,
      mode: 'live',
      actor: { username: userId, role: actorRole },
      now: () => new Date(),
      logger,
      confirmations: new Set(parsed.data.confirmations),
      approvals: new Set(parsed.data.approvals)
    };

    const orchestrator = new AgentOrchestrator(provider, tools, logger, transcript);

    const system = [
      'Magnus Procura Agent Layer.',
      'Agents may propose. Deterministic services dispose.',
      'You may call tools only when needed and only from the provided tool list.'
    ].join('\n');

    const user = JSON.stringify({ input: inputSummary });

    const result = await orchestrator.run(ctx, {
      provider: parsed.data.provider,
      model: parsed.data.model,
      promptId: parsed.data.promptId,
      promptVersion: parsed.data.promptVersion,
      inputSummary,
      system,
      user,
      timeoutMs: parsed.data.timeoutMs
    });

    for (const outcome of result.toolOutcomes) {
      const inputPayload = (() => {
        const planned = result.plan?.toolCalls.find((c) => c.id === outcome.id);
        const planInput = planned?.input;
        if (planInput && typeof planInput === 'object' && !Array.isArray(planInput)) {
          return asJsonObject(redact(planInput));
        }
        return {} as JsonObject;
      })();

      await recordToolCall({
        runId,
        outcome,
        inputPayload
      });
    }

    await completeAgentRun({
      runId,
      status: result.status,
      finalOutput: asJsonObject(
        redact({ finalMessage: result.finalMessage, toolOutcomes: result.toolOutcomes, transcript: transcript.snapshot() })
      )
    });

    res.status(result.status === 'SUCCESS' ? 200 : 502).json({
      runId,
      correlationId,
      status: result.status,
      finalMessage: result.finalMessage,
      toolOutcomes: result.toolOutcomes
    });
  } catch (error) {
    next(error);
  }
});

const replayParamsSchema = z
  .object({
    runId: z.string().uuid()
  })
  .strict();

agentRoutes.post('/runs/:runId/replay', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const parsedParams = replayParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      throw new BadRequestError('Invalid replay request');
    }

    const originalRunId = parsedParams.data.runId;

    const original = await db.query<{
      id: string;
      user_id: string;
      actor_role: string;
      provider: string;
      model: string;
      prompt_id: string;
      prompt_version: string;
      input_summary: unknown;
    }>(
      `SELECT id, user_id, actor_role, provider, model, prompt_id, prompt_version, input_summary
         FROM agent_runs
        WHERE id = $1::uuid
        LIMIT 1`,
      [originalRunId]
    );

    const originalRow = original.rows[0];
    if (!originalRow) {
      throw new HttpError(404, 'NOT_FOUND', 'Agent run not found');
    }

    const originalInput = asJsonObject(originalRow.input_summary);

    const toolCalls = await db.query<{
      tool_name: string;
      input_payload: unknown;
    }>(
      `SELECT tool_name, input_payload
         FROM agent_tool_calls
        WHERE run_id = $1::uuid
        ORDER BY created_at ASC`,
      [originalRunId]
    );

    const correlationId = req.id != null ? String(req.id) : crypto.randomUUID();
    const runId = crypto.randomUUID();

    await createAgentRun({
      runId,
      userId: req.auth!.username,
      actorRole: req.auth!.role,
      provider: originalRow.provider,
      model: originalRow.model,
      promptId: originalRow.prompt_id,
      promptVersion: originalRow.prompt_version,
      inputSummary: { ...originalInput, replayOf: originalRunId },
      correlationId
    });

    const tools = buildAgentToolRegistry();

    const ctx: ToolContext = {
      correlationId,
      runId,
      mode: 'replay',
      actor: { username: req.auth!.username, role: req.auth!.role },
      now: () => new Date(),
      logger,
      confirmations: new Set(),
      approvals: new Set()
    };

    const outcomes = [];
    for (const row of toolCalls.rows) {
      const input = asJsonObject(row.input_payload);
      const toolCallId = crypto.randomUUID();
      const outcome = await tools.execute(ctx, {
        id: toolCallId,
        toolName: row.tool_name,
        input
      });
      outcomes.push(outcome);
      await recordToolCall({
        runId,
        outcome,
        inputPayload: asJsonObject(redact(input))
      });
    }

    const deniedTier2Or3 = outcomes.some((o) => o.status === 'DENIED' && o.riskTier >= 2);
    const anyFailed = outcomes.some((o) => o.status === 'FAIL');
    const status = deniedTier2Or3 || anyFailed ? 'FAILED' : 'SUCCESS';

    await completeAgentRun({
      runId,
      status,
      finalOutput: asJsonObject(
        redact({
          replayOf: originalRunId,
          toolOutcomes: outcomes
        })
      )
    });

    res.status(200).json({
      runId,
      correlationId,
      status,
      replayOf: originalRunId,
      toolOutcomes: outcomes
    });
  } catch (error) {
    next(error);
  }
});
