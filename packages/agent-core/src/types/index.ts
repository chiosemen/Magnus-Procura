export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };

export type AgentRole = 'SUPPLIER' | 'BUYER' | 'ADMIN' | 'SYSTEM';

export interface Actor {
  readonly username: string;
  readonly role: AgentRole;
}

export type RunMode = 'live' | 'replay';

export interface AgentContext {
  readonly correlationId: string;
  readonly runId: string;
  readonly mode: RunMode;
  readonly actor: Actor;
  readonly now: () => Date;
}

export interface StructuredLogger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
}

export class AgentError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class PolicyViolationError extends AgentError {
  public constructor(message: string) {
    super('POLICY_VIOLATION', message);
  }
}

export class SchemaValidationError extends AgentError {
  public constructor(message: string) {
    super('SCHEMA_VALIDATION_FAILED', message);
  }
}

export class ProviderError extends AgentError {
  public constructor(message: string) {
    super('PROVIDER_ERROR', message);
  }
}

export * from './provider.js';
export * from './tooling.js';

