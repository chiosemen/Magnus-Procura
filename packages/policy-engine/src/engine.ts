import type { Clock, DbClient, Logger, PolicyContext, PolicyEvaluationReport } from './types.js';
import { PolicyFailClosedError } from './types.js';
import { persistPolicyEvaluation, persistPolicyReport } from './audit.js';
import { evaluateRules } from './evaluator.js';
import { PolicyRuleRegistry } from './registry.js';
import { certificationsRule } from './rules/certifications.js';
import { insuranceRule } from './rules/insurance.js';
import { readinessRule } from './rules/readiness.js';

const withTransaction = async <T>(db: DbClient, fn: () => Promise<T>): Promise<T> => {
  await db.query('BEGIN');
  try {
    const out = await fn();
    await db.query('COMMIT');
    return out;
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
};

export class PolicyEngine {
  private readonly registry = new PolicyRuleRegistry();

  public constructor(private readonly clock: Clock = { now: () => new Date() }) {}

  public registerDefaults(): void {
    this.registry.register(insuranceRule);
    this.registry.register(certificationsRule);
    this.registry.register(readinessRule);
  }

  public registerRule(rule: Parameters<PolicyRuleRegistry['register']>[0]): void {
    this.registry.register(rule);
  }

  public listRules(): ReadonlyArray<Parameters<PolicyRuleRegistry['register']>[0]> {
    return this.registry.list();
  }

  public async evaluateAndPersist(args: {
    db: DbClient;
    logger: Logger;
    context: Omit<PolicyContext, 'input'>;
  }): Promise<PolicyEvaluationReport> {
    const evaluatedAt = this.clock.now().toISOString();
    const ctx: PolicyContext = { ...args.context, input: { evaluatedAt } };

    try {
      const report = evaluateRules({ rules: this.registry.list(), clock: this.clock, context: ctx });
      await withTransaction(args.db, async () => {
        await persistPolicyReport(args.db, report);
      });
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown policy evaluation error';
      args.logger.error({ entityId: args.context.entityId, err: message }, 'policy_fail_closed');

      try {
        await persistPolicyEvaluation(args.db, {
          entityId: args.context.entityId,
          ruleId: 'ENGINE_FAIL_CLOSED',
          result: 'FAIL',
          reasons: [message],
          metadata: { error: message },
          evaluatedAt
        });
      } catch (auditErr) {
        const auditMessage = auditErr instanceof Error ? auditErr.message : 'Unknown audit persistence error';
        args.logger.error({ entityId: args.context.entityId, err: auditMessage }, 'policy_audit_persist_failed');
      }

      throw new PolicyFailClosedError(message);
    }
  }
}

export const createDefaultPolicyEngine = (clock?: Clock): PolicyEngine => {
  const engine = new PolicyEngine(clock);
  engine.registerDefaults();
  return engine;
};
