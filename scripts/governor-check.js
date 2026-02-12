import fs from 'node:fs';
import path from 'node:path';

const errors = [];

const fail = (message) => {
  errors.push(message);
};

const readText = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    fail(`Missing required file: ${filePath}`);
    return '';
  }
};

const readJson = (filePath) => {
  const content = readText(filePath);
  if (content.length === 0) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch {
    fail(`Invalid JSON: ${filePath}`);
    return null;
  }
};

const getAtPath = (obj, dotPath) => {
  return dotPath.split('.').reduce((acc, key) => {
    if (acc == null || typeof acc !== 'object') {
      return undefined;
    }
    return acc[key];
  }, obj);
};

const assertLockMatch = (targetName, targetObject, lockObject, prefix = '') => {
  if (lockObject == null || typeof lockObject !== 'object') {
    return;
  }

  for (const [key, expectedValue] of Object.entries(lockObject)) {
    const currentPath = prefix.length > 0 ? `${prefix}.${key}` : key;
    if (expectedValue != null && typeof expectedValue === 'object' && !Array.isArray(expectedValue)) {
      assertLockMatch(targetName, targetObject, expectedValue, currentPath);
      continue;
    }

    const actualValue = getAtPath(targetObject, currentPath);
    if (actualValue !== expectedValue) {
      fail(
        `${targetName} deviates from governance lock at "${currentPath}". Expected ${JSON.stringify(expectedValue)}, received ${JSON.stringify(actualValue)}`
      );
    }
  }
};

const walkFiles = (rootPath, extensions) => {
  if (!fs.existsSync(rootPath)) {
    return [];
  }

  const out = [];

  const walk = (currentPath) => {
    const stat = fs.statSync(currentPath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(currentPath)) {
        walk(path.join(currentPath, entry));
      }
      return;
    }

    if (extensions.some((ext) => currentPath.endsWith(ext))) {
      out.push(currentPath);
    }
  };

  walk(rootPath);
  return out;
};

const checkTypescriptStrictness = () => {
  const rootTsconfig = readJson('tsconfig.json');
  const baseTsconfig = readJson('tsconfig.base.json');
  const lock = readJson('governance/tsconfig.lock.json');

  if (rootTsconfig == null || baseTsconfig == null || lock == null) {
    return;
  }

  const strict = rootTsconfig?.compilerOptions?.strict;
  const allowJs = rootTsconfig?.compilerOptions?.allowJs;
  const skipLibCheck = rootTsconfig?.compilerOptions?.skipLibCheck;

  if (strict !== true) {
    fail('tsconfig.json must set compilerOptions.strict=true');
  }

  if (allowJs !== false) {
    fail('tsconfig.json must set compilerOptions.allowJs=false');
  }

  if (skipLibCheck !== false) {
    fail('tsconfig.json must set compilerOptions.skipLibCheck=false');
  }

  assertLockMatch('tsconfig.json', rootTsconfig, lock['tsconfig.json']);
  assertLockMatch('tsconfig.base.json', baseTsconfig, lock['tsconfig.base.json']);
};

const checkGovernanceFiles = () => {
  const requiredFiles = [
    'governance/PHASE_LOCK_GOVERNOR.md',
    'governance/BRANCH_POLICY.md',
    'governance/tsconfig.lock.json',
    'governance/dependency-rules.js'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      fail(`Missing governance control file: ${file}`);
    }
  }
};

const checkNoCdnRuntime = () => {
  const indexHtml = readText('apps/web/index.html');
  if (/cdn\.tailwindcss\.com/i.test(indexHtml)) {
    fail('apps/web/index.html must not include cdn.tailwindcss.com');
  }

  if (/esm\.sh/i.test(indexHtml)) {
    fail('apps/web/index.html must not include esm.sh');
  }
};

