import type { AgentContext, GenerateTextRequest, GenerateTextResult, LlmProvider, PlanToolCallsRequest, ToolCallPlan } from 'agent-core';
import { safeParseProviderJsonObject, safeParseToolCallPlan } from 'agent-core';

export interface GeminiProviderConfig {
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

const extractText = (payload: unknown): string => {
  const record = asRecord(payload);
  const candidates = asArray(record?.['candidates']);
  const firstCandidate = asRecord(candidates?.[0]);
  const content = asRecord(firstCandidate?.['content']);
  const parts = asArray(content?.['parts']);
  const firstPart = asRecord(parts?.[0]);
  return requireString(firstPart?.['text'], 'Gemini response content');
};

export const createGeminiProvider = (config: GeminiProviderConfig): LlmProvider => {
  const apiKey = requireString(config.apiKey, 'Gemini apiKey');
  const baseUrl = (config.baseUrl ?? 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');

  const generateText = async (_ctx: AgentContext, request: GenerateTextRequest): Promise<GenerateTextResult> => {
    const model = requireString(request.model, 'Gemini model');
    const endpoint = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${request.system}\n\n${request.user}` }] }],
        generationConfig: { temperature: 0 }
      }),
      signal: AbortSignal.timeout(request.timeoutMs)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Gemini request failed: ${response.status} ${response.statusText}${text ? `: ${text}` : ''}`);
    }

    const payload = (await response.json()) as unknown;
    return { text: extractText(payload), raw: null };
  };

  const planToolCalls = async (ctx: AgentContext, request: PlanToolCallsRequest): Promise<ToolCallPlan> => {
    const tools = request.tools.map((t: { name: string; description: string; inputSchemaId: string; outputSchemaId: string }) => `- ${t.name}: ${t.description} (inputSchemaId=${t.inputSchemaId}, outputSchemaId=${t.outputSchemaId})`).join('\n');

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
    name: 'gemini',
    generateText,
    planToolCalls
  };
};

