/**
 * Language mode handling.
 *
 * Each mode is a distinct display contract:
 * - english: English only.
 * - hebrew:  pointed Hebrew only (English is kept only for units that have no Hebrew).
 * - split:   Hebrew and English side by side, no transliteration.
 * - mixed:   Hebrew + transliteration + English interleaved (the model user's default).
 *
 * Commentary and kavannah prompts are English in every mode for now.
 */

import { LanguageDisplay, LanguageMode, TextFields } from './models';

const DISPLAYS: Record<LanguageMode, LanguageDisplay> = {
  english: { mode: 'english', showHebrew: false, showTransliteration: false, showEnglish: true, layout: 'stacked' },
  hebrew: { mode: 'hebrew', showHebrew: true, showTransliteration: false, showEnglish: false, layout: 'stacked' },
  split: { mode: 'split', showHebrew: true, showTransliteration: false, showEnglish: true, layout: 'side-by-side' },
  mixed: { mode: 'mixed', showHebrew: true, showTransliteration: true, showEnglish: true, layout: 'interleaved' },
};

export function getLanguageDisplay(mode: LanguageMode): LanguageDisplay {
  return { ...(DISPLAYS[mode] ?? DISPLAYS.mixed) };
}

/** Text fields become optional once a language mode has been applied. */
export type Rendered<T extends TextFields> = Omit<T, keyof TextFields> & TextFields;

/**
 * Returns a copy of the unit with only the text fields the mode shows.
 * Never leaves a unit with no text: if a unit has no Hebrew, English is kept.
 */
export function applyLanguageMode<T extends TextFields>(unit: T, display: LanguageDisplay): Rendered<T> {
  const out: Rendered<T> = { ...unit };
  if (!display.showHebrew) delete out.hebrew;
  if (!display.showTransliteration) delete out.transliteration;
  if (!display.showEnglish && out.hebrew) delete out.english;
  return out;
}

const KNOWN_SHORASHIM: Record<string, string> = {
  'בָּרַךְ': 'ברך',
  'בָּרוּךְ': 'ברך',
  'שָׁמַע': 'שמע',
  'יָדַע': 'ידע',
  'אָמַר': 'אמר',
};

const KNOWN_PARTS_OF_SPEECH: Record<string, string> = {
  'בָּרַךְ': 'verb',
  'בָּרוּךְ': 'adjective (passive participle)',
  'שָׁמַע': 'verb',
  'יָדַע': 'verb',
  'אָמַר': 'verb',
  'טוֹב': 'adjective',
};

/**
 * Root (shoresh) lookup. Returns null when unknown.
 * A real morphological analyzer is planned (see docs/DEVELOPMENT_PLAN.md).
 */
export function extractShoresh(hebrewWord: string): string | null {
  return KNOWN_SHORASHIM[hebrewWord] ?? null;
}

/** Part-of-speech lookup. Returns null when unknown (never guesses). */
export function getPartOfSpeech(hebrewWord: string): string | null {
  return KNOWN_PARTS_OF_SPEECH[hebrewWord] ?? null;
}
