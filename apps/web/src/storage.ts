/**
 * localStorage helpers. Every access is wrapped: storage can be unavailable
 * (private mode, blocked site data) and the app must still work.
 * Profile and Siddur progress live here until server persistence in v0.4.0.
 */
import type { UserProfile } from '@torah/core';

export const KEYS = {
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

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

/** The model user from docs/user-personas.md. Used until the owner saves a profile. */
export const DEFAULT_PROFILE: UserProfile = {
  framework: 'masorti_conservative',
  level: 'intermediate',
  interests: ['siddur', 'musar', 'kabbalah', 'kavannah'],
  studyLength: 'medium',
  languageMode: 'mixed',
  practiceContext: 'Attends Shacharit minyan',
};
