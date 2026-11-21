import { describe, expect, it } from 'vitest';
import { DailyStudy, StudyUnit, generateDailyStudy, isUnpointedHebrew, validateDailyStudy } from '../src';
import { library, modelUser } from './fixtures';

function study(units: Partial<StudyUnit>[], overrides: Partial<DailyStudy> = {}): DailyStudy {
  const base = generateDailyStudy(modelUser, '2026-11-11', library);
  return {
    ...base,
    units: units.map((u, i) => ({ id: `u${i}`, type: 'musar', english: 'text', source: 'src', ...u }) as StudyUnit),
    totalEstimatedMinutes: 5,
    ...overrides,
  };
}

describe('validateDailyStudy', () => {
  it('passes generated studies', () => {
    expect(validateDailyStudy(generateDailyStudy(modelUser, '2026-11-11', library))).toEqual({ valid: true, issues: [] });
  });

  it('flags unpointed Hebrew', () => {
    const r = validateDailyStudy(study([{ hebrew: 'ברוך' }]));
    expect(r.issues.join()).toMatch(/unpointed Hebrew/);
  });

  it('flags missing sources above beginner', () => {
    expect(validateDailyStudy(study([{ source: undefined }])).valid).toBe(false);
    expect(
      validateDailyStudy(study([{ source: undefined }], { profile: { ...modelUser, level: 'beginner' } })).valid
    ).toBe(true);
  });

  it('flags units with no text', () => {
    expect(validateDailyStudy(study([{ english: undefined }])).issues.join()).toMatch(/no Hebrew or English/);
  });

  it('flags duplicate ids', () => {
    expect(validateDailyStudy(study([{ id: 'x' }, { id: 'x' }])).issues.join()).toMatch(/Duplicate/);
  });

  it('flags going over budget', () => {
    expect(validateDailyStudy(study([{}, {}], { totalEstimatedMinutes: 99, budgetMinutes: 20 })).valid).toBe(false);
  });

  it('applies progressive-default markers to every traditional framework (bug: only 2 of 4)', () => {
    for (const framework of ['masorti_conservative', 'orthodox', 'modern_orthodox', 'hasidic'] as const) {
      const s = study([{ commentary: 'A purely progressive reading.' }], { profile: { ...modelUser, framework } });
      expect(validateDailyStudy(s).valid).toBe(false);
    }
  });

  it('does not apply those markers to Reform', () => {
    const s = study([{ commentary: 'A purely progressive reading.' }], { profile: { ...modelUser, framework: 'reform' } });
    expect(validateDailyStudy(s).valid).toBe(true);
  });

  it('does not flag legitimate phrases like "not binding" (bug: false positive)', () => {
    const s = study([{ commentary: 'This custom is not binding on travelers.' }]);
    expect(validateDailyStudy(s).valid).toBe(true);
  });
});

describe('isUnpointedHebrew', () => {
  it('detects missing nikkud', () => {
    expect(isUnpointedHebrew('ברוך')).toBe(true);
    expect(isUnpointedHebrew('בָּרוּךְ')).toBe(false);
    expect(isUnpointedHebrew('English only')).toBe(false);
  });
});
