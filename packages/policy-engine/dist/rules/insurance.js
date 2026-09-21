import { z } from 'zod';
const insuranceSchema = z
    .object({
    expiresAt: z.string().min(1),
    policyNumber: z.string().min(1)
})
    .strict();
export const insuranceRule = {
    id: 'insurance.active',
    description: 'Supplier insurance must be active (not expired) and affirmatively verified.',
    evaluate: (context) => {
        const raw = context.credentials['insurance'];
        if (raw == null) {
            return {
                status: 'FAIL',
                reasons: ['Missing mandatory insurance credential'],
                metadata: { checked: true, missing: true },
                timestamp: context.input['evaluatedAt'] || new Date().toISOString()
            };
        }
        const parsed = insuranceSchema.safeParse(raw);
        if (!parsed.success) {
            return {
                status: 'FAIL',
                reasons: ['Invalid insurance credential shape'],
                metadata: { error: parsed.error.message },
                timestamp: context.input['evaluatedAt']
            };
        }
        const expires = new Date(parsed.data.expiresAt);
        if (Number.isNaN(expires.getTime())) {
            return {
                status: 'FAIL',
                reasons: ['Invalid insurance expiration timestamp'],
                metadata: { expiresAt: parsed.data.expiresAt },
                timestamp: context.input['evaluatedAt']
            };
        }
        const evaluatedAt = new Date(context.input['evaluatedAt']);
        if (expires.getTime() < evaluatedAt.getTime()) {
            return {
                status: 'FAIL',
                reasons: ['Insurance is expired'],
                metadata: { expiresAt: parsed.data.expiresAt, policyNumber: parsed.data.policyNumber },
                timestamp: context.input['evaluatedAt']
            };
        }
        return {
            status: 'PASS',
            reasons: [],
            metadata: { policyNumber: parsed.data.policyNumber, expiresAt: parsed.data.expiresAt },
            timestamp: context.input['evaluatedAt']
        };
    }
};
