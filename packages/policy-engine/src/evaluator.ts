import type { Clock, PolicyEvaluationReport, PolicyResult, PolicyRule, PolicyStatus } from './types.js';

const summarize = (results: ReadonlyArray<PolicyResult>): Readonly<{ pass: number; warn: number; fail: number }> => {
  let pass = 0;
  let warn = 0;
  let fail = 0;
  for (const r of results) {
    if (r.status === 'PASS') pass += 1;
    if (r.status === 'WARN') warn += 1;
    if (r.status === 'FAIL') fail += 1;
  }
  return { pass, warn, fail };
};

const aggregateOverall = (results: ReadonlyArray<PolicyResult>): PolicyStatus => {
  if (results.some((r) => r.status === 'FAIL')) return 'FAIL';
  if (results.some((r) => r.status === 'WARN')) return 'WARN';
  return 'PASS';
};

export const evaluateRules = (args: {
  rules: ReadonlyArray<PolicyRule>;
  clock: Clock;
  context: Parameters<PolicyRule['evaluate']>[0];
}): PolicyEvaluationReport => {
  const evaluatedAt = args.clock.now().toISOString();

  const evaluated = args.rules.map((rule) => {
    const result = rule.evaluate(args.context);
    return { ruleId: rule.id, description: rule.description, result };
  });

  const results = evaluated.map((r) => r.result);
  const overallStatus = aggregateOverall(results);
  const counts = summarize(results);

  const violations = evaluated
    .filter((r) => r.result.status !== 'PASS')
    .map((r) => ({ ruleId: r.ruleId, status: r.result.status, reasons: r.result.reasons }));

  return {
    entityId: args.context.entityId,
    evaluatedAt,
    overallStatus,
    results: evaluated,
    violations,
    explainability: { passCount: counts.pass, warnCount: counts.warn, failCount: counts.fail }
  };
};

