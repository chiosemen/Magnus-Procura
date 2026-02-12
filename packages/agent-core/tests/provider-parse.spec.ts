import { describe, expect, it } from 'vitest';

import { safeParseToolCallPlan } from '../src/types/provider.js';

describe('safeParseToolCallPlan', () => {
  it('accepts a valid tool plan', () => {
    const parsed = safeParseToolCallPlan({
      finalMessage: 'ok',
      toolCalls: [
        {
          id: 'call-1',
          toolName: 'vault.getUploadChecklist',
          input: { supplierId: 'sup-1' }
        }
      ]
    });

    expect(parsed.finalMessage).toBe('ok');
    expect(parsed.toolCalls).toHaveLength(1);
  });

  it('rejects invalid tool plan shapes (fail-closed)', () => {
    expect(() => {
      safeParseToolCallPlan({
        finalMessage: 'ok',
        toolCalls: [{ toolName: 'x' }]
      });
    }).toThrow(/Invalid tool call plan/);
  });
});
