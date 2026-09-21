-- Migration: 20260921000002_policy_batch_idempotency.sql
-- Description: Make the scoring evidence chain's policy batch idempotency
--              enforceable by the database rather than by a read-then-write
--              check in application code.
--
-- Rationale: evaluateAndBindScoreSnapshot() previously guarded against
-- duplicate submissions with SELECT-then-INSERT. That is a time-of-check /
-- time-of-use race: two concurrent evaluations of the same batch both observe
-- zero rows and both proceed, producing two score snapshots for one batch and
-- breaking the "one immutable batch, one snapshot" evidence guarantee.
--
-- A partial unique index makes duplicates impossible regardless of concurrency,
-- and lets the insert itself be the idempotency gate via ON CONFLICT.

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_log_policy_batch_completed
    ON public.audit_log ((meta->>'policyBatchId'))
    WHERE action = 'policy.evaluation.completed'
      AND meta->>'policyBatchId' IS NOT NULL;

-- Score snapshots are one-per-batch for the same reason.
CREATE UNIQUE INDEX IF NOT EXISTS uq_score_snapshots_policy_batch
    ON public.score_snapshots ((json->>'policyBatchId'))
    WHERE json->>'policyBatchId' IS NOT NULL;