const checkClientSecretsAndSdk = () => {
  const clientFiles = [
    'apps/web/src/App.tsx',
    'apps/web/src/index.tsx',
    ...walkFiles('apps/web/src/components', ['.ts', '.tsx']),
    ...walkFiles('apps/web/src/services', ['.ts', '.tsx'])
  ];

  const forbiddenPatterns = [
    { pattern: /\bapiKey\b/i, description: 'apiKey token in client code' },
    { pattern: /Authorization\s*:\s*Bearer/i, description: 'Authorization Bearer header in client code' },
    { pattern: /from\s+['"]@google\/genai['"]/, description: '@google/genai import in client code' },
    { pattern: /from\s+['"]openai['"]/, description: 'openai SDK import in client code' },
    { pattern: /from\s+['"]@anthropic-ai\/sdk['"]/, description: '@anthropic-ai/sdk import in client code' }
  ];

  for (const file of clientFiles) {
    const content = readText(file);
    for (const item of forbiddenPatterns) {
      if (item.pattern.test(content)) {
        fail(`${item.description} detected in ${file}`);
      }
    }
  }
};

const checkNoRoleSwitching = () => {
  const app = readText('apps/web/src/App.tsx');
  const roleSwitchPatterns = [
    /Switch Perspective/i,
    /setUserRole\s*\(/,
    /onSelectRole\s*=/,
    /role\s*toggle/i
  ];

  for (const pattern of roleSwitchPatterns) {
    if (pattern.test(app)) {
      fail(`Role-switching logic detected in apps/web/src/App.tsx: ${pattern}`);
    }
  }
};

const checkEnvValidatorFailClosed = () => {
  const envPath = 'apps/api/src/config/env.ts';
  const envModule = readText(envPath);
  if (envModule.length === 0) {
    return;
  }

  if (!/envSchema/.test(envModule)) {
    fail('apps/api/src/config/env.ts must define envSchema');
  }

  if (!/parseEnv/.test(envModule)) {
    fail('apps/api/src/config/env.ts must define parseEnv');
  }

  if (!/export const env = parseEnv\(process\.env\)/.test(envModule)) {
    fail('apps/api/src/config/env.ts must export fail-closed parsed env');
  }

  const requiredVars = [
    'CORS_ORIGIN',
    'DATABASE_URL',
    'JWT_SECRET',
    'AUTH_SUPPLIER_USERNAME',
    'AUTH_SUPPLIER_PASSWORD_HASH',
    'AUTH_BUYER_USERNAME',
    'AUTH_BUYER_PASSWORD_HASH',
    'AUTH_ADMIN_USERNAME',
    'AUTH_ADMIN_PASSWORD_HASH',
    'GEMINI_API_KEY'
  ];

  for (const envVar of requiredVars) {
    if (!new RegExp(`\\b${envVar}\\b`).test(envModule)) {
      fail(`apps/api/src/config/env.ts must validate required env var: ${envVar}`);
    }
  }

  const serverEntry = readText('apps/api/src/index.ts');
  if (!/from '\.\/config\/env\.js'/.test(serverEntry)) {
    fail('apps/api/src/index.ts must import validated env module');
  }
};

const checkServerAuthRbac = () => {
  const authMiddleware = readText('apps/api/src/middleware/auth.ts');
  const rbacMiddleware = readText('apps/api/src/middleware/rbac.ts');
  const aiRoutes = readText('apps/api/src/routes/aiRoutes.ts');
  const agentRoutes = readText('apps/api/src/routes/agentRoutes.ts');

  if (!/export const requireAuth/.test(authMiddleware)) {
    fail('apps/api/src/middleware/auth.ts must export requireAuth');
  }

  if (!/export const requireRole/.test(rbacMiddleware)) {
    fail('apps/api/src/middleware/rbac.ts must export requireRole');
  }

  const guardedRoutes = aiRoutes.match(/aiRoutes\.(post|get)\(\s*'[^']+'\s*,\s*requireAuth\s*,\s*requireRole\(/g) ?? [];
  if (guardedRoutes.length < 4) {
    fail('apps/api/src/routes/aiRoutes.ts must enforce requireAuth + requireRole on protected routes');
  }

  if (!/agentRoutes\.post\(\s*'\/run'\s*,\s*requireAuth\s*,/g.test(agentRoutes)) {
    fail('apps/api/src/routes/agentRoutes.ts must enforce requireAuth on /api/agent/run');
  }

  if (!/agentRoutes\.post\(\s*'\/runs\/:runId\/replay'\s*,\s*requireAuth\s*,\s*requireRole\(\['ADMIN'\]\)\s*,/g.test(agentRoutes)) {
    fail('apps/api/src/routes/agentRoutes.ts must enforce requireAuth + requireRole([ADMIN]) on replay');
  }
};

const checkCiEnforcement = () => {
  const packageJson = readJson('package.json');
  if (packageJson == null) {
    return;
  }

  if (packageJson.scripts?.governor !== 'node scripts/governor-check.js') {
    fail('package.json scripts.governor must be "node scripts/governor-check.js"');
  }

  if (packageJson.scripts?.['boundary:check'] !== 'depcruise --config governance/dependency-rules.js .') {
    fail(
      'package.json scripts.boundary:check must be "depcruise --config governance/dependency-rules.js ."'
    );
  }

  if (typeof packageJson.scripts?.['invariant:ci'] !== 'string') {
    fail('package.json must keep scripts.invariant:ci configured');
  }

  const ci = readText('.github/workflows/ci.yml');
  if (ci.length === 0) {
    return;
  }

  const ordered = [
    'run: pnpm install --frozen-lockfile',
    'run: pnpm typecheck',
    'run: pnpm lint',
    'run: pnpm boundary:check',
    'run: pnpm governor',
    'run: pnpm test',
    'run: pnpm build'
  ];

  let lastIndex = -1;
  for (const marker of ordered) {
    const index = ci.indexOf(marker);
    if (index === -1) {
      fail(`CI workflow is missing required step: ${marker}`);
      continue;
    }
    if (index < lastIndex) {
      fail(`CI workflow step order violation around: ${marker}`);
    }
    lastIndex = index;
  }

  if (!ci.includes('run: pnpm governor')) {
    fail('CI workflow must run governor');
  }
};

const run = () => {
  checkGovernanceFiles();
  checkTypescriptStrictness();
  checkNoCdnRuntime();
  checkClientSecretsAndSdk();
  checkNoRoleSwitching();
  checkEnvValidatorFailClosed();
  checkServerAuthRbac();
  checkCiEnforcement();

  if (errors.length > 0) {
    for (const error of errors) {
      process.stderr.write(`[governor] ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('Phase Lock Governor: PASS\n');
};

run();
