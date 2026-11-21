/**
 * Musar path: every Musar unit in library order (Mesillat Yesharim, then Pirkei
 * Avot), read sequentially and tracked by progress, so a missed day never skips
 * text. Pure.
 */

import { ContentUnit, Interest } from './models';

export const MUSAR_INTERESTS: Interest[] = ['musar'];

export function getMusarSequence(units: ContentUnit[]): ContentUnit[] {
  return units.filter((u) => u.type === 'musar');
}

export interface MusarProgress {
  unit: ContentUnit;
  /** 1-based position in the full sequence. */
  position: number;
  total: number;
  completedCount: number;
}

/** The first Musar unit not yet completed; null without a Musar interest or when finished. */
export function getNextMusarUnit(units: ContentUnit[], completedIds: string[], interests: Interest[]): MusarProgress | null {
  if (!interests.some((i) => MUSAR_INTERESTS.includes(i))) return null;
  const sequence = getMusarSequence(units);
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
