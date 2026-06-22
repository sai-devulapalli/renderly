#!/usr/bin/env node
/**
 * Enforces the publishability invariant from ADR-0003:
 *   - The monorepo root and @renderly/example must have "private": true.
 *   - All other packages must NOT have "private": true.
 *
 * Run via: pnpm check:publishability
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../');

const MUST_BE_PRIVATE = new Set(['renderly', '@renderly/example']);

const packages = [
  { path: ROOT, label: 'root' },
  ...readdirSync(join(ROOT, 'packages')).map((dir) => ({
    path: join(ROOT, 'packages', dir),
    label: dir,
  })),
];

let failures = 0;

for (const { path, label } of packages) {
  const pkgPath = join(path, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    console.error(`  SKIP  ${label} — could not read package.json`);
    continue;
  }

  const { name, private: isPrivate } = pkg;
  const shouldBePrivate = MUST_BE_PRIVATE.has(name);

  if (shouldBePrivate && isPrivate !== true) {
    console.error(`  FAIL  ${name} must be "private": true (it is the integration layer / monorepo root)`);
    failures++;
  } else if (!shouldBePrivate && isPrivate === true) {
    console.error(`  FAIL  ${name} must NOT be "private": true — remove "private" before publishing`);
    failures++;
  } else {
    const status = isPrivate ? 'private (correct)' : 'publishable (correct)';
    console.log(`  OK    ${name ?? label} — ${status}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} publishability violation(s) found.`);
  process.exit(1);
} else {
  console.log('\nAll publishability checks passed.');
}
