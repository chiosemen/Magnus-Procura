import { z } from 'zod';

import type { AgentContext, AgentRole, JsonObject, StructuredLogger } from './index.js';

export type RiskTier = 0 | 1 | 2 | 3;
export type IdempotencyRequirement = 'required' | 'optional' | 'none';

export interface ToolExecutionDecision {
  readonly allow: boolean;
  readonly reason: string;
}

export interface ToolCallRequest {
  readonly id: string;
  readonly toolName: string;
  readonly input: JsonObject;
  readonly idempotencyKey?: string;
}

export type ToolCallStatus = 'SUCCESS' | 'FAIL' | 'DENIED' | 'SKIPPED_DUPLICATE';

export interface ToolCallOutcome {
  readonly id: string;
  readonly toolName: string;
  readonly riskTier: RiskTier;
  readonly status: ToolCallStatus;
  readonly durationMs: number;
  readonly decision: ToolExecutionDecision;
  readonly output: JsonObject | null;
  readonly error: { readonly code: string; readonly message: string } | null;
}

export interface ToolContext extends AgentContext {
  readonly logger: StructuredLogger;
  readonly confirmations: ReadonlySet<string>;
  readonly approvals: ReadonlySet<string>;
}

export interface ToolDefinition<Input extends JsonObject, Output extends JsonObject> {
  readonly name: string;
  readonly description: string;
  readonly riskTier: RiskTier;
  readonly allowedRoles: readonly AgentRole[];
  readonly idempotency: IdempotencyRequirement;
  readonly inputSchemaId: string;
  readonly outputSchemaId: string;
  readonly inputSchema: z.ZodType<Input>;
  readonly outputSchema: z.ZodType<Output>;
  readonly handler: (ctx: ToolContext, input: Input, idempotencyKey?: string) => Promise<Output>;
}

export const toolCallRequestSchema = z.object({
  id: z.string().min(1),
  toolName: z.string().min(1),
  input: z.record(z.unknown()),
  idempotencyKey: z.string().min(1).optional()
});

