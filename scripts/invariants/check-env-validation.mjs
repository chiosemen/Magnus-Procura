import { assertInvariant, existsPath, readText, runAsCli } from './lib.mjs';

export const checkEnvValidation = () => {
  assertInvariant(existsPath('apps/api/src/config/env.ts'), 'Missing env validation module apps/api/src/config/env.ts');

  const envFile = readText('apps/api/src/config/env.ts');
  assertInvariant(/envSchema/.test(envFile), 'env validation schema must be defined');
  assertInvariant(/parseEnv/.test(envFile), 'parseEnv function must be defined');

  const serverEntrypoint = readText('apps/api/src/index.ts');
  assertInvariant(/from '\.\/config\/env\.js'/.test(serverEntrypoint), 'server entrypoint must import validated env');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await runAsCli(checkEnvValidation, 'check-env-validation');
}
