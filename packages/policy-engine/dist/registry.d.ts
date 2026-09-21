import type { PolicyRule } from './types.js';
export declare class PolicyRuleRegistry {
    private readonly rules;
    private readonly ids;
    register(rule: PolicyRule): void;
    list(): ReadonlyArray<PolicyRule>;
}
//# sourceMappingURL=registry.d.ts.map