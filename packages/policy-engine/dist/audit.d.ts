import type { DbClient, PolicyEvaluationReport, PolicyStatus } from './types.js';
export declare const persistPolicyEvaluation: (db: DbClient, args: {
    entityId: string;
    ruleId: string;
    result: PolicyStatus;
    reasons: unknown;
    metadata: unknown;
    evaluatedAt: string;
}) => Promise<void>;
export declare const persistPolicyReport: (db: DbClient, report: PolicyEvaluationReport) => Promise<void>;
//# sourceMappingURL=audit.d.ts.map