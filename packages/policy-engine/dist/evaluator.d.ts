import type { Clock, PolicyEvaluationReport, PolicyRule } from './types.js';
export declare const evaluateRules: (args: {
    rules: ReadonlyArray<PolicyRule>;
    clock: Clock;
    context: Parameters<PolicyRule["evaluate"]>[0];
}) => PolicyEvaluationReport;
//# sourceMappingURL=evaluator.d.ts.map