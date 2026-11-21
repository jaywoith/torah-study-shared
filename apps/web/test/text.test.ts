import { describe, expect, it } from 'vitest';
import { interleave, segment } from '../src/text';
import { addDays, toLocalISODate } from '../src/dates';
import { fmt } from '../src/strings';

describe('segment', () => {
  it('splits on sentence punctuation', () => {
    expect(segment('A. B; C? D!')).toEqual(['A.', 'B;', 'C?', 'D!']);
  });
  it('keeps a single sentence whole', () => {
    expect(segment('No break here')).toEqual(['No break here']);
  });
});

describe('interleave', () => {
  it('aligns fields with equal segment counts', () => {
    expect(interleave({ hebrew: 'א. ב.', english: 'a. b.' })).toEqual([
      { hebrew: 'א.', english: 'a.' },
      { hebrew: 'ב.', english: 'b.' },
    ]);
  });
  it('returns null for mismatched counts, single sentences, or a single field', () => {
    expect(interleave({ hebrew: 'א. ב.', english: 'a.' })).toBeNull();
    expect(interleave({ hebrew: 'א', english: 'a' })).toBeNull();
    expect(interleave({ english: 'a. b.' })).toBeNull();
  });
});

describe('dates', () => {
  it('formats local dates and crosses month boundaries', () => {
    expect(toLocalISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('fmt', () => {
  it('fills placeholders and leaves unknown ones', () => {
    expect(fmt('Unit {position} of {total}', { position: 2, total: 3 })).toBe('Unit 2 of 3');
    expect(fmt('{missing}', {})).toBe('{missing}');
  });
});

describe('isolateHebrew (bug: "Abbreviated (ה׳)" rendered with the geresh on the wrong side in <option>)', () => {
  it('wraps Hebrew runs in first-strong isolates and leaves Latin text alone', async () => {
    const { isolateHebrew } = await import('../src/strings');
    expect(isolateHebrew('Abbreviated (ה׳)')).toBe('Abbreviated (⁨ה׳⁩)');
    expect(isolateHebrew('Yud-yud (יְיָ)')).toBe('Yud-yud (⁨יְיָ⁩)');
    expect(isolateHebrew('Full, as in the source')).toBe('Full, as in the source');
  });
});
