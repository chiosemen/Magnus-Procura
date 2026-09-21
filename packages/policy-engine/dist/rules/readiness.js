import { z } from 'zod';
const readinessSchema = z.number().int().min(0).max(100);
export const readinessRule = {
    id: 'readiness.minimum',
    description: 'Readiness score must be >= 90 when provided.',
    evaluate: (context) => {
        const raw = context.features['readinessScore'];
        if (raw == null) {
            return {
                status: 'WARN',
                reasons: ['No readiness score provided'],
                metadata: { checked: false },
                timestamp: context.input['evaluatedAt']
            };
        }
        const parsed = readinessSchema.safeParse(raw);
        if (!parsed.success) {
            return {
                status: 'FAIL',
                reasons: ['Invalid readiness score'],
                metadata: { error: parsed.error.message },
                timestamp: context.input['evaluatedAt']
            };
        }
        if (parsed.data < 90) {
            return {
                status: 'WARN',
                reasons: ['Readiness score below target threshold'],
                metadata: { readinessScore: parsed.data, threshold: 90 },
                timestamp: context.input['evaluatedAt']
            };
        }
        return {
            status: 'PASS',
            reasons: [],
            metadata: { readinessScore: parsed.data, threshold: 90 },
            timestamp: context.input['evaluatedAt']
        };
    }
};
