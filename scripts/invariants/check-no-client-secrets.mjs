import { assertInvariant, existsPath, readText, runAsCli, walkFiles } from './lib.mjs';

const clientFiles = [
  'apps/web/src/App.tsx',
  'apps/web/src/index.tsx',
  ...walkFiles('apps/web/src/components', ['.ts', '.tsx']),
  ...walkFiles('apps/web/src/services', ['.ts', '.tsx'])
];

export const checkNoClientSecrets = () => {
  for (const file of clientFiles) {
    const content = readText(file);
    assertInvariant(!/GEMINI_API_KEY/.test(content), `Client file contains GEMINI_API_KEY reference: ${file}`);
    assertInvariant(!/process\.env\./.test(content), `Client file contains process.env reference: ${file}`);
    assertInvariant(!/@google\/genai/.test(content), `Client file imports provider SDK directly: ${file}`);
  }

  assertInvariant(
    existsPath('apps/web/dist'),
    'apps/web/dist directory missing. Run build before invariant checks.'
  );

  const bundleFiles = walkFiles('apps/web/dist', ['.js', '.html', '.css']);
  for (const file of bundleFiles) {
    const content = readText(file);
    assertInvariant(!/GEMINI_API_KEY/.test(content), `Client bundle leaked GEMINI_API_KEY string: ${file}`);
    assertInvariant(!/process\.env\./.test(content), `Client bundle leaked process.env reference: ${file}`);
    assertInvariant(!/AIza[0-9A-Za-z\-_]{20,}/.test(content), `Client bundle appears to contain provider key material: ${file}`);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await runAsCli(checkNoClientSecrets, 'check-no-client-secrets');
}
