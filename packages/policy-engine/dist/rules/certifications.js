import { z } from 'zod';
const certSchema = z.array(z.string().min(1)).max(100);
export const certificationsRule = {
    id: 'certifications.present',
    description: 'Certifications should be present when provided.',
    evaluate: (context) => {
        const raw = context.credentials['certifications'];
        if (raw == null) {
            return {
                status: 'WARN',
                reasons: ['No certifications provided'],
                metadata: { checked: false },
                timestamp: context.input['evaluatedAt']
            };
        }
        const parsed = certSchema.safeParse(raw);
        if (!parsed.success) {
            return {
                status: 'FAIL',
                reasons: ['Invalid certifications format'],
                metadata: { error: parsed.error.message },
                timestamp: context.input['evaluatedAt']
            };
        }
        if (parsed.data.length === 0) {
            return {
                status: 'WARN',
                reasons: ['Certifications list is empty'],
                metadata: { count: 0 },
                timestamp: context.input['evaluatedAt']
            };
        }
        return {
            status: 'PASS',
            reasons: [],
            metadata: { count: parsed.data.length },
            timestamp: context.input['evaluatedAt']
        };
    }
};
