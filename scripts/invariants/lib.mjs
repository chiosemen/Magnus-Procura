import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

const resolveFromRoot = (filePath) => {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(rootDir, filePath);
};

export const readText = (filePath) => fs.readFileSync(resolveFromRoot(filePath), 'utf8');
export const existsPath = (filePath) => fs.existsSync(resolveFromRoot(filePath));

export const assertInvariant = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

export const walkFiles = (rootPath, extensions) => {
  const files = [];
  const absoluteRoot = resolveFromRoot(rootPath);

  const visit = (currentPath) => {
    const stat = fs.statSync(currentPath);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(currentPath);
      for (const entry of entries) {
        visit(path.join(currentPath, entry));
      }
      return;
    }

    if (extensions.some((ext) => currentPath.endsWith(ext))) {
      files.push(path.relative(rootDir, currentPath));
    }
  };

  visit(absoluteRoot);
  return files;
};

export const runAsCli = async (checkFn, name) => {
  try {
    await checkFn();
    process.stdout.write(`${name}: PASS\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invariant failed';
    process.stderr.write(`${name}: FAIL - ${message}\n`);
    process.exitCode = 1;
  }
};
