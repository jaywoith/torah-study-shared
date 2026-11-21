import { describe, expect, it } from 'vitest';
import { getNextSiddurUnit, getSiddurSequence } from '../src';
import { library } from './fixtures';

describe('getSiddurSequence', () => {
  it('orders by section order and skips empty sections', () => {
    expect(getSiddurSequence(library.siddur).map((u) => u.id)).toEqual(['pd-1', 'pd-2', 'shema-1']);
  });
});

describe('getNextSiddurUnit (bug: never advanced past the first unit)', () => {
  it('starts at the first unit', () => {
    const next = getNextSiddurUnit(library.siddur, [], ['siddur']);
    expect(next).toMatchObject({ position: 1, total: 3, completedCount: 0 });
    expect(next!.unit.id).toBe('pd-1');
  });

  it('advances past completed units', () => {
    expect(getNextSiddurUnit(library.siddur, ['pd-1'], ['siddur'])!.unit.id).toBe('pd-2');
    expect(getNextSiddurUnit(library.siddur, ['pd-1', 'pd-2'], ['siddur'])!.unit.id).toBe('shema-1');
  });

  it('fills gaps: returns the earliest incomplete unit', () => {
    expect(getNextSiddurUnit(library.siddur, ['pd-2'], ['siddur'])!.unit.id).toBe('pd-1');
  });

  it('returns null when the path is complete', () => {
    expect(getNextSiddurUnit(library.siddur, ['pd-1', 'pd-2', 'shema-1'], ['siddur'])).toBeNull();
  });

  it('accepts kavannah or prayerbook_hebrew as Siddur interests', () => {
    expect(getNextSiddurUnit(library.siddur, [], ['kavannah'])).not.toBeNull();
    expect(getNextSiddurUnit(library.siddur, [], ['prayerbook_hebrew'])).not.toBeNull();
  });

  it('returns null without a Siddur-related interest', () => {
    expect(getNextSiddurUnit(library.siddur, [], ['musar'])).toBeNull();
  });
});
