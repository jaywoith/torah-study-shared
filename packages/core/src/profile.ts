/**
 * Runtime validation of untrusted profile input (e.g. an API request body).
 */

import {
  DEFAULT_DIVINE_NAME,
  DEFAULT_SHOW_CANTILLATION,
  DIVINE_NAME_MODES,
  FRAMEWORK_IDS,
  INTERESTS,
  LANGUAGE_MODES,
  LEARNING_LEVELS,
  STUDY_LENGTHS,
  UserProfile,
} from './models';

export type ParseResult = { ok: true; profile: UserProfile } | { ok: false; errors: string[] };

function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

export function parseUserProfile(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, errors: ['profile must be an object'] };
  }
  const p = input as Record<string, unknown>;
  const errors: string[] = [];

  if (!oneOf(FRAMEWORK_IDS, p.framework)) errors.push(`profile.framework must be one of: ${FRAMEWORK_IDS.join(', ')}`);
  if (!oneOf(LEARNING_LEVELS, p.level)) errors.push(`profile.level must be one of: ${LEARNING_LEVELS.join(', ')}`);
  if (!oneOf(STUDY_LENGTHS, p.studyLength)) errors.push(`profile.studyLength must be one of: ${STUDY_LENGTHS.join(', ')}`);
  if (!oneOf(LANGUAGE_MODES, p.languageMode)) errors.push(`profile.languageMode must be one of: ${LANGUAGE_MODES.join(', ')}`);
  if (!Array.isArray(p.interests) || !p.interests.every((i) => oneOf(INTERESTS, i))) {
    errors.push(`profile.interests must be an array of: ${INTERESTS.join(', ')}`);
  }
  if (p.practiceContext !== undefined && typeof p.practiceContext !== 'string') {
    errors.push('profile.practiceContext must be a string');
  }

  if (p.showCantillation !== undefined && typeof p.showCantillation !== 'boolean') {
    errors.push('profile.showCantillation must be a boolean');
  }
  if (p.divineName !== undefined && !oneOf(DIVINE_NAME_MODES, p.divineName)) {
    errors.push(`profile.divineName must be one of: ${DIVINE_NAME_MODES.join(', ')}`);
  }

  if (errors.length > 0) return { ok: false, errors };
  // Fields added in v0.5 are optional on input so profiles saved by v0.4 keep working.
  const profile = {
    ...p,
    showCantillation: p.showCantillation ?? DEFAULT_SHOW_CANTILLATION,
    divineName: p.divineName ?? DEFAULT_DIVINE_NAME,
  } as unknown as UserProfile;
  return { ok: true, profile };
}
