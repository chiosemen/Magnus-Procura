import type { JsonObject } from '../types/index.js';
import { PolicyViolationError, SchemaValidationError } from '../types/index.js';
import type { LlmProvider } from '../types/provider.js';
import type { ToolCallOutcome, ToolCallRequest, ToolContext, ToolDefinition, ToolExecutionDecision } from '../types/tooling.js';

const nowMs = (): number => Date.now();

const errorCode = (error: unknown): string => {
  if (error == null || typeof error !== 'object') {
    return 'TOOL_FAILED';
  }
  const record = error as Record<string, unknown>;
  return typeof record['code'] === 'string' && record['code'].length > 0 ? record['code'] : 'TOOL_FAILED';
};

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<JsonObject, JsonObject>>();

  public register<Input extends JsonObject, Output extends JsonObject>(tool: ToolDefinition<Input, Output>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool as unknown as ToolDefinition<JsonObject, JsonObject>);
  }

  public list(): readonly ToolDefinition<JsonObject, JsonObject>[] {
    return Array.from(this.tools.values());
  }

  public require(name: string): ToolDefinition<JsonObject, JsonObject> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }

  private authorizeToolCall(ctx: ToolContext, tool: ToolDefinition<JsonObject, JsonObject>, call: ToolCallRequest): ToolExecutionDecision {
    if (!tool.allowedRoles.includes(ctx.actor.role)) {
      return { allow: false, reason: `Role ${ctx.actor.role} is not allowed to execute tool ${tool.name}` };
    }

    if (ctx.mode === 'replay' && tool.riskTier >= 2) {
      return { allow: false, reason: `Tool ${tool.name} is not allowed in replay mode (risk tier ${tool.riskTier})` };
    }

    if (tool.riskTier === 2) {
      if (ctx.actor.role === 'ADMIN') {
        return { allow: true, reason: 'Admin override allowed for tier 2 tool' };
      }
      if (!ctx.confirmations.has(call.id)) {
        return { allow: false, reason: `Explicit user confirmation required for tier 2 tool call ${call.id}` };
      }
    }

    if (tool.riskTier === 3) {
      if (ctx.actor.role !== 'ADMIN') {
        return { allow: false, reason: 'Tier 3 tool calls require ADMIN' };
      }
      // Dual control: require at least two distinct approvals (represented as opaque approval IDs).
      if (ctx.approvals.size < 2) {
        return { allow: false, reason: 'Tier 3 tool calls require dual control approvals' };
      }
    }

    if (tool.idempotency === 'required' && (call.idempotencyKey == null || call.idempotencyKey.length === 0)) {
      return { allow: false, reason: `Tool ${tool.name} requires idempotencyKey` };
    }

    return { allow: true, reason: 'Allowed' };
  }

  public async execute(ctx: ToolContext, call: ToolCallRequest): Promise<ToolCallOutcome> {
    const tool = this.require(call.toolName);

    const decision = this.authorizeToolCall(ctx, tool, call);
    if (!decision.allow) {
      ctx.logger.warn(
        { correlationId: ctx.correlationId, runId: ctx.runId, toolName: tool.name, toolCallId: call.id, riskTier: tool.riskTier, reason: decision.reason },
        'tool_call_denied'
      );

      return {
        id: call.id,
        toolName: tool.name,
        riskTier: tool.riskTier,
        status: 'DENIED',
        durationMs: 0,
        decision,
        output: null,
        error: { code: 'FORBIDDEN', message: decision.reason }
      };
    }

    const start = nowMs();
    try {
      const parsedInput = tool.inputSchema.safeParse(call.input);
      if (!parsedInput.success) {
        const issues = parsedInput.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new SchemaValidationError(`Tool input validation failed: ${issues}`);
      }

      ctx.logger.info(
        { correlationId: ctx.correlationId, runId: ctx.runId, toolName: tool.name, toolCallId: call.id, riskTier: tool.riskTier },
        'tool_call_executed'
      );

      const output = await tool.handler(ctx, parsedInput.data, call.idempotencyKey);
      const parsedOutput = tool.outputSchema.safeParse(output);
      if (!parsedOutput.success) {
        const issues = parsedOutput.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new SchemaValidationError(`Tool output validation failed: ${issues}`);
      }

      return {
        id: call.id,
        toolName: tool.name,
        riskTier: tool.riskTier,
        status: 'SUCCESS',
        durationMs: nowMs() - start,
        decision,
        output: parsedOutput.data,
        error: null
      };
    } catch (error) {
      if (error instanceof PolicyViolationError) {
        return {
          id: call.id,
          toolName: tool.name,
          riskTier: tool.riskTier,
          status: 'DENIED',
          durationMs: nowMs() - start,
          decision: { allow: false, reason: error.message },
          output: null,
          error: { code: error.code, message: error.message }
        };
      }

      const message = error instanceof Error ? error.message : String(error);
      const code = errorCode(error);

      ctx.logger.error(
        { correlationId: ctx.correlationId, runId: ctx.runId, toolName: tool.name, toolCallId: call.id, riskTier: tool.riskTier, error: { code, message } },
        'tool_call_failed'
      );

      return {
        id: call.id,
        toolName: tool.name,
        riskTier: tool.riskTier,
        status: 'FAIL',
        durationMs: nowMs() - start,
        decision,
        output: null,
        error: { code, message }
      };
    }
  }
}

export class ProviderRegistry {
  private readonly providers = new Map<string, LlmProvider>();

  public register(provider: LlmProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Provider already registered: ${provider.name}`);
    }
    this.providers.set(provider.name, provider);
  }

  public require(name: string): LlmProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }

  public list(): readonly LlmProvider[] {
    return Array.from(this.providers.values());
  }
}
