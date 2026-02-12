import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

type CategoryName =
  | 'Security'
  | 'Strictness & Type Safety'
  | 'Architecture Boundaries'
  | 'Observability'
  | 'Testing Coverage'
  | 'CI Integrity'
  | 'Dependency Hygiene';

interface CategoryScore {
  max: number;
  score: number;
  checks: Array<{ name: string; passed: boolean; points: number; maxPoints: number; detail?: string }>;
}

interface ScoreReport {
  score: number;
  maxScore: number;
  breakdown: Record<CategoryName, { score: number; max: number }>;
  hardFailures: string[];
  invariantChecks: Array<{ name: string; passed: boolean; output: string }>;
  eligibleForProduction: 'YES' | 'NO';
}

const args = process.argv.slice(2);

const getArgValue = (flag: string, fallback: string): string => {
  const index = args.indexOf(flag);
  if (index >= 0 && index + 1 < args.length) {
    return args[index + 1] ?? fallback;
  }
  return fallback;
};

const jsonOutputPath = getArgValue('--json-output', 'pr-score.json');
const mdOutputPath = getArgValue('--md-output', 'pr-score.md');
const threshold = Number(getArgValue('--threshold', '90'));
const enforce = !args.includes('--no-enforce');

const categories: Record<CategoryName, CategoryScore> = {
  Security: { max: 25, score: 0, checks: [] },
  'Strictness & Type Safety': { max: 15, score: 0, checks: [] },
  'Architecture Boundaries': { max: 15, score: 0, checks: [] },
  Observability: { max: 10, score: 0, checks: [] },
  'Testing Coverage': { max: 15, score: 0, checks: [] },
  'CI Integrity': { max: 10, score: 0, checks: [] },
  'Dependency Hygiene': { max: 10, score: 0, checks: [] }
};

const hardFailures: string[] = [];

const addCheck = (
  category: CategoryName,
  name: string,
  maxPoints: number,
  passed: boolean,
  detail?: string
): void => {
  const points = passed ? maxPoints : 0;
  categories[category].score += points;
  categories[category].checks.push({ name, passed, points, maxPoints, detail });
};

const readText = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
};

const readJson = (filePath: string): unknown => {
  const raw = readText(filePath);
  if (raw.length === 0) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const exists = (filePath: string): boolean => fs.existsSync(filePath);

const walkFiles = (rootPath: string, extensions: readonly string[]): string[] => {
  if (!exists(rootPath)) {
    return [];
  }

  const files: string[] = [];
  const walk = (currentPath: string): void => {
    const stat = fs.statSync(currentPath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(currentPath)) {
        walk(path.join(currentPath, entry));
      }
      return;
    }
    if (extensions.some((ext) => currentPath.endsWith(ext))) {
      files.push(currentPath);
    }
  };

  walk(rootPath);
  return files;
};

const runCommand = (command: string, commandArgs: readonly string[]): { passed: boolean; output: string } => {
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  return {
    passed: result.status === 0,
    output
  };
};

const clientFiles = [
  'apps/web/src/App.tsx',
  'apps/web/src/index.tsx',
  'apps/web/src/constants.ts',
  ...walkFiles('apps/web/src/components', ['.ts', '.tsx']),
  ...walkFiles('apps/web/src/services', ['.ts', '.tsx'])
];

const serverFiles = walkFiles('apps/api/src', ['.ts', '.tsx', '.js', '.mjs']);

const noCdnRefs =
  !/cdn\.tailwindcss\.com/i.test(readText('apps/web/index.html')) &&
  !/esm\.sh/i.test(readText('apps/web/index.html'));

