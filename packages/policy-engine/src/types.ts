export type PolicyStatus = 'PASS' | 'FAIL' | 'WARN';

export type PolicyReason = string;

export type PolicyMetadata = Readonly<Record<string, unknown>>;

export type PolicyResult = Readonly<{
  status: PolicyStatus;
  reasons: ReadonlyArray<PolicyReason>;
  metadata: PolicyMetadata;
  timestamp: string;
}>;

export type PolicyRule = Readonly<{
  id: string;
  description: string;
  evaluate: (context: PolicyContext) => PolicyResult;
}>;

export type PolicyContext = Readonly<{
  entityId: string;
  supplierProfile: unknown;
  features: Readonly<Record<string, unknown>>;
  credentials: Readonly<Record<string, unknown>>;
  input: Readonly<Record<string, unknown>>;
}>;

export type PolicyEvaluationRow = Readonly<{
  id: string;
  entity_id: string;
  rule_id: string;
  result: PolicyStatus;
  reasons: unknown;
  metadata: unknown;
  evaluated_at: string;
}>;

export type PolicyEvaluationReport = Readonly<{
  entityId: string;
  evaluatedAt: string;
  overallStatus: PolicyStatus;
  results: ReadonlyArray<Readonly<{ ruleId: string; description: string; result: PolicyResult }>>;
  violations: ReadonlyArray<Readonly<{ ruleId: string; status: PolicyStatus; reasons: ReadonlyArray<PolicyReason> }>>;
  explainability: Readonly<{
    passCount: number;
    warnCount: number;
    failCount: number;
  }>;
}>;

export interface DbClient {
  query: <T = unknown>(sql: string, params?: readonly unknown[]) => Promise<{ rows: T[] }>;
}

export interface Logger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
}

export type Clock = Readonly<{ now: () => Date }>;

export class PolicyEngineError extends Error {
  public override readonly name: string = 'PolicyEngineError';
}

export class PolicyRuleRegistrationError extends PolicyEngineError {
  public override readonly name: string = 'PolicyRuleRegistrationError';
}

export class PolicyFailClosedError extends PolicyEngineError {
  public override readonly name: string = 'PolicyFailClosedError';
  public constructor(message: string) {
    super(message);
  }
}

