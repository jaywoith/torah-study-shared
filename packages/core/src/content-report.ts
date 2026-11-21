/**
 * Summaries of the content library: the text versions it uses (for the
 * "Sources & licenses" screen) and a health report (npm run content:report).
 * Pure: takes the library, returns data.
 */

import { licenseStatus, requiresAttribution } from './license';
import { ContentLibrary, Provenance } from './models';

/** One text version used by the library, with what its license requires. */
export interface SourceVersion {
  language: 'hebrew' | 'english';
  versionTitle: string;
  license: string;
  /** Number of content entries using this version. */
  units: number;
  /** CC-BY family: the app must show attribution. */
  requiresAttribution: boolean;
  /** CC-BY-NC: fine only while the app is non-commercial. */
  nonCommercial: boolean;
  /** License not cleared; personal use only until reviewed (ADR-012). */
  personalUseOnly: boolean;
}

interface Entry {
  id: string;
  kind: string;
  hebrew?: string;
  transliteration?: string;
  english?: string;
  commentary?: string;
  kavannahPrompt?: string;
  verified: boolean;
  provenance?: Provenance;
}

function entries(library: ContentLibrary): Entry[] {
  return [
    ...library.studyUnits.map((u) => ({ ...u, kind: u.type })),
    ...library.siddur.flatMap((s) => s.units.map((u) => ({ ...u, kind: `siddur:${s.id}` }))),
  ];
}

/** Every version used, sorted by language then title. */
export function summarizeSources(library: ContentLibrary): SourceVersion[] {
  const byKey = new Map<string, SourceVersion>();
  for (const e of entries(library)) {
    const p = e.provenance;
    if (!p) continue;
    for (const language of ['hebrew', 'english'] as const) {
      const v = p[language];
      if (!v) continue;
      const key = `${language}|${v.versionTitle}`;
      const status = licenseStatus(v.license, { personalUseOnly: p.personalUseOnly });
      const existing = byKey.get(key);
      if (existing) {
        existing.units++;
        continue;
      }
      byKey.set(key, {
        language,
        versionTitle: v.versionTitle,
        license: v.license,
        units: 1,
        requiresAttribution: requiresAttribution(v.license),
        nonCommercial: status === 'non_commercial',
        personalUseOnly: status === 'personal_use_only',
      });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.language.localeCompare(b.language) || a.versionTitle.localeCompare(b.versionTitle),
  );
}

export interface ContentReport {
  totals: { entries: number; imported: number; handWritten: number; verified: number; unverified: number };
  /** Entry counts by kind: unit type, or "siddur:<section id>". */
  byKind: Record<string, number>;
  sources: SourceVersion[];
  /** Ids of entries using a CC-BY-NC version. */
  nonCommercial: string[];
  /** Ids of entries whose license is not cleared (ADR-012). */
  personalUseOnly: string[];
  /** Ids missing each optional hand-written field. */
  missing: { transliteration: string[]; commentary: string[]; kavannahPrompt: string[]; hebrew: string[] };
}

export function buildContentReport(library: ContentLibrary): ContentReport {
  const all = entries(library);
  const byKind: Record<string, number> = {};
  for (const e of all) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
  const isNc = (p?: Provenance) =>
    !!p && [p.hebrew, p.english].some((v) => v && licenseStatus(v.license, { personalUseOnly: p.personalUseOnly }) === 'non_commercial');
  const ids = (pred: (e: Entry) => boolean) => all.filter(pred).map((e) => e.id);
  const verified = all.filter((e) => e.verified).length;
  return {
    totals: {
      entries: all.length,
      imported: all.filter((e) => e.provenance).length,
      handWritten: all.filter((e) => !e.provenance).length,
      verified,
      unverified: all.length - verified,
    },
    byKind,
    sources: summarizeSources(library),
    nonCommercial: ids((e) => isNc(e.provenance)),
    personalUseOnly: ids((e) => !!e.provenance?.personalUseOnly),
    missing: {
      hebrew: ids((e) => !e.hebrew),
      transliteration: ids((e) => !e.transliteration),
      commentary: ids((e) => !e.commentary),
      kavannahPrompt: ids((e) => !e.kavannahPrompt),
    },
  };
}
