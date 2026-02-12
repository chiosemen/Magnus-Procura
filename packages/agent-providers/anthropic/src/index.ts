import type { AgentContext, GenerateTextRequest, GenerateTextResult, LlmProvider, PlanToolCallsRequest, ToolCallPlan } from 'agent-core';
import { safeParseProviderJsonObject, safeParseToolCallPlan } from 'agent-core';

export interface AnthropicProviderConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly anthropicVersion?: string;
}

const requireString = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const asArray = (value: unknown): unknown[] | null => (Array.isArray(value) ? value : null);

const extractText = (payload: unknown): string => {
  const record = asRecord(payload);
  const contentArr = asArray(record?.['content']);
  const first = asRecord(contentArr?.[0]);
  return requireString(first?.['text'], 'Anthropic response content');
};

export const createAnthropicProvider = (config: AnthropicProviderConfig): LlmProvider => {
  const apiKey = requireString(config.apiKey, 'Anthropic apiKey');
  const baseUrl = (config.baseUrl ?? 'https://api.anthropic.com').replace(/\/+$/, '');
  const anthropicVersion = config.anthropicVersion ?? '2023-06-01';

  const generateText = async (_ctx: AgentContext, request: GenerateTextRequest): Promise<GenerateTextResult> => {
    const model = requireString(request.model, 'Anthropic model');

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': anthropicVersion
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 1024,
        system: request.system,
        messages: [{ role: 'user', content: request.user }]
      }),
      signal: AbortSignal.timeout(request.timeoutMs)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Anthropic request failed: ${response.status} ${response.statusText}${text ? `: ${text}` : ''}`);
    }

    const payload = (await response.json()) as unknown;
    return { text: extractText(payload), raw: null };
  };

  const planToolCalls = async (ctx: AgentContext, request: PlanToolCallsRequest): Promise<ToolCallPlan> => {
    const tools = request.tools.map((t) => `- ${t.name}: ${t.description} (inputSchemaId=${t.inputSchemaId}, outputSchemaId=${t.outputSchemaId})`).join('\n');

    const system = [
      request.system,
      '',
      'You are an enterprise-safe agent. Produce ONLY valid JSON with keys: finalMessage (string) and toolCalls (array).',
      'toolCalls items must be objects with keys: id (string), toolName (string), input (object), optional idempotencyKey (string).',
      'Do not include markdown. Do not include extra keys.',
      '',
      'Available tools:',
      tools
    ].join('\n');

    const result = await generateText(ctx, { model: request.model, system, user: request.user, timeoutMs: request.timeoutMs });
    const obj = safeParseProviderJsonObject(result.text);
    return safeParseToolCallPlan(obj);
  };

  return {
    name: 'anthropic',
    generateText,
    planToolCalls
  };
};

