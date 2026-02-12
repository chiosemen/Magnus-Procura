import type { AgentContext, GenerateTextRequest, GenerateTextResult, LlmProvider, PlanToolCallsRequest, ToolCallPlan } from 'agent-core';
import { safeParseProviderJsonObject, safeParseToolCallPlan } from 'agent-core';

export interface OpenAiProviderConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
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

const extractContent = (payload: unknown): string => {
  const record = asRecord(payload);
  const choices = asArray(record?.['choices']);
  const choice0 = asRecord(choices?.[0]);
  const message = asRecord(choice0?.['message']);
  return requireString(message?.['content'], 'OpenAI response content');
};

export const createOpenAiProvider = (config: OpenAiProviderConfig): LlmProvider => {
  const apiKey = requireString(config.apiKey, 'OpenAI apiKey');
  const baseUrl = (config.baseUrl ?? 'https://api.openai.com').replace(/\/+$/, '');

  const generateText = async (_ctx: AgentContext, request: GenerateTextRequest): Promise<GenerateTextResult> => {
    const model = requireString(request.model, 'OpenAI model');

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user }
        ]
      }),
      signal: AbortSignal.timeout(request.timeoutMs)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}${text ? `: ${text}` : ''}`);
    }

    const payload = (await response.json()) as unknown;
    return { text: extractContent(payload), raw: null };
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

    const result = await generateText(ctx, {
      model: request.model,
      system,
      user: request.user,
      timeoutMs: request.timeoutMs
    });

    const obj = safeParseProviderJsonObject(result.text);
    return safeParseToolCallPlan(obj);
  };

  return {
    name: 'openai',
    generateText,
    planToolCalls
  };
};
