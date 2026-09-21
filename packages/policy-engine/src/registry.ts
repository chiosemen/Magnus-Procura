import type { PolicyRule } from './types.js';
import { PolicyRuleRegistrationError } from './types.js';

export class PolicyRuleRegistry {
  private readonly rules: PolicyRule[] = [];
  private readonly ids = new Set<string>();

  public register(rule: PolicyRule): void {
    if (rule.id.trim().length === 0) {
      throw new PolicyRuleRegistrationError('Rule id must be non-empty');
    }
    if (rule.description.trim().length === 0) {
      throw new PolicyRuleRegistrationError(`Rule ${rule.id} description must be non-empty`);
    }
    if (this.ids.has(rule.id)) {
      throw new PolicyRuleRegistrationError(`Duplicate rule id: ${rule.id}`);
    }
    this.ids.add(rule.id);
    this.rules.push(rule);
  }

  public list(): ReadonlyArray<PolicyRule> {
    return this.rules;
  }
}

