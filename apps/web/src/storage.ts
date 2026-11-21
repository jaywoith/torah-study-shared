/**
 * Browser storage. Since v0.4.0 the profile and progress live on the server;
 * these keys are read only once, to import data saved by v0.3 (see App.tsx).
 * Every access is wrapped: storage can be unavailable (private mode, blocked site data).
 */
import type { UserProfile } from '@torah/core';

export const LEGACY_KEYS = {
  profile: 'torah-study:profile:v1',
  siddurCompleted: 'torah-study:siddur-completed:v1',
} as const;

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function removeKeys(keys: string[]): void {
  try {
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}

/** v0.3 data still in this browser, or null if there is nothing to import. */
export function readLegacyData(): { profile?: UserProfile; siddurCompleted?: string[] } | null {
  const profile = readJson<UserProfile | null>(LEGACY_KEYS.profile, null);
  const siddurCompleted = readJson<string[]>(LEGACY_KEYS.siddurCompleted, []);
  if (!profile && siddurCompleted.length === 0) return null;
  return { ...(profile ? { profile } : {}), ...(siddurCompleted.length ? { siddurCompleted } : {}) };
}

/** The model user from docs/user-personas.md. Used until a profile is saved. */
export const DEFAULT_PROFILE: UserProfile = {
  framework: 'masorti_conservative',
  level: 'intermediate',
  interests: ['siddur', 'musar', 'kabbalah', 'kavannah'],
  studyLength: 'medium',
  languageMode: 'mixed',
  showCantillation: false,
  divineName: 'abbreviated',
  practiceContext: 'Attends Shacharit minyan',
};
