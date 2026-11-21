/**
 * Content integrity tests. Every JSON content entry must pass these.
 * Rules are documented in docs/CONTENT.md.
 */
import { describe, expect, it } from 'vitest';
import {
  DIVINE_NAME_MODES,
  FRAMEWORK_IDS,
  INTERESTS,
  KABBALAH_DEPTHS,
  LANGUAGE_MODES,
  STUDY_LENGTHS,
  LEARNING_LEVELS,
  generateDailyStudy,
  getSiddurSequence,
  hasCantillation,
  isUnpointedHebrew,
  validateDailyStudy,
} from '@torah/core';
import { contentLibrary, siddurSections, studyUnits, uiStrings } from '../src';
import { licenseStatus } from '@torah/core';

const UNIT_TYPES = ['tanakh', 'midrash', 'musar', 'siddur', 'kabbalah', 'halachah', 'commentary'];

describe('study units', () => {
  it('have unique ids', () => {
    const ids = studyUnits.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(studyUnits.map((u) => [u.id, u] as const))('%s is well-formed', (_id, u) => {
    expect(UNIT_TYPES).toContain(u.type);
    expect(u.type).not.toBe('siddur'); // Siddur content belongs in siddur.json
    expect(u.english || u.hebrew).toBeTruthy();
    expect(u.source).toBeTruthy();
    expect(u.estimatedMinutes).toBeGreaterThan(0);
    expect(typeof u.verified).toBe('boolean');
    expect(LEARNING_LEVELS).toContain(u.minLevel);
    for (const i of u.interests) expect(INTERESTS).toContain(i);
    for (const f of u.frameworks ?? []) expect(FRAMEWORK_IDS).toContain(f);
    if (u.depth) expect(KABBALAH_DEPTHS).toContain(u.depth);
    if (u.hebrew) expect(isUnpointedHebrew(u.hebrew)).toBe(false);
  });

  it('include at least one tanakh unit (the daily anchor)', () => {
    expect(studyUnits.some((u) => u.type === 'tanakh')).toBe(true);
  });
});

describe('siddur', () => {
  const sequence = getSiddurSequence(siddurSections);

  it('has unique section orders and unit ids', () => {
    const orders = siddurSections.map((s) => s.order);
    expect(new Set(orders).size).toBe(orders.length);
    expect(new Set(sequence.map((u) => u.id)).size).toBe(sequence.length);
  });

  it.each(sequence.map((u) => [u.id, u] as const))('%s is well-formed', (_id, u) => {
    for (const field of ['hebrew', 'english'] as const) expect(u[field], field).toBeTruthy();
    // Hand-written units carry commentary and kavannah. Imported units may not yet:
    // those are drafted and owner-reviewed separately (plan v0.5.0).
    if (!u.provenance) {
      for (const field of ['transliteration', 'commentary', 'kavannahPrompt'] as const) expect(u[field], field).toBeTruthy();
    }
    expect(isUnpointedHebrew(u.hebrew)).toBe(false);
    expect(typeof u.verified).toBe('boolean');
    const section = siddurSections.find((s) => s.units.includes(u))!;
    expect(u.section).toBe(section.name);
  });
});

describe('generated studies from real content', () => {
  it('validate for every framework × level × length × language mode × display setting', () => {
    for (const framework of FRAMEWORK_IDS)
      for (const level of LEARNING_LEVELS)
        for (const studyLength of ['short', 'medium', 'long'] as const)
          for (const languageMode of ['english', 'hebrew', 'split', 'mixed'] as const)
            for (const divineName of DIVINE_NAME_MODES)
              for (const showCantillation of [false, true]) {
                const study = generateDailyStudy(
                  { framework, level, studyLength, languageMode, divineName, showCantillation, interests: [...INTERESTS] },
                  '2026-11-11',
                  contentLibrary
                );
                const result = validateDailyStudy(study);
                const label = `${framework}/${level}/${studyLength}/${languageMode}/${divineName}/${showCantillation}`;
                expect(result.issues, label).toEqual([]);
              }
  });
});

describe('ui strings', () => {
  it('has a version and no empty labels', () => {
    expect(uiStrings.meta.version).toMatch(/^\d+\.\d+\.\d+/);
    const check = (node: unknown): void => {
      if (typeof node === 'string') expect(node.trim()).not.toBe('');
      else if (node && typeof node === 'object') Object.values(node).forEach(check);
    };
    check(uiStrings);
  });

  it('labels every interest, study length, language mode and unit type', () => {
    expect(Object.keys(uiStrings.options.interests).sort()).toEqual([...INTERESTS].sort());
    expect(Object.keys(uiStrings.options.studyLengths).sort()).toEqual([...STUDY_LENGTHS].sort());
    expect(Object.keys(uiStrings.options.languageModes).sort()).toEqual([...LANGUAGE_MODES].sort());
    expect(Object.keys(uiStrings.options.divineNames).sort()).toEqual([...DIVINE_NAME_MODES].sort());
    expect(Object.keys(uiStrings.options.unitTypes).sort()).toEqual([...UNIT_TYPES].sort());
  });
});

describe('imported content provenance (ADR-010, ADR-012)', () => {
  const all = [
    ...studyUnits.map((u) => ({ id: u.id, hebrew: u.hebrew, english: u.english, provenance: u.provenance })),
    ...siddurSections.flatMap((s) =>
      s.units.map((u) => ({ id: u.id, hebrew: u.hebrew as string | undefined, english: u.english as string | undefined, provenance: u.provenance })),
    ),
  ];
  const imported = all.filter((u) => u.provenance);

  it('has imported entries', () => {
    expect(imported.length).toBeGreaterThan(0);
  });

  it.each(imported.map((u) => [u.id, u] as const))('%s has complete provenance and an allowed license', (_id, u) => {
    const p = u.provenance!;
    expect(p.sefariaRef).toBeTruthy();
    expect(p.sefariaUrl).toMatch(/^https:\/\/www\.sefaria\.org\//);
    expect(Number.isNaN(Date.parse(p.importedAt))).toBe(false);
    expect(p.hebrew || p.english).toBeTruthy();
    for (const [lang, v] of [['hebrew', p.hebrew], ['english', p.english]] as const) {
      if (!v) continue;
      expect(v.versionTitle, lang).toBeTruthy();
      const status = licenseStatus(v.license, { personalUseOnly: p.personalUseOnly });
      expect(status, `${lang} license ${v.license}`).not.toBe('rejected');
      if (status === 'personal_use_only') expect(p.personalUseOnly).toBe(true);
    }
    if (p.hebrew) expect(u.hebrew, 'hebrew text').toBeTruthy();
    if (p.english) expect(u.english, 'english text').toBeTruthy();
  });

  it.each(all.map((u) => [u.id, u] as const))('%s has no HTML or entities left', (_id, u) => {
    for (const text of [u.hebrew, u.english]) {
      if (!text) continue;
      expect(text).not.toMatch(/<\/?[a-z][^>]*>/i);
      expect(text).not.toMatch(/&[a-z]+;|&#\d+;/i);
      expect(text).not.toMatch(/\{[פס]\}/);
      expect(text).toBe(text.trim());
      expect(text).not.toMatch(/\s{2,}/);
    }
  });

  it('te\'amim appear only in imported text (hand-written entries never add them)', () => {
    for (const u of all.filter((x) => !x.provenance)) {
      if (u.hebrew) expect(hasCantillation(u.hebrew), u.id).toBe(false);
    }
  });

  it('Tanakh imports keep their te\'amim (the cantillation toggle has something to show)', () => {
    const tanakh = studyUnits.filter((u) => u.type === 'tanakh' && u.provenance?.hebrew?.versionTitle === 'Miqra according to the Masorah');
    expect(tanakh.length).toBeGreaterThan(0);
    for (const u of tanakh) expect(hasCantillation(u.hebrew!), u.id).toBe(true);
  });

  it('the Tanakh pool is large enough for two months without repeats', () => {
    expect(studyUnits.filter((u) => u.type === 'tanakh').length).toBeGreaterThanOrEqual(60);
  });
});
