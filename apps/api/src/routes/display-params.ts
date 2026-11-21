import type { Request } from 'express';
import {
  DEFAULT_DIVINE_NAME,
  DEFAULT_SHOW_CANTILLATION,
  DIVINE_NAME_MODES,
  DivineNameMode,
  INTERESTS,
  Interest,
  LANGUAGE_MODES,
  LanguageDisplay,
  LanguageMode,
  TextPreferences,
  getLanguageDisplay,
} from '@torah/core';

export const csv = (value: unknown) =>
  typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

export type DisplayParams =
  | { error: string }
  | { interests: Interest[]; display: LanguageDisplay; prefs: TextPreferences };

/**
 * Query params shared by the sequential path endpoints (/v1/siddur/next, /v1/musar/next):
 * interests, languageMode, showCantillation, divineName.
 */
export function parseDisplayParams(req: Request, defaultInterests: Interest[]): DisplayParams {
  const interests = req.query.interests === undefined ? defaultInterests : csv(req.query.interests);
  const invalid = interests.filter((i) => !(INTERESTS as readonly string[]).includes(i));
  if (invalid.length > 0) return { error: `Unknown interests: ${invalid.join(', ')}` };

  const mode = (req.query.languageMode as string | undefined) ?? 'mixed';
  if (!(LANGUAGE_MODES as readonly string[]).includes(mode)) {
    return { error: `languageMode must be one of: ${LANGUAGE_MODES.join(', ')}` };
  }

  const cantillation = req.query.showCantillation;
  if (cantillation !== undefined && cantillation !== 'true' && cantillation !== 'false') {
    return { error: 'showCantillation must be true or false' };
  }

  const divineName = (req.query.divineName as string | undefined) ?? DEFAULT_DIVINE_NAME;
  if (!(DIVINE_NAME_MODES as readonly string[]).includes(divineName)) {
    return { error: `divineName must be one of: ${DIVINE_NAME_MODES.join(', ')}` };
  }

  return {
    interests: interests as Interest[],
    display: getLanguageDisplay(mode as LanguageMode),
    prefs: {
      showCantillation: cantillation === undefined ? DEFAULT_SHOW_CANTILLATION : cantillation === 'true',
      divineName: divineName as DivineNameMode,
    },
  };
}
