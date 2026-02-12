import crypto from 'node:crypto';
import type { JsonObject, ToolCallOutcome } from 'agent-core';

import { db } from '../lib/db.js';

export type AgentRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export const createAgentRun = async (args: {
  runId: string;
  userId: string;
  actorRole: string;
  provider: string;
  model: string;
  promptId: string;
  promptVersion: string;
  inputSummary: JsonObject;
  correlationId: string;
}): Promise<void> => {
  await db.query(
    `INSERT INTO agent_runs (
        id, user_id, actor_role, provider, model, prompt_id, prompt_version, status,
        input_summary, final_output, correlation_id, created_at, completed_at
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, 'RUNNING', $8::jsonb, NULL, $9, NOW(), NULL)`,
    [
      args.runId,
      args.userId,
      args.actorRole,
      args.provider,
      args.model,
      args.promptId,
      args.promptVersion,
      JSON.stringify(args.inputSummary),
      args.correlationId
    ]
  );
};

export const recordToolCall = async (args: {
  runId: string;
  outcome: ToolCallOutcome;
  inputPayload: JsonObject;
}): Promise<void> => {
  const id = crypto.randomUUID();

  await db.query(
    `INSERT INTO agent_tool_calls (
        id, run_id, tool_call_id, tool_name, risk_tier, input_payload, output_payload, status, policy_decision, created_at, completed_at
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9::jsonb, NOW(), NOW())`,
    [
      id,
      args.runId,
      args.outcome.id,
      args.outcome.toolName,
      args.outcome.riskTier,
      JSON.stringify(args.inputPayload),
      JSON.stringify(args.outcome.output ?? null),
      args.outcome.status,
      JSON.stringify({ allow: args.outcome.decision.allow, reason: args.outcome.decision.reason })
    ]
  );
};

export const completeAgentRun = async (args: {
  runId: string;
  status: AgentRunStatus;
  finalOutput: JsonObject;
}): Promise<void> => {
  await db.query(
    `UPDATE agent_runs
        SET status = $2,
            final_output = $3::jsonb,
            completed_at = NOW()
      WHERE id = $1::uuid`,
    [args.runId, args.status, JSON.stringify(args.finalOutput)]
  );
};
