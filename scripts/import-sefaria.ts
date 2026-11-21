/**
 * Build-time Sefaria import (ADR-010). The app never calls Sefaria at runtime.
 *
 *   npm run content:import                 # import everything in the manifest
 *   npm run content:import -- --dry-run    # show what would change, write nothing
 *   npm run content:import -- --only=tanakh-tehillim   # ids starting with a prefix
 *   npm run content:import -- --force      # also update entries marked verified: true
 *   npm run content:import -- --refresh    # ignore the local response cache (.cache/sefaria)
 *
 * Reads packages/content/sefaria-manifest.json, fetches each ref in the chosen
 * versions, sanitizes (HTML out, whitespace normalized, te'amim kept), checks the
 * license policy, and merges into packages/content/data/*.json. Idempotent: a
 * second run with no upstream changes writes nothing.
 *
 * Fetch source: SEFARIA_BASE_URL (default https://www.sefaria.org). Point it at the
 * planned mirror later; anything serving /api/v3/texts works. For other sources,
 * implement TextSource.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentUnit, SiddurSection, SiddurUnit } from '@torah/core';
import { licenseStatus, normalizeLicense } from '../packages/content/src/sefaria/license';
import { ImportedText, MergeResult, estimateMinutes, mergeImported, sefariaUrl } from '../packages/content/src/sefaria/merge';
import { sanitizeText } from '../packages/content/src/sefaria/sanitize';

// ---------- manifest ----------

interface VersionSet {
  hebrew?: string;
  english?: string;
}

interface ManifestEntry {
  id: string;
  ref: string;
  versions: string;
  /** Overrides the citation shown to users (default: Sefaria's ref). */
  source?: string;
  /** Fields used only when creating the entry. */
  defaults?: Record<string, unknown>;
  /** Hand-written fields to delete because they no longer match the imported text. */
  remove?: string[];
  /** Allow a version whose license is not cleared, for personal use only (ADR-012). */
  personalUseOnly?: boolean;
}

interface Manifest {
  versionSets: Record<string, VersionSet>;
  studyUnits: ManifestEntry[];
  siddur: (ManifestEntry & { section: string })[];
}

// ---------- fetch source (pluggable) ----------

export interface FetchedVersion {
  language: string;
  versionTitle: string;
  license: string;
  text: unknown;
}

export interface FetchedText {
  ref: string;
  versions: FetchedVersion[];
}

export interface TextSource {
  fetch(ref: string, versions: { language: 'hebrew' | 'english'; title: string }[]): Promise<FetchedText>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Public Sefaria API (or a mirror serving the same /api/v3/texts). Throttled, retries 429/5xx. */
export class SefariaApiSource implements TextSource {
  private last = 0;
  constructor(
    private base = process.env.SEFARIA_BASE_URL ?? 'https://www.sefaria.org',
    private minIntervalMs = Number(process.env.SEFARIA_MIN_INTERVAL_MS ?? 1500),
  ) {}

  async fetch(ref: string, versions: { language: 'hebrew' | 'english'; title: string }[]): Promise<FetchedText> {
    const query = versions.map((v) => `version=${encodeURIComponent(`${v.language}|${v.title}`)}`).join('&');
    const url = `${this.base}/api/v3/texts/${encodeURIComponent(ref)}?${query}`;
    for (let attempt = 1; ; attempt++) {
      const wait = this.last + this.minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.last = Date.now();
      const res = await fetch(url);
      if (res.ok) {
        const body = (await res.json()) as { ref: string; versions: FetchedVersion[]; warnings?: unknown[] };
        if (body.warnings?.length) throw new Error(`${ref}: ${JSON.stringify(body.warnings)}`);
        return { ref: body.ref, versions: body.versions };
      }
      const retryable = res.status === 429 || res.status >= 500;
      if (attempt >= 6 || !retryable) throw new Error(`${ref}: HTTP ${res.status}`);
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000 * attempt);
    }
  }
}

