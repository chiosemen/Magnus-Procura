import { createHash } from 'node:crypto';

import type { FeatureRecord, FeatureWriteInput } from './types.js';
import { stableStringify } from './validators.js';

export const computeIdempotencyFingerprint = (input: FeatureWriteInput): string => {
  const hash = createHash('sha256');
  hash.update(input.entity_id, 'utf8');
  hash.update('\n', 'utf8');
  hash.update(input.feature_name, 'utf8');
  hash.update('\n', 'utf8');
  hash.update(String(input.feature_version), 'utf8');
  hash.update('\n', 'utf8');
  hash.update(input.source_event, 'utf8');
  hash.update('\n', 'utf8');
  hash.update(stableStringify(input.feature_value), 'utf8');
  return hash.digest('hex');
};

export const computeRecordFingerprint = (record: FeatureRecord): string => {
  const hash = createHash('sha256');
  hash.update(record.entity_id, 'utf8');
  hash.update('\n', 'utf8');
  hash.update(record.feature_name, 'utf8');
  hash.update('\n', 'utf8');
  hash.update(String(record.feature_version), 'utf8');
  hash.update('\n', 'utf8');
  hash.update(record.source_event, 'utf8');
  hash.update('\n', 'utf8');
  hash.update(stableStringify(record.feature_value), 'utf8');
  return hash.digest('hex');
};
