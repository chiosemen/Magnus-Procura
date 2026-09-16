import { describe, it, expect } from 'vitest';

describe('Magnus Procura Full-Cycle Synthetic Lifecycle Test', () => {
  // Mock In-Memory State for the Synthetic Lifecycle
  interface MockState {
    orgId: string;
    fitScore: number;
    programStatus: 'pending' | 'active' | 'cancelled';
    refundUntil: Date;
    packetStatus: 'ready' | 'blocked';
    primaryTargetsCount: number;
    benchTargetsCount: number;
    intros: Array<{
      id: string;
      championName: string;
      copyApproved: boolean;
      status: 'draft' | 'sent' | 'met' | 'declined';
    }>;
    attestation?: {
      amountCents: number;
      calculatedFeeCents: number;
      status: 'submitted' | 'accepted';
      netDays: number;
    };
    bounties: Array<{
      partnerId: string;
      amountCents: number;
      dueOnDay: number;
      status: 'pending' | 'due' | 'paid';
    }>;
  }

  const state: MockState = {
    orgId: 'org_synthetic_01',
    fitScore: 0,
    programStatus: 'pending',
    refundUntil: new Date(),
    packetStatus: 'blocked',
    primaryTargetsCount: 0,
    benchTargetsCount: 0,
    intros: [],
    bounties: [],
  };

  it('Step 1: Fit Gate ICP evaluation (Pass >= 70, Hard fail < 50)', () => {
    const evaluateFit = (yearsOperating: number, revenue: number, hasPastPerf: boolean) => {
      if (yearsOperating < 2) return 0; // Hard fail (< 24 months)
      let score = 50;
      if (revenue >= 1000000) score += 25;
      if (hasPastPerf) score += 20;
      return score;
    };

    // Hard fail test
    expect(evaluateFit(1, 2000000, true)).toBe(0);

    // Eligible candidate
    state.fitScore = evaluateFit(4, 3500000, true);
    expect(state.fitScore).toBe(95);
    expect(state.fitScore).toBeGreaterThanOrEqual(70);
  });

  it('Step 2: SOW & Stripe Checkout completion activates program and 30d refund clock', () => {
    const activateProgram = (orgId: string, sku: 'year_1' | 'sprint_90') => {
      state.programStatus = 'active';
      const refundDate = new Date();
      refundDate.setDate(refundDate.getDate() + 30);
      state.refundUntil = refundDate;
      return {
        orgId,
        sku,
        attemptsOwed: sku === 'year_1' ? 8 : 4,
        status: state.programStatus,
      };
    };

    const program = activateProgram(state.orgId, 'year_1');
    expect(program.status).toBe('active');
    expect(program.attemptsOwed).toBe(8);
  });

  it('Step 3: The File starts BLOCKED; unblocks to READY only upon all 8 artifacts verified', () => {
    expect(state.packetStatus).toBe('blocked');

    const artifacts = [
      'capability_statement',
      'one_liner',
      'naics_list',
      'coi',
      'financials',
      'past_performance_1',
      'past_performance_2',
      'portal_list',
    ];

    const verifyArtifacts = (verifiedCount: number) => {
      return verifiedCount === 8 ? 'ready' : 'blocked';
    };

    // Partial upload
    expect(verifyArtifacts(6)).toBe('blocked');

    // Full 8 artifacts verified
    state.packetStatus = verifyArtifacts(artifacts.length);
    expect(state.packetStatus).toBe('ready');
  });

  it('Step 4: Target mapping enforces 5 Primary + 5 Bench account limits', () => {
    const addTarget = (tier: 'primary' | 'bench') => {
      if (tier === 'primary') {
        if (state.primaryTargetsCount >= 5) {
          throw new Error('Organization cannot exceed 5 primary targets');
        }
        state.primaryTargetsCount++;
      } else {
        if (state.benchTargetsCount >= 5) {
          throw new Error('Organization cannot exceed 5 bench targets');
        }
        state.benchTargetsCount++;
      }
    };

    // Add 5 primary targets
    for (let i = 0; i < 5; i++) {
      addTarget('primary');
    }
    expect(state.primaryTargetsCount).toBe(5);

    // 6th primary target throws invariant error
    expect(() => addTarget('primary')).toThrow('Organization cannot exceed 5 primary targets');

    // Add 5 bench targets
    for (let i = 0; i < 5; i++) {
      addTarget('bench');
    }
    expect(state.benchTargetsCount).toBe(5);
    expect(() => addTarget('bench')).toThrow('Organization cannot exceed 5 bench targets');
  });

  it('Step 5: Intro requires member copy approval before dispatch', () => {
    state.intros.push({
      id: 'intro_syn_01',
      championName: 'Michael Thornton',
      copyApproved: false,
      status: 'draft',
    });

    const dispatchIntro = (introId: string) => {
      const intro = state.intros.find((i) => i.id === introId);
      if (!intro) throw new Error('Intro not found');
      if (state.packetStatus !== 'ready') throw new Error('Packet is blocked');
      if (!intro.copyApproved) throw new Error('Member has not approved copy');
      intro.status = 'sent';
      return intro;
    };

    // Fails without approval
    expect(() => dispatchIntro('intro_syn_01')).toThrow('Member has not approved copy');

    // Member signs off
    state.intros[0].copyApproved = true;
    const sentIntro = dispatchIntro('intro_syn_01');
    expect(sentIntro.status).toBe('sent');
  });

  it('Step 6: Meeting held and stage transitions recorded', () => {
    state.intros[0].status = 'met';
    expect(state.intros[0].status).toBe('met');
  });

  it('Step 7: PO Attestation calculates 8% fee strictly capped at $8,000 on Net 15', () => {
    const calculateSuccessFee = (poAmountCents: number) => {
      const fee = Math.round(poAmountCents * 0.08);
      return Math.min(fee, 800000); // $8,000 cap (800,000 cents)
    };

    // PO: $150,000 (15,000,000 cents) -> 8% is $12,000, capped at $8,000
    const feeCents = calculateSuccessFee(15000000);
    expect(feeCents).toBe(800000); // Strict $8k cap!

    state.attestation = {
      amountCents: 15000000,
      calculatedFeeCents: feeCents,
      status: 'accepted',
      netDays: 15,
    };

    expect(state.attestation.status).toBe('accepted');
    expect(state.attestation.netDays).toBe(15);
  });

  it('Step 8: Day 91 Keep milestone releases $500 partner bounty', () => {
    const evaluateDay91Keep = (dayOfProgram: number, refundRequested: boolean) => {
      if (dayOfProgram >= 91 && !refundRequested) {
        return {
          amountCents: 50000, // $500
          status: 'due' as const,
        };
      }
      return {
        amountCents: 0,
        status: 'pending' as const,
      };
    };

    // Day 45
    expect(evaluateDay91Keep(45, false).status).toBe('pending');

    // Day 91
    const bounty = evaluateDay91Keep(91, false);
    expect(bounty.status).toBe('due');
    expect(bounty.amountCents).toBe(50000);
  });
});
