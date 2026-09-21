import { z } from 'zod';
import { AgentError, type AgentContext, type JsonObject, type JsonValue, type ToolDefinition, type ToolContext } from 'agent-core';

export interface SupplierAccess {
  assertReadAccess: (ctx: AgentContext, supplierId: string) => Promise<void>;
  assertWriteAccess: (ctx: AgentContext, supplierId: string) => Promise<void>;
}

export interface ScoringToolDeps {
  db: {
    query: <T = unknown>(sql: string, params?: readonly unknown[]) => Promise<{ rows: T[] }>;
  };
  access: SupplierAccess;
}

const storedRuleHitSchema = z.object({
  ruleId: z.string().min(1),
  description: z.string().min(1),
  delta: z.number()
});

const storedExplainabilityRowSchema = z.object({
  score_id: z.union([z.string().min(1), z.number().int().nonnegative()]),
  score: z.number(),
  generated_at: z.string().min(1),
  rule_hits: z.unknown(),
  feature_values: z.unknown(),
  ml_confidence: z.union([z.number().min(0).max(1), z.null()])
});

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)])
);

const jsonObjectSchema: z.ZodType<JsonObject> = z.record(jsonValueSchema);

export const scoringReadExplainabilityTool = (deps: ScoringToolDeps): ToolDefinition<
  { supplierId: string },
  {
    supplierId: string;
    score: number;
    generatedAt: string;
    explanations: {
      ruleHits: Array<{ ruleId: string; status: 'PASS' | 'FAIL' | 'WARN'; reasons: string[] }>;
      featureValues: JsonObject;
      mlConfidence: number | null;
    };
  }
> => {
  const inputSchemaId = 'tool.scoring.readExplainability.input';
  const outputSchemaId = 'tool.scoring.readExplainability.output';

  const inputSchema = z
    .object({
      supplierId: z.string().min(1)
    })
    .strict();

  const outputSchema = z
    .object({
      supplierId: z.string().min(1),
      score: z.number().min(0).max(100),
      generatedAt: z.string().datetime(),
      explanations: z
        .object({
          ruleHits: z.array(
            z
              .object({
                ruleId: z.string().min(1),
                status: z.enum(['PASS', 'FAIL', 'WARN']),
                reasons: z.array(z.string().min(1))
              })
              .strict()
          ),
          featureValues: jsonObjectSchema,
          mlConfidence: z.union([z.number().min(0).max(1), z.null()])
        })
        .strict()
    })
    .strict();

  return {
    name: 'scoring.readExplainability',
    description: 'Read-only deterministic scoring explainability artifacts for a supplier.',
    riskTier: 0,
    allowedRoles: ['SUPPLIER', 'BUYER', 'ADMIN'],
    idempotency: 'none',
    inputSchemaId,
    outputSchemaId,
    inputSchema,
    outputSchema,
    handler: async (ctx: ToolContext, input) => {
      await deps.access.assertReadAccess(ctx, input.supplierId);

      const row = await deps.db.query(
        `SELECT s.id AS score_id,
                s.score AS score,
                e.timestamp AS generated_at,
                e.rule_hits AS rule_hits,
                e.feature_values AS feature_values,
                e.ml_confidence AS ml_confidence
           FROM scoring_scores s
           JOIN scoring_explanations e ON e.score_id = s.id
          WHERE s.entity_id = $1
          ORDER BY s.created_at DESC
          LIMIT 1`,
        [input.supplierId]
      );

      const candidate = row.rows[0];
      if (!candidate) {
        throw new AgentError('NOT_FOUND', `No scoring explanation found for supplierId=${input.supplierId}`);
      }

      const parsedRow = storedExplainabilityRowSchema.safeParse(candidate);
      if (!parsedRow.success) {
        const issues = parsedRow.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new AgentError('INVALID_DB_PAYLOAD', `Explainability payload invalid: ${issues}`);
      }

      const parsedHits = z.array(storedRuleHitSchema).safeParse(parsedRow.data.rule_hits);
      if (!parsedHits.success) {
        const issues = parsedHits.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new AgentError('INVALID_DB_PAYLOAD', `rule_hits invalid: ${issues}`);
      }

      const featureValuesParsed = jsonObjectSchema.safeParse(parsedRow.data.feature_values);
      if (!featureValuesParsed.success) {
        const issues = featureValuesParsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new AgentError('INVALID_DB_PAYLOAD', `feature_values invalid: ${issues}`);
      }

      const ruleHits = parsedHits.data.map((hit) => {
        const status: 'PASS' | 'FAIL' | 'WARN' = hit.delta > 0 ? 'PASS' : hit.delta < 0 ? 'FAIL' : 'WARN';
        return { ruleId: hit.ruleId, status, reasons: [hit.description] };
      });

      return {
        supplierId: input.supplierId,
        score: parsedRow.data.score,
        generatedAt: parsedRow.data.generated_at,
        explanations: {
          ruleHits,
          featureValues: featureValuesParsed.data,
          mlConfidence: parsedRow.data.ml_confidence
        }
      };
    }
  };
};

