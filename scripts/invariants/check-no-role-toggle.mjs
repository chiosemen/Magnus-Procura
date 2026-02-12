import { assertInvariant, readText, runAsCli, walkFiles } from './lib.mjs';

export const checkNoRoleToggle = () => {
  const files = ['apps/web/src/App.tsx', ...walkFiles('apps/web/src/components', ['.ts', '.tsx'])];

  const forbiddenPatterns = [
    /Switch Perspective/i,
    /setUserRole\s*\(/,
    /onSelectRole\s*=/,
    /role\s*toggle/i
  ];

  for (const file of files) {
    const content = readText(file);
    for (const pattern of forbiddenPatterns) {
      assertInvariant(!pattern.test(content), `Client-side role toggle pattern detected in ${file}: ${pattern}`);
    }
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await runAsCli(checkNoRoleToggle, 'check-no-role-toggle');
}