const clientSecretPatterns = [
  /\bapiKey\b/i,
  /Authorization\s*:\s*Bearer/i,
  /from\s+['"]@google\/genai['"]/,
  /from\s+['"]openai['"]/,
  /from\s+['"]@anthropic-ai\/sdk['"]/
];

const clientSecretFree = clientFiles.every((filePath) => {
  const content = readText(filePath);
  return clientSecretPatterns.every((pattern) => !pattern.test(content));
});

const authMiddleware = readText('apps/api/src/middleware/auth.ts');
const rbacMiddleware = readText('apps/api/src/middleware/rbac.ts');
const aiRoutes = readText('apps/api/src/routes/aiRoutes.ts');
const authRbacEnforced =
  /export const requireAuth/.test(authMiddleware) &&
  /export const requireRole/.test(rbacMiddleware) &&
  (aiRoutes.match(/aiRoutes\.(post|get)\(\s*'[^']+'\s*,\s*requireAuth\s*,\s*requireRole\(/g) ?? []).length >= 4;

const cspPresent =
  /Content-Security-Policy/i.test(readText('apps/web/index.html')) &&
  /contentSecurityPolicy/i.test(readText('apps/api/src/app.ts'));

const envModule = readText('apps/api/src/config/env.ts');
const envValidationFailClosed =
  envModule.length > 0 &&
  /envSchema/.test(envModule) &&
  /parseEnv/.test(envModule) &&
  /throw new Error\(`Environment validation failed:/.test(envModule) &&
  /export const env = parseEnv\(process\.env\)/.test(envModule) &&
  /from '\.\/config\/env\.js'/.test(readText('apps/api/src/index.ts'));

const rootTsconfig = (readJson('tsconfig.json') as { compilerOptions?: Record<string, unknown> } | null) ?? null;
const strictEnabled = rootTsconfig?.compilerOptions?.strict === true;
const allowJsDisabled = rootTsconfig?.compilerOptions?.allowJs === false;
const skipLibCheckDisabled = rootTsconfig?.compilerOptions?.skipLibCheck === false;

const noProviderCallsInClient = clientFiles.every((filePath) => {
  const content = readText(filePath);
  return !/from\s+['"]@google\/genai['"]/.test(content) && !/new\s+GoogleGenAI\s*\(/.test(content);
});

const apiLayerExists =
  exists('apps/api/src/app.ts') &&
  exists('apps/api/src/routes/authRoutes.ts') &&
  exists('apps/api/src/routes/aiRoutes.ts') &&
  exists('apps/api/src/routes/healthRoutes.ts');

const noCrossContextImports =
  clientFiles.every((filePath) => {
    const content = readText(filePath);
    return !/from\s+['"][^'"]*server\/src/.test(content) && !/from\s+['"]@\/server\//.test(content);
  }) &&
  serverFiles.every((filePath) => {
    const content = readText(filePath);
    return (
      !/from\s+['"][^'"]*apps\/web\//.test(content) &&
      !/from\s+['"][^'"]*App(\.tsx)?['"]/.test(content) &&
      !/from\s+['"][^'"]*index\.tsx['"]/.test(content)
    );
  });

const structuredLoggerPresent =
  /from 'pino'/.test(readText('apps/api/src/lib/logger.ts')) &&
  /pinoHttp/.test(readText('apps/api/src/lib/logger.ts'));
const telemetryConfigured =
  /export const captureError/.test(readText('apps/api/src/lib/telemetry.ts')) &&
  /captureError\(/.test(readText('apps/api/src/app.ts'));

const unitTestsExist = walkFiles('apps/api/tests/unit', ['.spec.ts']).length > 0;
const integrationTestsExist = walkFiles('apps/api/tests/integration', ['.spec.ts']).length > 0;
const e2eTestsExist = walkFiles('apps/api/tests/e2e', ['.spec.ts']).length > 0;

const ciWorkflow = readText('.github/workflows/ci.yml');
const ciMarkers = [
  'run: pnpm typecheck',
  'run: pnpm lint',
  'run: pnpm boundary:check',
  'run: pnpm governor',
  'run: pnpm test',
  'run: pnpm build',
];
const ciIncludesRequiredSteps = ciMarkers.every((marker) => ciWorkflow.includes(marker));
const ciOrdered = (() => {
  let prev = -1;
  for (const marker of ciMarkers) {
    const index = ciWorkflow.indexOf(marker);
    if (index === -1 || index < prev) {
      return false;
    }
    prev = index;
  }
  return true;
})();
const ciIntegrityPassed = ciIncludesRequiredSteps && ciOrdered;

const lockfilePresent = exists('pnpm-lock.yaml');

const hasDeprecatedPackages = (() => {
  const list = runCommand('pnpm', ['list', '--recursive', '--depth', '100', '--json']);
  if (!list.passed || list.output.length === 0) {
    return true;
  }

  try {
    const parsed = JSON.parse(list.output) as Array<Record<string, unknown>>;
    const stack: unknown[] = [parsed];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current == null || typeof current !== 'object') {
        continue;
      }

      if (Array.isArray(current)) {
        for (const item of current) {
          stack.push(item);
        }
        continue;
      }

      const asRecord = current as Record<string, unknown>;
      if (typeof asRecord.deprecated === 'string' && asRecord.deprecated.length > 0) {
        return true;
      }

      for (const value of Object.values(asRecord)) {
        if (value != null && typeof value === 'object') {
          stack.push(value);
        }
      }
    }
    return false;
  } catch {
    return true;
  }
})();

const auditResult = runCommand('pnpm', ['audit', '--json']);
const noCriticalVulnerabilities = (() => {
  if (auditResult.output.length === 0) {
    return false;
  }
  try {
    const parsed = JSON.parse(auditResult.output) as { metadata?: { vulnerabilities?: { critical?: number } } };
    return (parsed.metadata?.vulnerabilities?.critical ?? Number.POSITIVE_INFINITY) === 0;
  } catch {
    return false;
  }
})();
const dependenciesHealthy = !hasDeprecatedPackages && noCriticalVulnerabilities;

const invariantCommands = [
  { name: 'governor', command: 'node', args: ['scripts/governor-check.js'] },
  { name: 'boundary:check', command: 'pnpm', args: ['boundary:check'] },
  { name: 'invariant:no-cdn', command: 'node', args: ['scripts/invariants/check-no-cdn.mjs'] },
  { name: 'invariant:strict-ts', command: 'node', args: ['scripts/invariants/check-strict-ts.mjs'] },
  { name: 'invariant:no-role-toggle', command: 'node', args: ['scripts/invariants/check-no-role-toggle.mjs'] },
  { name: 'invariant:env-validation', command: 'node', args: ['scripts/invariants/check-env-validation.mjs'] }
] as const;

const invariantChecks = invariantCommands.map((item) => {
  const result = runCommand(item.command, item.args);
  return {
    name: item.name,
    passed: result.passed,
    output: result.output
  };
});

const governorConfigured = (() => {
  const packageJson = readJson('package.json') as { scripts?: Record<string, string> } | null;
  return (
    exists('scripts/governor-check.js') &&
    packageJson?.scripts?.governor === 'node scripts/governor-check.js' &&
    ciWorkflow.includes('run: pnpm governor')
  );
})();

addCheck('Security', 'No CDN references', 5, noCdnRefs);
addCheck('Security', 'No client-side provider keys', 5, clientSecretFree);
addCheck('Security', 'Auth + RBAC enforced', 5, authRbacEnforced);
addCheck('Security', 'CSP present', 5, cspPresent);
addCheck('Security', 'Env validation fail-closed', 5, envValidationFailClosed);

addCheck('Strictness & Type Safety', 'strict=true', 5, strictEnabled);
addCheck('Strictness & Type Safety', 'allowJs=false', 5, allowJsDisabled);
addCheck('Strictness & Type Safety', 'skipLibCheck=false', 5, skipLibCheckDisabled);

addCheck('Architecture Boundaries', 'No direct provider calls in client', 5, noProviderCallsInClient);
addCheck('Architecture Boundaries', 'API layer exists', 5, apiLayerExists);
addCheck('Architecture Boundaries', 'No cross-context imports', 5, noCrossContextImports);

addCheck('Observability', 'Structured logger present', 5, structuredLoggerPresent);
addCheck('Observability', 'Error telemetry configured', 5, telemetryConfigured);

addCheck('Testing Coverage', 'Unit tests exist', 5, unitTestsExist);
addCheck('Testing Coverage', 'Integration tests exist', 5, integrationTestsExist);
addCheck('Testing Coverage', 'E2E smoke tests exist', 5, e2eTestsExist);

addCheck('CI Integrity', 'CI includes typecheck/lint/test/boundary/build/governor', 10, ciIntegrityPassed);

addCheck('Dependency Hygiene', 'Lockfile present', 5, lockfilePresent);
addCheck(
  'Dependency Hygiene',
  'No deprecated or critical vulnerabilities',
  5,
  dependenciesHealthy,
  `deprecated=${String(hasDeprecatedPackages)}, criticalVulns=${String(!noCriticalVulnerabilities)}`
);

if (!clientSecretFree) {
  hardFailures.push('Client-side secret exposure detected');
}

if (!authRbacEnforced) {
  hardFailures.push('Auth/RBAC enforcement missing');
}

if (!strictEnabled || !allowJsDisabled || !skipLibCheckDisabled) {
  hardFailures.push('TypeScript strictness guard violated');
}

if (!governorConfigured) {
  hardFailures.push('Governor disabled or not enforced in CI');
}

const invariantFailure = invariantChecks.find((item) => !item.passed);
if (invariantFailure != null && hardFailures.length === 0) {
  hardFailures.push(`Invariant check failed: ${invariantFailure.name}`);
}

const maxScore = Object.values(categories).reduce((sum, category) => sum + category.max, 0);
let score = Object.values(categories).reduce((sum, category) => sum + category.score, 0);

if (hardFailures.length > 0) {
  score = 0;
}

const eligible = hardFailures.length === 0 && score >= threshold;

const breakdown: ScoreReport['breakdown'] = {
  Security: { score: categories.Security.score, max: categories.Security.max },
  'Strictness & Type Safety': {
    score: categories['Strictness & Type Safety'].score,
    max: categories['Strictness & Type Safety'].max
  },
  'Architecture Boundaries': {
    score: categories['Architecture Boundaries'].score,
    max: categories['Architecture Boundaries'].max
  },
  Observability: { score: categories.Observability.score, max: categories.Observability.max },
  'Testing Coverage': { score: categories['Testing Coverage'].score, max: categories['Testing Coverage'].max },
  'CI Integrity': { score: categories['CI Integrity'].score, max: categories['CI Integrity'].max },
  'Dependency Hygiene': {
    score: categories['Dependency Hygiene'].score,
    max: categories['Dependency Hygiene'].max
  }
};

const report: ScoreReport = {
  score,
  maxScore,
  breakdown,
  hardFailures,
  invariantChecks,
  eligibleForProduction: eligible ? 'YES' : 'NO'
};

const lines: string[] = [];
lines.push(`Production Readiness Score: ${report.score}/${report.maxScore}`);
lines.push('');
lines.push('Breakdown:');
lines.push(`Security: ${report.breakdown.Security.score}/${report.breakdown.Security.max}`);
lines.push(
  `Strictness & Type Safety: ${report.breakdown['Strictness & Type Safety'].score}/${report.breakdown['Strictness & Type Safety'].max}`
);
lines.push(
  `Architecture Boundaries: ${report.breakdown['Architecture Boundaries'].score}/${report.breakdown['Architecture Boundaries'].max}`
);
lines.push(`Observability: ${report.breakdown.Observability.score}/${report.breakdown.Observability.max}`);
lines.push(
  `Testing Coverage: ${report.breakdown['Testing Coverage'].score}/${report.breakdown['Testing Coverage'].max}`
);
lines.push(`CI Integrity: ${report.breakdown['CI Integrity'].score}/${report.breakdown['CI Integrity'].max}`);
lines.push(
  `Dependency Hygiene: ${report.breakdown['Dependency Hygiene'].score}/${report.breakdown['Dependency Hygiene'].max}`
);
lines.push('');
lines.push('Invariant Checks:');
for (const item of report.invariantChecks) {
  lines.push(`- ${item.name}: ${item.passed ? 'PASS' : 'FAIL'}`);
}
lines.push('');
lines.push('Hard Failures:');
if (report.hardFailures.length === 0) {
  lines.push('- None');
} else {
  for (const failure of report.hardFailures) {
    lines.push(`- ${failure}`);
  }
}
lines.push('');
lines.push(`Eligible for Production: ${report.eligibleForProduction}`);

const markdown = [
  '## Production Readiness Score',
  '',
  `**${report.score}/${report.maxScore}**`,
  '',
  '### Breakdown',
  `- Security: ${report.breakdown.Security.score}/${report.breakdown.Security.max}`,
  `- Strictness & Type Safety: ${report.breakdown['Strictness & Type Safety'].score}/${report.breakdown['Strictness & Type Safety'].max}`,
  `- Architecture Boundaries: ${report.breakdown['Architecture Boundaries'].score}/${report.breakdown['Architecture Boundaries'].max}`,
  `- Observability: ${report.breakdown.Observability.score}/${report.breakdown.Observability.max}`,
  `- Testing Coverage: ${report.breakdown['Testing Coverage'].score}/${report.breakdown['Testing Coverage'].max}`,
  `- CI Integrity: ${report.breakdown['CI Integrity'].score}/${report.breakdown['CI Integrity'].max}`,
  `- Dependency Hygiene: ${report.breakdown['Dependency Hygiene'].score}/${report.breakdown['Dependency Hygiene'].max}`,
  '',
  '### Invariant Checks',
  ...report.invariantChecks.map((item) => `- ${item.name}: ${item.passed ? 'PASS' : 'FAIL'}`),
  '',
  '### Hard Failures',
  ...(report.hardFailures.length > 0 ? report.hardFailures.map((item) => `- ${item}`) : ['- None']),
  '',
  `**Eligible for Production: ${report.eligibleForProduction}**`
].join('\n');

fs.writeFileSync(jsonOutputPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdOutputPath, `${markdown}\n`);
process.stdout.write(`${lines.join('\n')}\n`);

if (enforce && !eligible) {
  process.exit(1);
}
