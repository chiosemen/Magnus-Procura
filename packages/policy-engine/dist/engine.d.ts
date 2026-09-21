import type { Clock, DbClient, Logger, PolicyContext, PolicyEvaluationReport } from './types.js';
import { PolicyRuleRegistry } from './registry.js';
export declare class PolicyEngine {
    private readonly clock;
    private readonly registry;
    constructor(clock?: Clock);
    registerDefaults(): void;
    evaluate(context: PolicyContext): Promise<PolicyEvaluationReport>;
    registerRule(rule: Parameters<PolicyRuleRegistry['register']>[0]): void;
    listRules(): ReadonlyArray<Parameters<PolicyRuleRegistry['register']>[0]>;
    evaluateAndPersist(args: {
        db: DbClient;
        logger: Logger;
        context: Omit<PolicyContext, 'input'>;
    }): Promise<PolicyEvaluationReport>;
}
export declare const createDefaultPolicyEngine: (clock?: Clock) => PolicyEngine;
//# sourceMappingURL=engine.d.ts.map