export const scoringTriggerTool = (deps: ScoringToolDeps): ToolDefinition<
  { supplierId: string; reason: string; idempotencyKey: string },
  { jobId: string; supplierId: string; status: 'ENQUEUED' | 'DUPLICATE_IGNORED'; enqueuedAt: string }
> => {
  const inputSchemaId = 'tool.scoring.trigger.input';
  const outputSchemaId = 'tool.scoring.trigger.output';

  const inputSchema = z
    .object({
      supplierId: z.string().min(1),
      reason: z.string().min(1).max(300),
      idempotencyKey: z.string().min(10).max(200)
    })
    .strict();

  const outputSchema = z
    .object({
      jobId: z.string().min(1),
      supplierId: z.string().min(1),
      status: z.enum(['ENQUEUED', 'DUPLICATE_IGNORED']),
      enqueuedAt: z.string().datetime()
    })
    .strict();

  return {
    name: 'scoring.trigger',
    description: 'Enqueue an event-driven scoring job for a supplier (no synchronous scoring).',
    riskTier: 2,
    allowedRoles: ['SUPPLIER', 'ADMIN'],
    idempotency: 'required',
    inputSchemaId,
    outputSchemaId,
    inputSchema,
    outputSchema,
    handler: async (ctx: ToolContext, input, idempotencyKey) => {
      if (idempotencyKey != null && idempotencyKey !== input.idempotencyKey) {
        throw new AgentError('IDEMPOTENCY_MISMATCH', 'idempotencyKey mismatch between tool call and input payload');
      }

      await deps.access.assertWriteAccess(ctx, input.supplierId);

      const triggeredBy = { username: ctx.actor.username, role: ctx.actor.role };
      const payload = { reason: input.reason, trigger: 'agent_tool_scoring_trigger' };

      const inserted = await deps.db.query<{ id: string; created_at: string }>(
        `INSERT INTO scoring_jobs (
            entity_id,
            event_type,
            idempotency_key,
            status,
            attempt_count,
            last_error,
            available_at,
            payload,
            triggered_by
          )
          VALUES ($1, $2, $3, 'queued', 0, NULL, NOW(), $4::jsonb, $5::jsonb)
          ON CONFLICT (idempotency_key)
          DO NOTHING
          RETURNING id, created_at`,
        [input.supplierId, 'SUPPLIER_PROFILE_UPDATED', input.idempotencyKey, JSON.stringify(payload), JSON.stringify(triggeredBy)]
      );

      const created = inserted.rows[0];

      const existing = await deps.db.query<{ id: string; created_at: string }>(
        `SELECT id, created_at
           FROM scoring_jobs
          WHERE idempotency_key = $1
          LIMIT 1`,
        [input.idempotencyKey]
      );

      const job = existing.rows[0];
      if (!job) {
        throw new AgentError('ENQUEUE_FAILED', 'Scoring job enqueue failed');
      }

      await deps.db.query(
        `INSERT INTO scoring_audit (job_id, entity_id, event_type, idempotency_key, action, payload)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [
          job.id,
          input.supplierId,
          'SUPPLIER_PROFILE_UPDATED',
          input.idempotencyKey,
          'SCORING_TRIGGERED',
          JSON.stringify({ reason: input.reason, actor: triggeredBy, deduped: created == null })
        ]
      );

      return {
        jobId: job.id,
        supplierId: input.supplierId,
        status: created ? 'ENQUEUED' : 'DUPLICATE_IGNORED',
        enqueuedAt: new Date().toISOString()
      };
    }
  };
};
