import { describe, expect, it } from 'vitest';
import { applyLanguageMode, extractShoresh, getLanguageDisplay, getPartOfSpeech } from '../src';

const full = { hebrew: 'בָּרוּךְ', transliteration: 'baruch', english: 'blessed' };

describe('language modes (bug: modes were not distinct)', () => {
  it('english shows English only', () => {
    expect(applyLanguageMode(full, getLanguageDisplay('english'))).toEqual({ english: 'blessed' });
  });

  it('hebrew shows Hebrew only', () => {
    expect(applyLanguageMode(full, getLanguageDisplay('hebrew'))).toEqual({ hebrew: 'בָּרוּךְ' });
  });

  it('hebrew keeps English when a unit has no Hebrew', () => {
    expect(applyLanguageMode({ english: 'only english' }, getLanguageDisplay('hebrew'))).toEqual({
      english: 'only english',
    });
  });

  it('split shows Hebrew and English side by side, no transliteration', () => {
    const d = getLanguageDisplay('split');
    expect(applyLanguageMode(full, d)).toEqual({ hebrew: 'בָּרוּךְ', english: 'blessed' });
    expect(d.layout).toBe('side-by-side');
  });

  it('mixed shows all three interleaved', () => {
    const d = getLanguageDisplay('mixed');
    expect(applyLanguageMode(full, d)).toEqual(full);
    expect(d.layout).toBe('interleaved');
  });

  it('every mode has a distinct display contract', () => {
    const modes = (['english', 'hebrew', 'split', 'mixed'] as const).map((m) => JSON.stringify({ ...getLanguageDisplay(m), mode: '' }));
    expect(new Set(modes).size).toBe(4);
  });

  it('does not mutate the input', () => {
    const copy = { ...full };
    applyLanguageMode(copy, getLanguageDisplay('english'));
    expect(copy).toEqual(full);
  });
});

describe('Hebrew helpers', () => {
  it('extractShoresh returns known roots and null otherwise', () => {
    expect(extractShoresh('אָמַר')).toBe('אמר');
    expect(extractShoresh('unknown')).toBeNull();
  });

  it('getPartOfSpeech returns null for unknown words (bug: always returned "verb")', () => {
    expect(getPartOfSpeech('טוֹב')).toBe('adjective');
    expect(getPartOfSpeech('unknown')).toBeNull();
  });
});
