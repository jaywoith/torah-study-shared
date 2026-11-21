/**
 * Text display preferences (ADR-011): cantillation and the Divine Name.
 *
 * Content stores the source text, including te'amim and the Name as written.
 * These pure functions transform it at render time according to the profile.
 *
 * Scope decisions (owner, 2026-11-21):
 * - Only the Tetragrammaton is transformed. Other Divine Names (אֱלֹהִים etc.)
 *   render as in the source.
 * - Transliteration follows the setting: "Hashem" when abbreviated, "Adonai"
 *   for full and yud-yud. English is left exactly as the translation renders it.
 */

import { DivineNameMode, TextFields } from './models';

/**
 * Hebrew combining marks: te'amim, nikkud, meteg, rafe, shin/sin dots, upper/lower
 * dots, qamats qatan, plus the joiners Sefaria uses to order marks (CGJ, ZWJ).
 * Excludes the punctuation in the block: maqaf U+05BE, paseq U+05C0,
 * sof pasuq U+05C3, nun hafukha U+05C6.
 */
const MARK = '[\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u034F\\u200D]';
const M = `${MARK}*`;
const HEBREW_LETTER = '[\\u05D0-\\u05EA]';

/** Te'amim (accents), including the masora circle U+05AF. */
const TEAMIM = /[\u0591-\u05AF]/g;
const METEG = /\u05BD/g;
/** Paseq: a cantillation divider, usually written between spaces. */
const PASEQ = /[ \t]*\u05C0[ \t]*/g;

/**
 * Removes cantillation and keeps everything needed to read the text with vowels.
 *
 * Removed: te'amim U+0591–U+05AF, meteg U+05BD, paseq U+05C0.
 * Kept: nikkud, dagesh, shin/sin dots, qamats qatan U+05C7, maqaf U+05BE,
 * sof pasuq U+05C3, upper/lower dots U+05C4/U+05C5.
 *
 * Meteg is removed because the sources we import mark qamats qatan explicitly,
 * and nikkud-only editions generally omit it. Sof pasuq stays: it is the verse
 * end and appears in nikkud-only Tanakh editions too.
 */
export function stripCantillation(text: string): string {
  return text.replace(TEAMIM, '').replace(METEG, '').replace(PASEQ, ' ');
}

/** True if the text has any te'amim (U+0591–U+05AF). */
export function hasCantillation(text: string): boolean {
  return /[\u0591-\u05AF]/.test(text);
}

/**
 * One-letter prefixes that can attach to the Name: ו ב כ ל מ ש ה.
 * Up to three may stack (e.g. וּבַיהוָה, וּכְשֶׁ...).
 */
const PREFIX = `(?:[\\u05D5\\u05D1\\u05DB\\u05DC\\u05DE\\u05E9\\u05D4]${M}){0,3}`;
const Y = `\\u05D9${M}`;
const H = `\\u05D4${M}`;
const W = `\\u05D5${M}`;

/**
 * The Tetragrammaton, pointed or not, with optional prefixes, as a whole word.
 * Group 1: prefixes (with their vowels). Group 2: the Name itself.
 * Also matches the source substitutes יְיָ / יי so "abbreviated" is consistent
 * whichever form the source used.
 */
const NAME = new RegExp(
  `(?<!${HEBREW_LETTER}${M})(${PREFIX})(${Y}${H}${W}\\u05D4${M}|\\u05D9${M}\\u05D9${M})(?!${MARK}|${HEBREW_LETTER})`,
  'gu',
);

/**
 * The Name pointed to be read Elohim (e.g. אֲדֹנָי יֱהֹוִה) has hiriq U+05B4 under the
 * vav. The forms read Adonai never carry a hiriq, so any hiriq in the match means Elohim.
 */
const ELOHIM_READING = /\u05B4/;

export const DIVINE_NAME_ABBREVIATED = 'ה׳';
export const DIVINE_NAME_YUD_YUD = 'יְיָ';

/** The substitute written after a prefix: יְיָ keeps its vowels; prefixes keep theirs. */
function substitute(name: string, mode: Exclude<DivineNameMode, 'full'>): string {
  if (mode === 'abbreviated') return DIVINE_NAME_ABBREVIATED;
  // יְיָ is read "Adonai". When the source points the Name to be read Elohim,
  // writing יְיָ would change the reading, so use ה׳ there instead.
  return ELOHIM_READING.test(name) ? DIVINE_NAME_ABBREVIATED : DIVINE_NAME_YUD_YUD;
}

/**
 * Renders the Tetragrammaton according to the user's setting.
 * - full: unchanged (as in the source).
 * - abbreviated: ה׳ (prefixes kept: לַיהוָה → לַה׳).
 * - yud_yud: יְיָ (prefixes kept: לַיהוָה → לַיְיָ). The Elohim reading becomes ה׳.
 * Te'amim on the Name itself are not carried over to the substitute.
 */
export function applyDivineName(text: string, mode: DivineNameMode): string {
  if (mode === 'full') return text;
  return text.replace(NAME, (_match, prefix: string, name: string) => prefix + substitute(name, mode));
}

/** Transliteration: "Adonai" becomes "Hashem" when abbreviated; otherwise unchanged. */
export function applyDivineNameTransliteration(text: string, mode: DivineNameMode): string {
  if (mode !== 'abbreviated') return text;
  return text.replace(/\bADONAI\b/g, 'HASHEM').replace(/\bAdonai\b/g, 'Hashem').replace(/\badonai\b/g, 'hashem');
}

export interface TextPreferences {
  showCantillation: boolean;
  divineName: DivineNameMode;
}

/**
 * Applies the display preferences to a unit's Hebrew and transliteration.
 * English is never changed. Run after applyLanguageMode (fields may be absent).
 */
export function applyTextPreferences<T extends TextFields>(unit: T, prefs: TextPreferences): T {
  const out = { ...unit };
  if (out.hebrew !== undefined) {
    let hebrew = applyDivineName(out.hebrew, prefs.divineName);
    if (!prefs.showCantillation) hebrew = stripCantillation(hebrew);
    out.hebrew = hebrew;
  }
  if (out.transliteration !== undefined) {
    out.transliteration = applyDivineNameTransliteration(out.transliteration, prefs.divineName);
  }
  return out;
}
