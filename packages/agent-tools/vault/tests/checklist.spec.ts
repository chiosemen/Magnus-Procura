import { describe, expect, it } from 'vitest';

import type { ToolContext } from 'agent-core';
import { vaultUploadChecklistTool } from '../src/index.js';

const logger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

const ctx: ToolContext = {
  correlationId: 'corr-1',
  runId: 'run-1',
  mode: 'live',
  actor: { username: 'supplier', role: 'SUPPLIER' },
  now: () => new Date('2026-02-12T00:00:00.000Z'),
  logger,
  confirmations: new Set(),
  approvals: new Set()
};

describe('vault.getUploadChecklist', () => {
  it('derives checklist deterministically from scoring feature values', async () => {
    const tool = vaultUploadChecklistTool({
      db: {
        query: async () => {
          return {
            rows: [
              {
                feature_values: {
                  certificationsCount: 0,
                  esgPoliciesCount: 0,
                  diversityStatusCount: 0
                }
              }
            ]
          };
        }
      },
      access: {
        assertReadAccess: async () => {}
      }
    });

    const out = await tool.handler(ctx, { supplierId: 'sup-1' });
    expect(out.supplierId).toBe('sup-1');
    expect(out.checklist.length).toBe(3);
    expect(out.checklist.map((i) => i.itemId)).toEqual([
      'upload.certifications',
      'upload.esg_policies',
      'upload.diversity_status'
    ]);
  });

  it('fails closed when required feature values are missing', async () => {
    const tool = vaultUploadChecklistTool({
      db: {
        query: async () => {
          return {
            rows: [
              {
                feature_values: {
                  certificationsCount: 0,
                  esgPoliciesCount: 0
                }
              }
            ]
          };
        }
      },
      access: {
        assertReadAccess: async () => {}
      }
    });

    await expect(tool.handler(ctx, { supplierId: 'sup-1' })).rejects.toMatchObject({ code: 'MISSING_CONTEXT' });
  });
});
