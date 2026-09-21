import { z } from 'zod';
import { AgentError, type AgentContext, type ToolDefinition, type ToolContext } from 'agent-core';

export interface SupplierAccess {
  assertReadAccess: (ctx: AgentContext, supplierId: string) => Promise<void>;
}

export interface VaultToolDeps {
  db: {
    query: <T = unknown>(sql: string, params?: readonly unknown[]) => Promise<{ rows: T[] }>;
  };
  access: SupplierAccess;
}

export const vaultUploadChecklistTool = (deps: VaultToolDeps): ToolDefinition<
  { supplierId: string },
  {
    supplierId: string;
    generatedAt: string;
    checklist: Array<{
      itemId: string;
      title: string;
      reason: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      evidenceType: string | null;
      expires: boolean | null;
    }>;
  }
> => {
  const inputSchemaId = 'tool.vault.uploadChecklist.input';
  const outputSchemaId = 'tool.vault.uploadChecklist.output';

  const inputSchema = z
    .object({
      supplierId: z.string().min(1)
    })
    .strict();

  const checklistItemSchema = z
    .object({
      itemId: z.string().min(1),
      title: z.string().min(1),
      reason: z.string().min(1),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      evidenceType: z.union([z.string().min(1), z.null()]),
      expires: z.union([z.boolean(), z.null()])
    })
    .strict();

  const outputSchema = z
    .object({
      supplierId: z.string().min(1),
      generatedAt: z.string().datetime(),
      checklist: z.array(checklistItemSchema)
    })
    .strict();

  return {
    name: 'vault.getUploadChecklist',
    description: 'Read-only deterministic upload checklist derived from scoring/policy artifacts.',
    riskTier: 0,
    allowedRoles: ['SUPPLIER', 'ADMIN'],
    idempotency: 'none',
    inputSchemaId,
    outputSchemaId,
    inputSchema,
    outputSchema,
    handler: async (ctx: ToolContext, input, _idempotencyKey) => {
      void _idempotencyKey;
      await deps.access.assertReadAccess(ctx, input.supplierId);

      const row = await deps.db.query(
        `SELECT e.feature_values AS feature_values
           FROM scoring_scores s
           JOIN scoring_explanations e ON e.score_id = s.id
          WHERE s.entity_id = $1
          ORDER BY s.created_at DESC
          LIMIT 1`,
        [input.supplierId]
      );

      const candidate = row.rows[0] as { feature_values?: unknown } | undefined;
      if (!candidate) {
        throw new AgentError('MISSING_CONTEXT', 'No scoring artifacts are available to derive a checklist');
      }

      const featuresParsed = z.record(z.unknown()).safeParse(candidate.feature_values);
      if (!featuresParsed.success) {
        throw new AgentError('INVALID_DB_PAYLOAD', 'feature_values is not an object');
      }

      const features = featuresParsed.data as Record<string, unknown>;

      const certificationsCount = typeof features['certificationsCount'] === 'number' ? features['certificationsCount'] : null;
      const esgPoliciesCount = typeof features['esgPoliciesCount'] === 'number' ? features['esgPoliciesCount'] : null;
      const diversityStatusCount = typeof features['diversityStatusCount'] === 'number' ? features['diversityStatusCount'] : null;

      if (certificationsCount == null || esgPoliciesCount == null || diversityStatusCount == null) {
        throw new AgentError('MISSING_CONTEXT', 'Required scoring feature values are missing for deterministic checklist generation');
      }

      const checklist: Array<z.infer<typeof checklistItemSchema>> = [];

      if (certificationsCount === 0) {
        checklist.push({
          itemId: 'upload.certifications',
          title: 'Upload certification evidence',
          reason: 'No certifications are recorded in the profile scoring features.',
          priority: 'HIGH',
          evidenceType: 'certification',
          expires: false
        });
      }

      if (esgPoliciesCount === 0) {
        checklist.push({
          itemId: 'upload.esg_policies',
          title: 'Upload ESG policy documentation',
          reason: 'No ESG policies are recorded in the profile scoring features.',
          priority: 'MEDIUM',
          evidenceType: 'esg_policy',
          expires: false
        });
      }

      if (diversityStatusCount === 0) {
        checklist.push({
          itemId: 'upload.diversity_status',
          title: 'Upload diversity status documentation',
          reason: 'No diversity status is recorded in the profile scoring features.',
          priority: 'LOW',
          evidenceType: 'diversity_status',
          expires: false
        });
      }

      return {
        supplierId: input.supplierId,
        generatedAt: new Date().toISOString(),
        checklist
      };
    }
  };
};
