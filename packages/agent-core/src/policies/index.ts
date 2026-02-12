import type { AgentContext, JsonObject } from '../types/index.js';
import { PolicyViolationError } from '../types/index.js';
import type { TranscriptWriter } from '../transcript/index.js';
import { buildTranscriptEvent } from '../transcript/index.js';

export interface PolicyDecision {
  readonly allow: boolean;
  readonly reason: string;
}

export type PolicyEvaluator = (ctx: AgentContext, action: string, data: JsonObject) => PolicyDecision;

export const assertPolicy = (args: {
  ctx: AgentContext;
  action: string;
  data: JsonObject;
  evaluate: PolicyEvaluator;
  transcript?: TranscriptWriter;
}): void => {
  const decision = args.evaluate(args.ctx, args.action, args.data);

  args.transcript?.write(
    buildTranscriptEvent(args.ctx, 'policy_decision', {
      action: args.action,
      allow: decision.allow,
      reason: decision.reason
    })
  );

  if (!decision.allow) {
    throw new PolicyViolationError(decision.reason);
  }
};

