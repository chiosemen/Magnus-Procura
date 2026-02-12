export interface MlScoreResult {
  scoreDelta: number;
  confidence: number;
  features: Record<string, unknown>;
}

export const scoreWithMl = async (_args: {
  mode: 'disabled' | 'required';
  eventType: string;
  payload: unknown;
}): Promise<MlScoreResult | null> => {
  if (_args.mode === 'disabled') {
    return null;
  }

  throw new Error('ML scoring is required but no ML provider is configured');
};
