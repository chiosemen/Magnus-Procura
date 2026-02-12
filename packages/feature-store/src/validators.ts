import { z } from 'zod';

import { FeatureValidationError } from './types.js';

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value == null || typeof value !== 'object') {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const stableStringifyInternal = (value: unknown, seen: Set<unknown>): string => {
  if (value === null) {
    return 'null';
  }

  const t = typeof value;
  if (t === 'string') {
    return JSON.stringify(value);
  }
  if (t === 'number') {
    if (!Number.isFinite(value)) {
      throw new FeatureValidationError('feature_value must be JSON-serializable (finite number required)');
    }
    return String(value);
  }
  if (t === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (t === 'bigint' || t === 'symbol' || t === 'function' || t === 'undefined') {
    throw new FeatureValidationError('feature_value must be JSON-serializable');
  }

  if (seen.has(value)) {
    throw new FeatureValidationError('feature_value must not contain cycles');
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value.map((v) => stableStringifyInternal(v, seen)).join(',');
    return `[${items}]`;
  }

  if (!isPlainObject(value)) {
    throw new FeatureValidationError('feature_value must be a plain JSON object');
  }

  const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
  const body = keys
    .map((k) => `${JSON.stringify(k)}:${stableStringifyInternal(value[k], seen)}`)
    .join(',');
  return `{${body}}`;
};

export const stableStringify = (value: unknown): string => {
  return stableStringifyInternal(value, new Set<unknown>());
};

export const validateIdentifier = (label: string, value: string): void => {
  if (value.trim().length === 0) {
    throw new FeatureValidationError(`${label} must be non-empty`);
  }
};

export function validateFeatureDefinition(definition: unknown): asserts definition is {
  name: string;
  version: number;
  schema: z.ZodType<unknown>;
  description: string;
} {
  const schema = z
    .object({
      name: z.string().min(1),
      version: z.number().int().positive(),
      schema: z.custom<z.ZodType<unknown>>((v) => v instanceof z.ZodType),
      description: z.string().min(1)
    })
    .strict();

  const parsed = schema.safeParse(definition);
  if (!parsed.success) {
    throw new FeatureValidationError(parsed.error.message);
  }
}

export function validateFeatureWriteInput(input: unknown): asserts input is {
  entity_id: string;
  feature_name: string;
  feature_value: unknown;
  feature_version: number;
  source_event: string;
  idempotency_key: string;
} {
  const schema = z
    .object({
      entity_id: z.string().min(1),
      feature_name: z.string().min(1),
      feature_value: z.unknown(),
      feature_version: z.number().int().positive(),
      source_event: z.string().min(1),
      idempotency_key: z.string().min(1)
    })
    .strict();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new FeatureValidationError(parsed.error.message);
  }
}

export const parseAndRejectUnknownFields = (schema: z.ZodType<unknown>, value: unknown): unknown => {
  if (!isPlainObject(value)) {
    throw new FeatureValidationError('feature_value must be a plain JSON object');
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new FeatureValidationError(parsed.error.message);
  }

  // Fail-closed: reject schemas that strip or transform data by requiring stable JSON identity.
  const inputJson = stableStringify(value);
  const parsedJson = stableStringify(parsed.data);
  if (inputJson !== parsedJson) {
    throw new FeatureValidationError('feature_value contains unknown fields or is transformed by schema');
  }

  return parsed.data;
};
