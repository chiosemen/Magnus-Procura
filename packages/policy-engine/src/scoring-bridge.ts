import crypto from 'node:crypto';
import type { DbClient, PolicyContext, PolicyEvaluationReport } from './types.js';
import { PolicyEngine } from './engine.js';
import { PolicyFailClosedError } from './types.js';

export interface ScoringBridgeInput {
  orgId: string;
  cohortId: string;
  context: PolicyContext;
  engine: PolicyEngine;
  db: DbClient;
  actorId?: string | null;
  policyBatchId?: string;
}

export interface ScoringBridgeResult {
  scoreSnapshotId: string;
  policyBatchId: string;
  score: number;
  report: PolicyEvaluationReport;
  evaluatedAt: string;
}

/**
 * Evaluates authoritative policies, enforces strict fail-closed guarantees,
 * and binds the resulting score snapshot to an immutable policy batch ID in audit_log.
 */
export async function evaluateAndBindScoreSnapshot(
  input: ScoringBridgeInput
): Promise<ScoringBridgeResult> {
  const { orgId, cohortId, context, engine, db, actorId = null } = input;
  const policyBatchId = input.policyBatchId ?? crypto.randomUUID();
  const evaluatedAt = (context.input['evaluatedAt'] as string) || new Date().toISOString();

  // 1. Check idempotency: check if identical batch was already submitted
  const existingAudit = await db.query<{ id: string }>(
    `SELECT id FROM audit_log WHERE action = 'policy.evaluation.completed' AND entity_id = $1 AND meta->>'policyBatchId' = $2 LIMIT 1`,
    [orgId, policyBatchId]
  );

  if (existingAudit.rows.length > 0) {
    throw new Error(`Duplicate evaluation batch '${policyBatchId}' already processed for organization '${orgId}'.`);
  }

  // 2. Evaluate policy engine
  const report = await engine.evaluate(context);

  // 3. Enforce Fail-Closed: If any rule fails, immediately log failure and halt
  if (report.overallStatus === 'FAIL') {
    const reasons = report.violations.flatMap(v => v.reasons);
    
    await db.query(
      `INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, meta, created_at)
       VALUES ($1, $2, 'policy.evaluation.failed', 'organization', $3, $4, $5)`,
      [
        crypto.randomUUID(),
        actorId,
        orgId,
        JSON.stringify({
          policyBatchId,
          violations: report.violations,
          explainability: report.explainability,
        }),
        evaluatedAt,
      ]
    );

    throw new PolicyFailClosedError(
      `Compliance policy evaluation failed for org '${orgId}': ${reasons.join('; ')}`
    );
  }

  // 4. Calculate score from verified evidence (e.g. baseline 100 minus warnings)
  const penalty = report.explainability.warnCount * 5;
  const rawScore = Number(context.features['readinessScore']) || 100;
  const finalScore = Math.max(0, Math.min(100, rawScore - penalty));

  // 5. Write policy audit record (Scoring Evidence Chain anchor)
  await db.query(
    `INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, meta, created_at)
     VALUES ($1, $2, 'policy.evaluation.completed', 'organization', $3, $4, $5)`,
    [
      crypto.randomUUID(),
      actorId,
      orgId,
      JSON.stringify({
        policyBatchId,
        score: finalScore,
        overallStatus: report.overallStatus,
        explainability: report.explainability,
        ruleCount: report.results.length,
      }),
      evaluatedAt,
    ]
  );

  // 6. Insert immutable score snapshot linked to policyBatchId
  const snapshotId = crypto.randomUUID();
  const snapshotJson = {
    score: finalScore,
    policyBatchId,
    policyStatus: report.overallStatus,
    evaluatedAt,
    explainability: report.explainability,
  };

  await db.query(
    `INSERT INTO score_snapshots (id, org_id, cohort_id, json, taken_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      snapshotId,
      orgId,
      cohortId,
      JSON.stringify(snapshotJson),
      evaluatedAt,
    ]
  );

  return {
    scoreSnapshotId: snapshotId,
    policyBatchId,
    score: finalScore,
    report,
    evaluatedAt,
  };
}
