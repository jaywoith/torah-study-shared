// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { applyLanguageMode, getLanguageDisplay, type LanguageMode } from '@torah/core';
import { UnitText } from '../src/components/UnitText';

afterEach(cleanup);

const unit = {
  hebrew: 'בָּרוּךְ שֶׁאָמַר. בָּרוּךְ הוּא.',
  transliteration: 'Baruch she’amar. Baruch hu.',
  english: 'Blessed is He who spoke. Blessed is He.',
};

function renderMode(mode: LanguageMode, input = unit) {
  const display = getLanguageDisplay(mode);
  return render(<UnitText unit={applyLanguageMode(input, display)} display={display} />).container;
}

describe('UnitText layouts per language mode', () => {
  it('english: English only, stacked', () => {
    const c = renderMode('english');
    expect(c.querySelector('[data-layout="stacked"]')).not.toBeNull();
    expect(c.querySelector('.hebrew')).toBeNull();
    expect(c.querySelector('.translit')).toBeNull();
    expect(c.querySelector('.english')!.textContent).toBe(unit.english);
  });

  it('hebrew: Hebrew only, marked lang="he" dir="rtl"', () => {
    const c = renderMode('hebrew');
    const he = c.querySelector('.hebrew')!;
    expect(he.getAttribute('lang')).toBe('he');
    expect(he.getAttribute('dir')).toBe('rtl');
    expect(c.querySelector('.english')).toBeNull();
  });

  it('split: Hebrew and English side by side', () => {
    const c = renderMode('split');
    const grid = c.querySelector('[data-layout="side-by-side"]')!;
    expect(grid.querySelector('.hebrew')).not.toBeNull();
    expect(grid.querySelector('.english')).not.toBeNull();
    expect(c.querySelector('.translit')).toBeNull();
  });

  it('mixed: interleaves sentence by sentence when segments align', () => {
    const c = renderMode('mixed');
    const lines = c.querySelectorAll('[data-layout="interleaved"] .line');
    expect(lines).toHaveLength(2);
    expect(lines[0].querySelector('.hebrew')!.textContent).toBe('בָּרוּךְ שֶׁאָמַר.');
    expect(lines[0].querySelector('.english')!.textContent).toBe('Blessed is He who spoke.');
  });

  it('mixed: ignores non-text fields on full units (bug: crashed on reviewItems)', () => {
    const full = { ...unit, id: 'x', commentary: 'c. d.', reviewItems: [{ type: 'shoresh' as const, text: 'א' }] };
    const display = getLanguageDisplay('mixed');
    const c = render(<UnitText unit={full} display={display} />).container;
    expect(c.querySelectorAll('[data-layout="interleaved"] .line')).toHaveLength(2);
  });

  it('mixed: falls back to stacked when segments do not align', () => {
    const c = renderMode('mixed', { ...unit, english: 'One English sentence only.' });
    expect(c.querySelector('[data-layout="stacked"]')).not.toBeNull();
    expect(c.querySelectorAll('.hebrew')).toHaveLength(1);
  });
});
