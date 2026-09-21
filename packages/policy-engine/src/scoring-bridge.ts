import crypto from 'node:crypto';
import type { DbClient, PolicyContext, PolicyEvaluationReport } from './types.js';
import { PolicyEngine } from './engine.js';
import { PolicyFailClosedError, DuplicatePolicyBatchError } from './types.js';

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

  // 1. Fast-path duplicate rejection.
  //
  // This is an OPTIMISATION, not the guarantee. It short-circuits an obviously
  // replayed batch before doing evaluation work, and reports a replay as a
  // replay rather than letting it surface as some unrelated policy failure.
  // It is deliberately skipped when the caller did not supply a batch id, since
  // a freshly minted UUID can never collide and the query would be dead weight.
  //
  // The real guarantee is the unique index added in 20260921000002, enforced at
  // insert time in step 5. A read-then-write check alone is a
  // time-of-check/time-of-use race: two concurrent calls for the same batch
  // both observe zero rows and both proceed.
  if (input.policyBatchId) {
    const existing = await db.query<{ id: string }>(
      `SELECT id FROM audit_log
       WHERE action = 'policy.evaluation.completed'
         AND entity_id = $1
         AND meta->>'policyBatchId' = $2
       LIMIT 1`,
      [orgId, policyBatchId]
    );

    if (existing.rows.length > 0) {
      throw new DuplicatePolicyBatchError(
        `Duplicate evaluation batch '${policyBatchId}' already processed for organization '${orgId}'.`
      );
    }
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

  // 5. Write the audit anchor and the score snapshot atomically.
  //
  // Both writes are one unit of work: an audit row asserting a completed
  // evaluation with no corresponding snapshot is a broken evidence chain, which
  // is exactly what this bridge exists to prevent. ON CONFLICT DO NOTHING plus
  // RETURNING makes the insert the idempotency gate — a duplicate batch yields
  // zero rows and is rejected, with no possibility of a concurrent double-write.
  const snapshotId = crypto.randomUUID();
  const snapshotJson = {
    score: finalScore,
    policyBatchId,
    policyStatus: report.overallStatus,
    evaluatedAt,
    explainability: report.explainability,
  };

  await db.query('BEGIN');
  try {
    const anchor = await db.query<{ id: string }>(
      `INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, meta, created_at)
       VALUES ($1, $2, 'policy.evaluation.completed', 'organization', $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING id`,
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

    if (anchor.rows.length === 0) {
      throw new DuplicatePolicyBatchError(
        `Duplicate evaluation batch '${policyBatchId}' already processed for organization '${orgId}'.`
      );
    }

    await db.query(
      `INSERT INTO score_snapshots (id, org_id, cohort_id, json, taken_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [snapshotId, orgId, cohortId, JSON.stringify(snapshotJson), evaluatedAt]
    );

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  return {
    scoreSnapshotId: snapshotId,
    policyBatchId,
    score: finalScore,
    report,
    evaluatedAt,
  };
}
