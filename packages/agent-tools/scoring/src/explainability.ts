import type { RuleHit } from './rules/index.js';

export interface ExplainabilityArtifact {
  ruleHits: RuleHit[];
  featureValues: Record<string, unknown>;
  mlConfidence: number | null;
  timestamp: string;
}

export const buildExplainability = (args: {
  ruleHits: RuleHit[];
  featureValues: Record<string, unknown>;
  mlConfidence: number | null;
}): ExplainabilityArtifact => {
  return {
    ruleHits: args.ruleHits,
    featureValues: args.featureValues,
    mlConfidence: args.mlConfidence,
    timestamp: new Date().toISOString()
  };
};
