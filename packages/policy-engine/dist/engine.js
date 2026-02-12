import { PolicyFailClosedError } from './types.js';
import { persistPolicyEvaluation, persistPolicyReport } from './audit.js';
import { evaluateRules } from './evaluator.js';
import { PolicyRuleRegistry } from './registry.js';
import { certificationsRule } from './rules/certifications.js';
import { insuranceRule } from './rules/insurance.js';
import { readinessRule } from './rules/readiness.js';
const withTransaction = async (db, fn) => {
    await db.query('BEGIN');
    try {
        const out = await fn();
        await db.query('COMMIT');
        return out;
    }
    catch (err) {
        await db.query('ROLLBACK');
        throw err;
    }
};
export class PolicyEngine {
    clock;
    registry = new PolicyRuleRegistry();
    constructor(clock = { now: () => new Date() }) {
        this.clock = clock;
    }
    registerDefaults() {
        this.registry.register(insuranceRule);
        this.registry.register(certificationsRule);
        this.registry.register(readinessRule);
    }
    registerRule(rule) {
        this.registry.register(rule);
    }
    listRules() {
        return this.registry.list();
    }
    async evaluateAndPersist(args) {
        const evaluatedAt = this.clock.now().toISOString();
        const ctx = { ...args.context, input: { evaluatedAt } };
        try {
            const report = evaluateRules({ rules: this.registry.list(), clock: this.clock, context: ctx });
            await withTransaction(args.db, async () => {
                await persistPolicyReport(args.db, report);
            });
            return report;
        }
        catch (err) {
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
            }
            catch (auditErr) {
                const auditMessage = auditErr instanceof Error ? auditErr.message : 'Unknown audit persistence error';
                args.logger.error({ entityId: args.context.entityId, err: auditMessage }, 'policy_audit_persist_failed');
            }
            throw new PolicyFailClosedError(message);
        }
    }
}
export const createDefaultPolicyEngine = (clock) => {
    const engine = new PolicyEngine(clock);
    engine.registerDefaults();
    return engine;
};
