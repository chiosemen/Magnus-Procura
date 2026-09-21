import type { AgentContext, JsonObject } from '../types/index.js';

export type TranscriptEventType =
  | 'agent_run_started'
  | 'agent_run_completed'
  | 'agent_run_failed'
  | 'provider_request'
  | 'provider_response'
  | 'provider_error'
  | 'tool_call_requested'
  | 'tool_call_executed'
  | 'tool_call_denied'
  | 'tool_call_failed'
  | 'policy_decision'
  | 'policy_violation_detected'
  | 'orchestrator_error';

export interface TranscriptEvent {
  readonly type: TranscriptEventType;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly runId: string;
  readonly actor: { readonly username: string; readonly role: string };
  readonly data: JsonObject;
}

export interface TranscriptWriter {
  write: (event: TranscriptEvent) => void;
}

export class InMemoryTranscriptWriter implements TranscriptWriter {
  private readonly events: TranscriptEvent[] = [];

  public write(event: TranscriptEvent): void {
    this.events.push(event);
  }

  public snapshot(): readonly TranscriptEvent[] {
    return this.events.slice();
  }
}

export const buildTranscriptEvent = (ctx: AgentContext, type: TranscriptEventType, data: JsonObject): TranscriptEvent => {
  return {
    type,
    timestamp: ctx.now().toISOString(),
    correlationId: ctx.correlationId,
    runId: ctx.runId,
    actor: { username: ctx.actor.username, role: ctx.actor.role },
    data
  };
};
