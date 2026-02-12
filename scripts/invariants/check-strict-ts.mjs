import { assertInvariant, readText, runAsCli } from './lib.mjs';

const readJson = (filePath) => JSON.parse(readText(filePath));

export const checkStrictTypescript = () => {
  const base = readJson('tsconfig.base.json');
  const app = readJson('apps/web/tsconfig.json');
  const server = readJson('apps/api/tsconfig.json');

  assertInvariant(base.compilerOptions?.strict === true, 'tsconfig.base.json must set strict=true');
  assertInvariant(app.compilerOptions?.allowJs !== true, 'apps/web/tsconfig.json must not allow JS');
  assertInvariant(server.compilerOptions?.allowJs !== true, 'apps/api/tsconfig.json must not allow JS');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await runAsCli(checkStrictTypescript, 'check-strict-ts');
}
