export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const riskTierFromScore = (score: number): RiskTier => {
  if (!Number.isFinite(score)) {
    return 'CRITICAL';
  }

  if (score >= 85) return 'LOW';
  if (score >= 70) return 'MEDIUM';
  if (score >= 50) return 'HIGH';
  return 'CRITICAL';
};

