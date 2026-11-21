import { describe, expect, it } from 'vitest';
import { STUDY_LENGTH_MINUTES, dayNumber, effectiveKabbalahDepth, generateDailyStudy } from '../src';
import { library, modelUser } from './fixtures';

const ids = (s: ReturnType<typeof generateDailyStudy>) => s.units.map((u) => u.id.slice(11)); // strip "YYYY-MM-DD-"

describe('generateDailyStudy', () => {
  it('is deterministic for the same inputs', () => {
    expect(generateDailyStudy(modelUser, '2026-11-11', library)).toEqual(
      generateDailyStudy(modelUser, '2026-11-11', library)
    );
  });

  it('rotates content by date (bug: same study every day)', () => {
    const a = ids(generateDailyStudy(modelUser, '2026-11-11', library));
    const b = ids(generateDailyStudy(modelUser, '2026-11-12', library));
    expect(a).not.toEqual(b);
  });

  it('cycles through the whole tanakh pool over consecutive days', () => {
    const seen = new Set<string>();
    for (const date of ['2026-11-11', '2026-11-12', '2026-11-13']) {
      const study = generateDailyStudy(modelUser, date, library);
      seen.add(study.units.find((u) => u.type === 'tanakh')!.id.slice(11));
    }
    expect(seen).toEqual(new Set(['tanakh-a', 'tanakh-b', 'tanakh-c']));
  });

  it('always includes a tanakh unit, last', () => {
    const study = generateDailyStudy(modelUser, '2026-11-11', library);
    expect(study.units.at(-1)!.type).toBe('tanakh');
  });

  it('prefixes unit ids with the date', () => {
    const study = generateDailyStudy(modelUser, '2026-11-11', library);
    for (const u of study.units) expect(u.id.startsWith('2026-11-11-')).toBe(true);
  });

  it.each(['short', 'medium', 'long'] as const)('respects the %s minute budget (bug: studyLength ignored)', (len) => {
    const study = generateDailyStudy({ ...modelUser, studyLength: len }, '2026-11-11', library);
    expect(study.budgetMinutes).toBe(STUDY_LENGTH_MINUTES[len]);
    expect(study.totalEstimatedMinutes).toBeLessThanOrEqual(STUDY_LENGTH_MINUTES[len]);
  });

  it('gives longer sessions more units', () => {
    const short = generateDailyStudy({ ...modelUser, studyLength: 'short' }, '2026-11-11', library);
    const long = generateDailyStudy({ ...modelUser, studyLength: 'long' }, '2026-11-11', library);
    expect(long.units.length).toBeGreaterThan(short.units.length);
  });

  it('only includes units allowed for the level (bug: level ignored)', () => {
    const inter = ids(generateDailyStudy({ ...modelUser, studyLength: 'long' }, '2026-11-11', library));
    expect(inter).not.toContain('musar-advanced-only');
    const all = new Set<string>();
    for (let d = 11; d < 20; d++) {
      ids(generateDailyStudy({ ...modelUser, level: 'advanced', studyLength: 'long' }, `2026-11-${d}`, library)).forEach(
        (i) => all.add(i)
      );
    }
    expect(all).toContain('musar-advanced-only');
  });

  it('excludes units restricted to other frameworks', () => {
    for (let d = 11; d < 20; d++) {
      const study = generateDailyStudy({ ...modelUser, studyLength: 'long' }, `2026-11-${d}`, library);
      expect(ids(study)).not.toContain('musar-reform-only');
    }
  });

  it('skips categories the user is not interested in', () => {
    const study = generateDailyStudy({ ...modelUser, interests: ['musar'] }, '2026-11-11', library);
    expect(new Set(study.units.map((u) => u.type))).toEqual(new Set(['musar', 'tanakh']));
  });

  it('draws siddur units from the siddur path', () => {
    const study = generateDailyStudy({ ...modelUser, interests: ['siddur'] }, '2026-11-11', library);
    const siddur = study.units.find((u) => u.type === 'siddur')!;
    expect(['pd-1', 'pd-2', 'shema-1']).toContain(siddur.id.slice(11));
    expect(siddur.source).toBe('Siddur, Pesukei Dezimra');
  });

  it('does not leak selection metadata or review notes to clients', () => {
    const study = generateDailyStudy(modelUser, '2026-11-11', library);
    for (const u of study.units) {
      expect(u).not.toHaveProperty('reviewNote');
      expect(u).not.toHaveProperty('minLevel');
      expect(u).not.toHaveProperty('interests');
    }
  });

  it('tells clients whether each unit is verified (for the draft label)', () => {
    const study = generateDailyStudy(modelUser, '2026-11-11', library);
    for (const u of study.units) expect(typeof u.verified).toBe('boolean');
  });

  it('includes the language display contract', () => {
    const study = generateDailyStudy({ ...modelUser, languageMode: 'split' }, '2026-11-11', library);
    expect(study.display.layout).toBe('side-by-side');
  });
});

describe('Kabbalah depth (bug: Hasidic users got no Kabbalah)', () => {
  const kabbalahFor = (framework: typeof modelUser.framework, level: typeof modelUser.level) => {
    const found = new Set<string>();
    for (let d = 11; d < 20; d++) {
      const study = generateDailyStudy(
        { ...modelUser, framework, level, interests: ['kabbalah'], studyLength: 'long' },
        `2026-11-${d}`,
        library
      );
      study.units.filter((u) => u.type === 'kabbalah').forEach((u) => found.add(u.id.slice(11)));
    }
    return found;
  };

  it('Hasidic users who want Kabbalah receive it', () => {
    expect(kabbalahFor('hasidic', 'intermediate').size).toBeGreaterThan(0);
  });

  it('Hasidic advanced users can reach advanced material', () => {
    expect(kabbalahFor('hasidic', 'advanced')).toContain('kabbalah-advanced');
  });

  it('Conservative users stay symbolic at any level', () => {
    expect(kabbalahFor('masorti_conservative', 'scholar')).toEqual(new Set(['kabbalah-symbolic']));
  });

  it('beginners stay symbolic even in Hasidic framework', () => {
    expect(effectiveKabbalahDepth({ framework: 'hasidic', level: 'beginner' })).toBe('symbolic');
  });
});

describe('dayNumber', () => {
  it('counts days from the epoch', () => {
    expect(dayNumber('1970-01-02')).toBe(1);
    expect(dayNumber('2026-11-12') - dayNumber('2026-11-11')).toBe(1);
  });
  it('rejects malformed dates', () => {
    expect(() => dayNumber('11/11/2026')).toThrow();
  });
});
