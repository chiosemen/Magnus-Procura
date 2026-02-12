import crypto from 'node:crypto';

import type { ScoringEvent, ScoringEventType } from './types.js';

const canonicalize = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
};

export const createIdempotencyKey = (eventType: ScoringEventType, entityId: string, payload: unknown): string => {
  const hash = crypto.createHash('sha256');
  hash.update(eventType);
  hash.update('|');
  hash.update(entityId);
  hash.update('|');
  hash.update(canonicalize(payload));
  return `score:${hash.digest('hex')}`;
};

export const buildEvent = (args: {
  entityId: string;
  eventType: ScoringEventType;
  payload: unknown;
  triggeredBy: ScoringEvent['triggeredBy'];
}): ScoringEvent => {
  return {
    entityId: args.entityId,
    eventType: args.eventType,
    payload: args.payload,
    triggeredBy: args.triggeredBy
  };
};
