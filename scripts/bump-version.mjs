#!/usr/bin/env node
/**
 * Bumps the single project version everywhere it appears.
 *
 *   npm run version:bump -- patch     0.2.0 -> 0.2.1
 *   npm run version:bump -- minor     0.2.0 -> 0.3.0
 *   npm run version:bump -- major     0.2.0 -> 1.0.0
 *   npm run version:bump -- 0.3.0-rc.1
 *
 * Updates: root package.json, every workspace package.json,
 * packages/content/data/ui-strings.json (meta.version), and adds an empty
 * section to CHANGELOG.md. Does not commit or tag (see docs/VERSIONING.md).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf-8'));
const writeJson = (p, data) => writeFileSync(join(root, p), JSON.stringify(data, null, 2) + '\n');

const rootPkg = readJson('package.json');
const current = rootPkg.version;
const arg = process.argv[2];
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/;

function next(version, kind) {
  const [, ma, mi, pa, pre] = SEMVER.exec(version).map((x, i) => (i > 0 && i < 4 ? Number(x) : x));
  if (kind === 'major') return `${ma + 1}.0.0`;
  if (kind === 'minor') return `${ma}.${mi + 1}.0`;
  if (kind === 'patch') return pre ? `${ma}.${mi}.${pa}` : `${ma}.${mi}.${pa + 1}`;
  throw new Error(kind);
}

let target;
if (['major', 'minor', 'patch'].includes(arg)) target = next(current, arg);
else if (arg && SEMVER.test(arg)) target = arg;
else {
  console.error('Usage: npm run version:bump -- <major|minor|patch|x.y.z[-pre]>');
  process.exit(1);
}

const files = ['package.json', ...rootPkg.workspaces.map((w) => `${w}/package.json`)];
for (const f of files) {
  const pkg = readJson(f);
  pkg.version = target;
  writeJson(f, pkg);
}

const uiPath = 'packages/content/data/ui-strings.json';
const ui = readJson(uiPath);
ui.meta.version = target;
writeJson(uiPath, ui);

const changelogPath = join(root, 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf-8');
const today = new Date().toISOString().slice(0, 10);
const marker = '## [Unreleased]';
if (changelog.includes(marker)) {
  writeFileSync(changelogPath, changelog.replace(marker, `${marker}\n\n## [${target}] – ${today}`));
}

console.log(`${current} -> ${target}`);
console.log('Next: move Unreleased notes under the new heading in CHANGELOG.md, run `npm run check`, then commit and tag (docs/VERSIONING.md).');
