import { assertInvariant, readText, runAsCli } from './lib.mjs';

export const checkNoCdn = () => {
  const indexHtml = readText('apps/web/index.html');

  assertInvariant(
    !/cdn\.tailwindcss\.com/i.test(indexHtml),
    'apps/web/index.html must not reference cdn.tailwindcss.com'
  );
  assertInvariant(!/esm\.sh/i.test(indexHtml), 'apps/web/index.html must not reference esm.sh');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await runAsCli(checkNoCdn, 'check-no-cdn');
}
