/**
 * Content integrity tests. Every JSON content entry must pass these.
 * Rules are documented in docs/CONTENT.md.
 */
import { describe, expect, it } from 'vitest';
import {
  FRAMEWORK_IDS,
  INTERESTS,
  KABBALAH_DEPTHS,
  LEARNING_LEVELS,
  generateDailyStudy,
  getSiddurSequence,
  isUnpointedHebrew,
  validateDailyStudy,
} from '@torah/core';
import { contentLibrary, siddurSections, studyUnits, uiStrings } from '../src';

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
    for (const field of ['hebrew', 'transliteration', 'english', 'commentary', 'kavannahPrompt'] as const) {
      expect(u[field], field).toBeTruthy();
    }
    expect(isUnpointedHebrew(u.hebrew)).toBe(false);
    expect(typeof u.verified).toBe('boolean');
    const section = siddurSections.find((s) => s.units.includes(u))!;
    expect(u.section).toBe(section.name);
  });
});

describe('generated studies from real content', () => {
  it('validate for every framework × level × length × language mode', () => {
    for (const framework of FRAMEWORK_IDS)
      for (const level of LEARNING_LEVELS)
        for (const studyLength of ['short', 'medium', 'long'] as const)
          for (const languageMode of ['english', 'hebrew', 'split', 'mixed'] as const) {
            const study = generateDailyStudy(
              { framework, level, studyLength, languageMode, interests: [...INTERESTS] },
              '2026-11-11',
              contentLibrary
            );
            const result = validateDailyStudy(study);
            expect(result.issues, `${framework}/${level}/${studyLength}/${languageMode}`).toEqual([]);
          }
  });
});

describe('ui strings', () => {
  it('has a version and no empty labels', () => {
    expect(uiStrings.meta.version).toMatch(/^\d+\.\d+\.\d+$/);
    for (const group of [uiStrings.common, uiStrings.study, uiStrings.coach]) {
      for (const value of Object.values(group)) expect(value.trim()).not.toBe('');
    }
  });
});
