import type { PolicyContext, PolicyResult, PolicyRule } from '../types.js';

export const packetRule: PolicyRule = {
  id: 'packet.status',
  description: 'Supplier risk packet must be verified and not in blocked status.',
  evaluate: (context: PolicyContext): PolicyResult => {
    const timestamp = (context.input['evaluatedAt'] as string) || new Date().toISOString();
    const packetStatus = context.credentials['packetStatus'];

    if (!packetStatus) {
      return {
        status: 'FAIL',
        reasons: ['Missing mandatory risk packet credential'],
        metadata: { checked: true, missing: true },
        timestamp,
      };
    }

    if (packetStatus === 'blocked') {
      return {
        status: 'FAIL',
        reasons: ['Supplier risk packet is blocked due to compliance or audit issues'],
        metadata: { packetStatus },
        timestamp,
      };
    }

    if (packetStatus === 'ready') {
      return {
        status: 'PASS',
        reasons: [],
        metadata: { packetStatus },
        timestamp,
      };
    }

    return {
      status: 'WARN',
      reasons: [`Risk packet is currently in '${packetStatus}' status`],
      metadata: { packetStatus },
      timestamp,
    };
  },
};
