import type { LlmProvider, PlanToolCallsRequest, ToolCallPlan } from '../types/provider.js';
import { ProviderError } from '../types/index.js';
import type { JsonObject, StructuredLogger } from '../types/index.js';
import type { ToolCallOutcome, ToolCallRequest, ToolContext } from '../types/tooling.js';
import { toolCallRequestSchema } from '../types/tooling.js';
import type { TranscriptWriter } from '../transcript/index.js';
import { buildTranscriptEvent } from '../transcript/index.js';
import type { ToolRegistry } from '../registry/index.js';

export type AgentRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface AgentRunRequest {
  readonly provider: string;
  readonly model: string;
  readonly promptId: string;
  readonly promptVersion: string;
  readonly inputSummary: JsonObject;
  readonly system: string;
  readonly user: string;
  readonly timeoutMs: number;
}

export interface AgentRunResult {
  readonly status: AgentRunStatus;
  readonly finalMessage: string;
  readonly toolOutcomes: readonly ToolCallOutcome[];
  readonly plan: ToolCallPlan | null;
  readonly error: { readonly code: string; readonly message: string } | null;
}

const planToolsForProvider = (tools: readonly { name: string; description: string; inputSchemaId: string; outputSchemaId: string }[]) => {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchemaId: t.inputSchemaId,
    outputSchemaId: t.outputSchemaId
  }));
};

export class AgentOrchestrator {
  public constructor(
    private readonly provider: LlmProvider,
    private readonly tools: ToolRegistry,
    private readonly logger: StructuredLogger,
    private readonly transcript?: TranscriptWriter
  ) {}

  public async executePlan(ctx: ToolContext, plan: ToolCallPlan): Promise<{ outcomes: ToolCallOutcome[] }> {
    const outcomes: ToolCallOutcome[] = [];

    for (const call of plan.toolCalls) {
      const parsedCall = toolCallRequestSchema.safeParse(call);
      if (!parsedCall.success) {
        const issues = parsedCall.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new ProviderError(`Provider tool call schema invalid: ${issues}`);
      }

      const inferredIdempotencyKey = (() => {
        if (parsedCall.data.idempotencyKey && parsedCall.data.idempotencyKey.length > 0) {
          return parsedCall.data.idempotencyKey;
        }
        const input = parsedCall.data.input as Record<string, unknown>;
        return typeof input['idempotencyKey'] === 'string' && input['idempotencyKey'].length > 0 ? input['idempotencyKey'] : undefined;
      })();

      const toolCall: ToolCallRequest = {
        id: parsedCall.data.id,
        toolName: parsedCall.data.toolName,
        input: parsedCall.data.input as JsonObject,
        ...(inferredIdempotencyKey ? { idempotencyKey: inferredIdempotencyKey } : {})
      };

      this.transcript?.write(
        buildTranscriptEvent(ctx, 'tool_call_requested', {
          toolName: toolCall.toolName,
          toolCallId: toolCall.id
        })
      );

      const outcome = await this.tools.execute(ctx, toolCall);
      outcomes.push(outcome);

      if (outcome.status === 'DENIED') {
        this.transcript?.write(
          buildTranscriptEvent(ctx, 'tool_call_denied', {
            toolName: toolCall.toolName,
            toolCallId: toolCall.id,
            riskTier: outcome.riskTier,
            reason: outcome.decision.reason
          })
        );
      } else if (outcome.status === 'FAIL') {
        this.transcript?.write(
          buildTranscriptEvent(ctx, 'tool_call_failed', {
            toolName: toolCall.toolName,
            toolCallId: toolCall.id,
            riskTier: outcome.riskTier,
            error: outcome.error ?? { code: 'UNKNOWN', message: 'Unknown tool error' }
          })
        );
      } else {
        this.transcript?.write(
          buildTranscriptEvent(ctx, 'tool_call_executed', {
            toolName: toolCall.toolName,
            toolCallId: toolCall.id,
            riskTier: outcome.riskTier,
            status: outcome.status
          })
        );
      }
    }

    return { outcomes };
  }

  public async run(ctx: ToolContext, request: AgentRunRequest): Promise<AgentRunResult> {
    this.logger.info(
      {
        correlationId: ctx.correlationId,
        runId: ctx.runId,
        provider: request.provider,
        model: request.model,
        promptId: request.promptId,
        promptVersion: request.promptVersion
      },
      'agent_run_started'
    );

    this.transcript?.write(
      buildTranscriptEvent(ctx, 'agent_run_started', {
        provider: request.provider,
        model: request.model,
        promptId: request.promptId,
        promptVersion: request.promptVersion
      })
    );

    const toolDescriptors = this.tools.list().map((t) => ({
      name: t.name,
      description: t.description,
      inputSchemaId: t.inputSchemaId,
      outputSchemaId: t.outputSchemaId
    }));

    const planRequest: PlanToolCallsRequest = {
      model: request.model,
      system: request.system,
      user: request.user,
      timeoutMs: request.timeoutMs,
      tools: planToolsForProvider(toolDescriptors)
    };

    try {
      this.transcript?.write(
        buildTranscriptEvent(ctx, 'provider_request', {
          provider: request.provider,
          model: request.model,
          promptId: request.promptId,
          promptVersion: request.promptVersion
        })
      );

      const plan = await this.provider.planToolCalls(ctx, planRequest);

      this.transcript?.write(
        buildTranscriptEvent(ctx, 'provider_response', {
          provider: request.provider,
          model: request.model,
          toolCallsCount: plan.toolCalls.length
        })
      );

      const { outcomes } = await this.executePlan(ctx, plan);

      const deniedTier2Or3 = outcomes.some((o) => o.status === 'DENIED' && o.riskTier >= 2);
      const anyFailed = outcomes.some((o) => o.status === 'FAIL');
      const status: AgentRunStatus = deniedTier2Or3 || anyFailed ? 'FAILED' : 'SUCCESS';

      if (status === 'SUCCESS') {
        this.logger.info(
          { correlationId: ctx.correlationId, runId: ctx.runId, toolCalls: outcomes.length },
          'agent_run_completed'
        );
        this.transcript?.write(buildTranscriptEvent(ctx, 'agent_run_completed', { toolCalls: outcomes.length }));
      } else {
        this.logger.warn(
          { correlationId: ctx.correlationId, runId: ctx.runId, toolCalls: outcomes.length },
          'agent_run_failed'
        );
        this.transcript?.write(buildTranscriptEvent(ctx, 'agent_run_failed', { toolCalls: outcomes.length }));
      }

      return {
        status,
        finalMessage: plan.finalMessage,
        toolOutcomes: outcomes,
        plan,
        error: null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = error instanceof ProviderError ? error.code : 'PROVIDER_ERROR';

      this.logger.error(
        { correlationId: ctx.correlationId, runId: ctx.runId, provider: request.provider, model: request.model, error: { code, message } },
        'provider_error'
      );

      this.transcript?.write(
        buildTranscriptEvent(ctx, 'provider_error', {
          provider: request.provider,
          model: request.model,
          error: { code, message }
        })
      );

      this.transcript?.write(buildTranscriptEvent(ctx, 'agent_run_failed', { error: { code, message } }));

      return {
        status: 'FAILED',
        finalMessage: 'Agent run failed.',
        toolOutcomes: [],
        plan: null,
        error: { code, message }
      };
    }
  }
}
