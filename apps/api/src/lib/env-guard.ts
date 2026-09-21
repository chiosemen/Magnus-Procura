/**
 * Environment trust boundary.
 *
 * apps/api ships authentication and authorization bypasses that exist purely so
 * unit tests can run without a live Supabase project. Those bypasses were gated
 * on NODE_ENV === 'test' alone, which is a single misconfigured environment
 * variable away from disabling authentication in a deployed service.
 *
 * Two independent conditions are now required, and the server asserts at boot
 * that neither can hold in a real deployment.
 */

/**
 * True only inside an actual Vitest run. `VITEST` is injected by the test
 * runner itself, so it cannot be satisfied by a deployment's environment
 * configuration the way NODE_ENV can.
 */
export function isTestBypassEnabled(): boolean {
  return process.env.NODE_ENV === 'test' && process.env.VITEST === 'true';
}

/**
 * Refuses to start a server that would accept test credentials. Call this
 * before binding a port.
 */
export function assertProductionSafety(): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    throw new Error(
      'Refusing to start: the API was launched with test-environment settings ' +
      '(NODE_ENV=test or VITEST=true), which enable authentication bypasses. ' +
      'Set NODE_ENV=production (or development) before starting the server.'
    );
  }
}
