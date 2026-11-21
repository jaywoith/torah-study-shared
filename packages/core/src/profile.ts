/**
 * Runtime validation of untrusted profile input (e.g. an API request body).
 */

import {
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

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, profile: p as unknown as UserProfile };
}