/**
 * Caches raw responses on disk (.cache/sefaria, gitignored) so re-runs and
 * sanitizer changes don't refetch. --refresh bypasses it.
 */
export class CachedSource implements TextSource {
  constructor(private inner: TextSource, private dir: string, private refresh = false) {
    mkdirSync(dir, { recursive: true });
  }

  async fetch(ref: string, versions: { language: 'hebrew' | 'english'; title: string }[]): Promise<FetchedText> {
    const key = createHash('sha256').update(JSON.stringify([ref, versions])).digest('hex').slice(0, 24);
    const file = join(this.dir, `${key}.json`);
    if (!this.refresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as FetchedText;
    const fetched = await this.inner.fetch(ref, versions);
    writeFileSync(file, JSON.stringify(fetched));
    return fetched;
  }
}

// ---------- import ----------

const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'packages/content/data');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const refresh = args.includes('--refresh');
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
const writeJson = (path: string, data: unknown) => writeFileSync(path, JSON.stringify(data, null, 2) + '\n');

async function importEntry(source: TextSource, manifest: Manifest, e: ManifestEntry): Promise<ImportedText> {
  const set = manifest.versionSets[e.versions];
  if (!set) throw new Error(`${e.id}: unknown version set "${e.versions}"`);
  const wanted = [
    ...(set.hebrew ? [{ language: 'hebrew' as const, title: set.hebrew }] : []),
    ...(set.english ? [{ language: 'english' as const, title: set.english }] : []),
  ];
  const fetched = await source.fetch(e.ref, wanted);
  const pick = (title?: string) => (title ? fetched.versions.find((v) => v.versionTitle === title) : undefined);
  const he = pick(set.hebrew);
  const en = pick(set.english);
  if (set.hebrew && !he) throw new Error(`${e.id}: Hebrew version "${set.hebrew}" missing for ${e.ref}`);
  if (set.english && !en) throw new Error(`${e.id}: English version "${set.english}" missing for ${e.ref}`);

  let personalUseOnly = false;
  for (const v of [he, en]) {
    if (!v) continue;
    const status = licenseStatus(v.license, { personalUseOnly: e.personalUseOnly });
    if (status === 'rejected') throw new Error(`${e.id}: license "${v.license}" of "${v.versionTitle}" is not allowed`);
    if (status === 'personal_use_only') personalUseOnly = true;
  }

  const hebrew = he ? sanitizeText(he.text) : undefined;
  const english = en ? sanitizeText(en.text) : undefined;
  if (he && !hebrew) throw new Error(`${e.id}: empty Hebrew after sanitizing`);
  if (en && !english) throw new Error(`${e.id}: empty English after sanitizing`);

  const info = (v?: FetchedVersion) => (v ? { versionTitle: v.versionTitle, license: normalizeLicense(v.license) } : undefined);
  return {
    hebrew,
    english,
    source: e.source ?? fetched.ref,
    provenance: {
      sefariaRef: fetched.ref,
      sefariaUrl: sefariaUrl(fetched.ref),
      ...(he ? { hebrew: info(he) } : {}),
      ...(en ? { english: info(en) } : {}),
      ...(personalUseOnly ? { personalUseOnly: true } : {}),
    },
  };
}

