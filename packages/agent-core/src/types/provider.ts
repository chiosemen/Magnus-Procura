import { z } from 'zod';

import type { AgentContext, JsonObject, JsonValue } from './index.js';

export interface GenerateTextRequest {
  readonly model: string;
  readonly system: string;
  readonly user: string;
  readonly timeoutMs: number;
}

export interface GenerateTextResult {
  readonly text: string;
  readonly raw: JsonValue | null;
}

export const toolCallPlanSchema = z.object({
  finalMessage: z.string().min(1),
  toolCalls: z
    .array(
      z.object({
        id: z.string().min(1),
        toolName: z.string().min(1),
        input: z.record(z.unknown()),
        idempotencyKey: z.string().min(1).optional()
      })
    )
    .default([])
});

export type ToolCallPlan = z.infer<typeof toolCallPlanSchema>;

export interface PlanToolCallsRequest {
  readonly model: string;
  readonly system: string;
  readonly user: string;
  readonly timeoutMs: number;
  readonly tools: readonly {
    readonly name: string;
    readonly description: string;
    readonly inputSchemaId: string;
    readonly outputSchemaId: string;
  }[];
}

export interface LlmProvider {
  readonly name: string;
  generateText: (ctx: AgentContext, request: GenerateTextRequest) => Promise<GenerateTextResult>;
  planToolCalls: (ctx: AgentContext, request: PlanToolCallsRequest) => Promise<ToolCallPlan>;
}

export const safeParseToolCallPlan = (value: unknown): ToolCallPlan => {
  const parsed = toolCallPlanSchema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid tool call plan: ${issues}`);
  }
  return parsed.data;
};

export const safeParseProviderJsonObject = (text: string): JsonObject => {
  const parsed = JSON.parse(text) as unknown;
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Provider response was not a JSON object');
  }
  return parsed as JsonObject;
};

