import { checkEnvValidation } from './check-env-validation.mjs';
import { checkNoCdn } from './check-no-cdn.mjs';
import { checkNoClientSecrets } from './check-no-client-secrets.mjs';
import { checkNoRoleToggle } from './check-no-role-toggle.mjs';
import { checkStrictTypescript } from './check-strict-ts.mjs';

const checks = [
  ['check-no-cdn', checkNoCdn],
  ['check-no-client-secrets', checkNoClientSecrets],
  ['check-no-role-toggle', checkNoRoleToggle],
  ['check-strict-ts', checkStrictTypescript],
  ['check-env-validation', checkEnvValidation]
];

let hasFailure = false;

for (const [name, check] of checks) {
  try {
    check();
    process.stdout.write(`${name}: PASS\n`);
  } catch (error) {
    hasFailure = true;
    const message = error instanceof Error ? error.message : 'Invariant failed';
    process.stderr.write(`${name}: FAIL - ${message}\n`);
  }
}

if (hasFailure) {
  process.exit(1);
}
