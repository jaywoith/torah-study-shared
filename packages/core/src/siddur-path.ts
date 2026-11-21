/**
 * Siddur path: an ordered sequence of units (section order, then unit order).
 * Content lives in @torah/content (data/siddur.json); these functions are pure.
 */

import { Interest, SiddurSection, SiddurUnit } from './models';

/** Interests that opt a user into the Siddur path. */
export const SIDDUR_INTERESTS: Interest[] = ['siddur', 'kavannah', 'prayerbook_hebrew'];

/** Flattens sections into the study order. Empty sections are skipped naturally. */
export function getSiddurSequence(sections: SiddurSection[]): SiddurUnit[] {
  return [...sections].sort((a, b) => a.order - b.order).flatMap((s) => s.units);
}

export interface SiddurProgress {
  unit: SiddurUnit;
  /** 1-based position of this unit in the full sequence. */
  position: number;
  total: number;
  completedCount: number;
}

/**
 * The first unit in sequence order that has not been completed.
 * Returns null if the user has no Siddur-related interest or has finished the path.
 */
export function getNextSiddurUnit(
  sections: SiddurSection[],
  completedIds: string[],
  interests: Interest[]
): SiddurProgress | null {
  if (!interests.some((i) => SIDDUR_INTERESTS.includes(i))) return null;
  const sequence = getSiddurSequence(sections);
  const completed = new Set(completedIds);
  const index = sequence.findIndex((u) => !completed.has(u.id));
  if (index === -1) return null;
  return {
    unit: sequence[index],
    position: index + 1,
    total: sequence.length,
    completedCount: sequence.filter((u) => completed.has(u.id)).length,
  };
}