async function main() {
  const manifest = readJson<Manifest>(join(ROOT, 'packages/content/sefaria-manifest.json'));
  const source: TextSource = new CachedSource(new SefariaApiSource(), join(ROOT, '.cache/sefaria'), refresh);
  const now = new Date().toISOString();
  const selected = (e: ManifestEntry) => !only || e.id.startsWith(only);
  const results: { id: string; result: MergeResult<unknown> }[] = [];
  const errors: string[] = [];

  // Study units
  const studyPath = join(DATA, 'study-units.json');
  const study = readJson<{ units: ContentUnit[] }>(studyPath);
  for (const e of manifest.studyUnits.filter(selected)) {
    try {
      const imported = await importEntry(source, manifest, e);
      const idx = study.units.findIndex((u) => u.id === e.id);
      const defaults = { estimatedMinutes: estimateMinutes(imported.hebrew, imported.english), ...e.defaults };
      const result = mergeImported(idx >= 0 ? (study.units[idx] as never) : undefined, imported, {
        id: e.id,
        defaults,
        remove: e.remove,
        now,
        force,
      });
      const unit = result.entry as ContentUnit;
      if (unit.estimatedMinutes === undefined) unit.estimatedMinutes = estimateMinutes(unit.hebrew, unit.english);
      if (idx >= 0) study.units[idx] = unit;
      else study.units.push(unit);
      results.push({ id: e.id, result });
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  // Siddur: units are ordered within each section by manifest order.
  const siddurPath = join(DATA, 'siddur.json');
  const siddur = readJson<{ sections: SiddurSection[] }>(siddurPath);
  for (const e of manifest.siddur.filter(selected)) {
    const section = siddur.sections.find((s) => s.id === e.section);
    if (!section) {
      errors.push(`${e.id}: unknown Siddur section "${e.section}"`);
      continue;
    }
    try {
      const imported = await importEntry(source, manifest, e);
      const idx = section.units.findIndex((u) => u.id === e.id);
      const defaults = {
        section: section.name,
        estimatedMinutes: estimateMinutes(imported.hebrew, imported.english),
        ...e.defaults,
      };
      const result = mergeImported(idx >= 0 ? (section.units[idx] as never) : undefined, imported, {
        id: e.id,
        defaults,
        remove: e.remove,
        now,
        force,
      });
      // A removed estimate (text replaced wholesale) is recomputed from the new text.
      const unit = result.entry as SiddurUnit;
      if (unit.estimatedMinutes === undefined) unit.estimatedMinutes = estimateMinutes(unit.hebrew, unit.english);
      if (idx >= 0) section.units[idx] = unit;
      else section.units.push(unit);
      results.push({ id: e.id, result });
    } catch (err) {
      errors.push((err as Error).message);
    }
  }
  // Study units follow manifest order (the daily rotation order within a type);
  // hand-written units not in the manifest keep their place at the front.
  const studyOrder = new Map(manifest.studyUnits.map((e, i) => [e.id, i]));
  study.units.sort((a, b) => (studyOrder.get(a.id) ?? -1) - (studyOrder.get(b.id) ?? -1));

  for (const section of siddur.sections) {
    const order = manifest.siddur.filter((e) => e.section === section.id).map((e) => e.id);
    const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
    section.units.sort((a, b) => rank(a.id) - rank(b.id));
  }

  // Report
  const by = (s: string) => results.filter((r) => r.result.status === s);
  for (const r of results.filter((r) => r.result.status !== 'unchanged')) {
    console.log(`${r.result.status.padEnd(16)} ${r.id}  [${r.result.changed.join(', ')}]`);
  }
  console.log(
    `\n${by('created').length} created, ${by('updated').length} updated, ${by('unchanged').length} unchanged, ` +
      `${by('skipped_verified').length} skipped (verified; use --force), ${errors.length} errors`,
  );
  errors.forEach((e) => console.error(`ERROR ${e}`));

  const changedAny =
    results.some((r) => r.result.status === 'created' || r.result.status === 'updated') ||
    JSON.stringify(study) !== JSON.stringify(readJson(studyPath)) ||
    JSON.stringify(siddur) !== JSON.stringify(readJson(siddurPath));
  if (!dryRun && changedAny) {
    writeJson(studyPath, study);
    writeJson(siddurPath, siddur);
    console.log('Wrote study-units.json and siddur.json. Next: npm run check, then review the diff.');
  } else if (dryRun) {
    console.log('Dry run: nothing written.');
  }
  if (errors.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
