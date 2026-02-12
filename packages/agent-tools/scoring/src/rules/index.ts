import type { ScoringEvent, ScoringEventType } from '../types.js';

export interface RuleHit {
  ruleId: string;
  description: string;
  delta: number;
}

export interface RuleEngineResult {
  baseScore: number;
  ruleHits: RuleHit[];
  featureValues: Record<string, unknown>;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const scoreSupplierProfileUpdated = (event: ScoringEvent): RuleEngineResult => {
  const payload = (event.payload ?? {}) as Record<string, unknown>;

  const legalNameRaw = payload['legalName'];
  const industryRaw = payload['industry'];
  const certificationsRaw = payload['certifications'];
  const esgPoliciesRaw = payload['esgPolicies'];
  const diversityStatusRaw = payload['diversityStatus'];

  const legalName = typeof legalNameRaw === 'string' ? legalNameRaw.trim() : '';
  const industry = typeof industryRaw === 'string' ? industryRaw.trim() : '';
  const certifications = Array.isArray(certificationsRaw) ? certificationsRaw.filter((x) => typeof x === 'string') : [];
  const esgPolicies = Array.isArray(esgPoliciesRaw) ? esgPoliciesRaw.filter((x) => typeof x === 'string') : [];
  const diversityStatus = Array.isArray(diversityStatusRaw) ? diversityStatusRaw.filter((x) => typeof x === 'string') : [];

  const featureValues: Record<string, unknown> = {
    legalNamePresent: legalName.length > 0,
    industryPresent: industry.length > 0,
    certificationsCount: certifications.length,
    esgPoliciesCount: esgPolicies.length,
    diversityStatusCount: diversityStatus.length
  };

  const ruleHits: RuleHit[] = [];
  let score = 50;

  if (legalName.length > 0) ruleHits.push({ ruleId: 'profile.legal_name', description: 'Legal name provided', delta: 10 });
  if (industry.length > 0) ruleHits.push({ ruleId: 'profile.industry', description: 'Industry provided', delta: 10 });
  if (certifications.length >= 1) ruleHits.push({ ruleId: 'profile.certifications', description: 'Certifications present', delta: 10 });
  if (esgPolicies.length >= 1) ruleHits.push({ ruleId: 'profile.esg', description: 'ESG policies present', delta: 10 });
  if (diversityStatus.length >= 1) ruleHits.push({ ruleId: 'profile.diversity', description: 'Diversity status present', delta: 10 });

  for (const hit of ruleHits) score += hit.delta;
  score = clamp(score, 0, 100);

  return { baseScore: score, ruleHits, featureValues };
};

const scoreDocumentUploaded = (event: ScoringEvent): RuleEngineResult => {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const docTypeRaw = payload['documentType'];
  const docType = typeof docTypeRaw === 'string' ? docTypeRaw : 'unknown';

  const featureValues: Record<string, unknown> = {
    documentType: docType
  };

  const ruleHits: RuleHit[] = [];
  let score = 60;

  ruleHits.push({ ruleId: 'doc.uploaded', description: 'Document uploaded', delta: 5 });
  if (docType === 'w9' || docType === 'insurance' || docType === 'msa') {
    ruleHits.push({ ruleId: 'doc.high_value', description: 'High-value compliance document uploaded', delta: 10 });
  }

  for (const hit of ruleHits) score += hit.delta;
  score = clamp(score, 0, 100);
  return { baseScore: score, ruleHits, featureValues };
};

const scoreCredentialExpired = (event: ScoringEvent): RuleEngineResult => {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const credentialTypeRaw = payload['credentialType'];
  const credentialType = typeof credentialTypeRaw === 'string' ? credentialTypeRaw : 'unknown';

  const featureValues: Record<string, unknown> = {
    credentialType
  };

  const ruleHits: RuleHit[] = [];
  let score = 70;
  const delta = -20;
  ruleHits.push({ ruleId: 'credential.expired', description: 'Credential expired', delta });
  score = clamp(score + delta, 0, 100);

  return { baseScore: score, ruleHits, featureValues };
};

const scoreExternalSyncUpdated = (event: ScoringEvent): RuleEngineResult => {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const sourceRaw = payload['source'];
  const source = typeof sourceRaw === 'string' ? sourceRaw : 'unknown';

  const featureValues: Record<string, unknown> = { source };
  const delta = 3;
  const ruleHits: RuleHit[] = [{ ruleId: 'sync.updated', description: 'External sync updated', delta }];
  const score = clamp(55 + delta, 0, 100);
  return { baseScore: score, ruleHits, featureValues };
};

const scoreAdminOverride = (event: ScoringEvent): RuleEngineResult => {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const overrideScoreRaw = payload['score'];
  const reasonRaw = payload['reason'];
  const overrideScore = typeof overrideScoreRaw === 'number' ? overrideScoreRaw : null;
  const reason = typeof reasonRaw === 'string' ? reasonRaw : '';

  const featureValues: Record<string, unknown> = { overrideScore, reason };
  const ruleHits: RuleHit[] = [{ ruleId: 'admin.override', description: 'Admin override applied', delta: 0 }];

  if (overrideScore == null || Number.isNaN(overrideScore)) {
    return { baseScore: 0, ruleHits: [{ ruleId: 'admin.override.invalid', description: 'Invalid override payload', delta: 0 }], featureValues };
  }

  const score = clamp(Math.round(overrideScore), 0, 100);
  return { baseScore: score, ruleHits, featureValues };
};

export const runRuleEngine = (event: ScoringEvent): RuleEngineResult => {
  const handlers: Record<ScoringEventType, (event: ScoringEvent) => RuleEngineResult> = {
    SUPPLIER_PROFILE_UPDATED: scoreSupplierProfileUpdated,
    DOCUMENT_UPLOADED: scoreDocumentUploaded,
    CREDENTIAL_EXPIRED: scoreCredentialExpired,
    EXTERNAL_SYNC_UPDATED: scoreExternalSyncUpdated,
    ADMIN_OVERRIDE: scoreAdminOverride
  };

  const handler = handlers[event.eventType];
  return handler(event);
};
