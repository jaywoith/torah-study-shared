/**
 * Merging imported text into content entries (ADR-010). Pure.
 *
 * The import owns: hebrew, english, source, provenance.
 * Everything else (commentary, kavannah, review items, selection metadata,
 * transliteration) is hand-written and preserved, unless the manifest entry
 * lists a field under `remove` and the text changed (e.g. a transliteration that
 * no longer matches).
 *
 * Entries marked `verified: true` are never changed without `force`; a forced
 * change resets `verified` to false so the owner re-reviews it.
 */

import type { Provenance } from '@torah/core';

export interface ImportedText {
  hebrew?: string;
  english?: string;
  source: string;
  provenance: Omit<Provenance, 'importedAt'>;
}

export type MergeStatus = 'created' | 'updated' | 'unchanged' | 'skipped_verified';

export interface MergeResult<T> {
  entry: T;
  status: MergeStatus;
  /** Fields whose value changed. */
  changed: string[];
}

type Entry = Record<string, unknown> & { id: string; verified?: boolean };

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Provenance without importedAt, for change detection. */
function provenanceKey(p: unknown): unknown {
  if (!p || typeof p !== 'object') return p;
  const { importedAt, ...rest } = p as Provenance;
  return rest;
}

export function mergeImported<T extends Entry>(
  existing: T | undefined,
  imported: ImportedText,
  opts: { id: string; defaults: Record<string, unknown>; remove?: string[]; now: string; force?: boolean },
): MergeResult<T> {
  const owned = {
    ...(imported.hebrew !== undefined ? { hebrew: imported.hebrew } : {}),
    ...(imported.english !== undefined ? { english: imported.english } : {}),
    source: imported.source,
  };

  if (!existing) {
    const entry = {
      id: opts.id,
      ...opts.defaults,
      ...owned,
      provenance: { ...imported.provenance, importedAt: opts.now },
      verified: false,
    } as unknown as T;
    return { entry, status: 'created', changed: Object.keys(owned) };
  }

  const changed: string[] = [];
  for (const [k, v] of Object.entries(owned)) if (!sameJson(existing[k], v)) changed.push(k);
  if (!sameJson(provenanceKey(existing.provenance), provenanceKey(imported.provenance))) changed.push('provenance');
  // `remove` lists hand-written fields that the new text invalidates, so it applies
  // only when the Hebrew or English actually changes (keeps re-runs idempotent).
  const textChanged = changed.includes('hebrew') || changed.includes('english');
  const toRemove = textChanged ? (opts.remove ?? []).filter((k) => k in existing) : [];
  changed.push(...toRemove);

  if (changed.length === 0) return { entry: existing, status: 'unchanged', changed };
  if (existing.verified === true && !opts.force) return { entry: existing, status: 'skipped_verified', changed };

  const entry: Entry = { ...existing, ...owned, provenance: { ...imported.provenance, importedAt: opts.now } };
  for (const k of toRemove) delete entry[k];
  if (existing.verified === true) entry.verified = false;
  // Keep `verified` / `reviewNote` at the end, as hand-written entries do.
  const { verified, reviewNote, ...rest } = entry;
  const ordered = { ...rest, verified: verified ?? false, ...(reviewNote !== undefined ? { reviewNote } : {}) };
  return { entry: ordered as unknown as T, status: 'updated', changed };
}

/** https://www.sefaria.org/Psalms.145.9 style URL for a ref. */
export function sefariaUrl(ref: string, base = 'https://www.sefaria.org'): string {
  // Simple refs ("Psalms 145:9") use dots; complex ones ("Siddur Ashkenaz, …, Psalm 146")
  // keep their node titles and only swap spaces for underscores.
  const simple = !ref.includes(',');
  const path = (simple ? ref.replace(/ (?=\d)/g, '.') : ref).replace(/:/g, '.').replace(/ /g, '_');
  return `${base}/${encodeURI(path).replace(/'/g, '%27')}`;
}

/** Rough reading time: Hebrew + English words at a study pace, 3–12 minutes. */
export function estimateMinutes(hebrew = '', english = ''): number {
  const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
  const minutes = Math.round(2 + words(hebrew) / 30 + words(english) / 60);
  return Math.min(12, Math.max(3, minutes));
}
