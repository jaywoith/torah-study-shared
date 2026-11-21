/**
 * Learning levels. Independent of framework.
 */

import { KabbalahDepth, LEARNING_LEVELS, LearningLevel } from './models';

export interface LevelConfig {
  id: LearningLevel;
  name: string;
  scaffolding: 'heavy' | 'moderate' | 'light' | 'minimal';
  hebrewDensity: 'low' | 'medium' | 'high';
  commentaryComplexity: 'simple' | 'moderate' | 'detailed' | 'scholarly';
  unitLengthPreference: 'short' | 'medium' | 'long';
  /** Deepest Kabbalah appropriate at this level (further capped by framework). */
  maxKabbalahDepth: KabbalahDepth;
  notes: string;
}

export const learningLevels: Record<LearningLevel, LevelConfig> = {
  beginner: {
    id: 'beginner',
    maxKabbalahDepth: 'symbolic',
    name: 'Beginner',
    scaffolding: 'heavy',
    hebrewDensity: 'low',
    commentaryComplexity: 'simple',
    unitLengthPreference: 'short',
    notes: 'Heavy scaffolding, more English, basic vocabulary, short units, frequent review.',
  },
  intermediate: {
    id: 'intermediate',
    maxKabbalahDepth: 'intermediate',
    name: 'Intermediate',
    scaffolding: 'moderate',
    hebrewDensity: 'medium',
    commentaryComplexity: 'moderate',
    unitLengthPreference: 'medium',
    notes: 'Shoresh, POS, pointed Hebrew for key terms, moderate commentary. Past pure beginner but not continuous advanced Talmud.',
  },
  advanced: {
    id: 'advanced',
    maxKabbalahDepth: 'advanced',
    name: 'Advanced',
    scaffolding: 'light',
    hebrewDensity: 'high',
    commentaryComplexity: 'detailed',
    unitLengthPreference: 'long',
    notes: 'Longer primary texts, multiple commentaries, less scaffolding.',
  },
  scholar: {
    id: 'scholar',
    maxKabbalahDepth: 'advanced',
    name: 'Scholar',
    scaffolding: 'minimal',
    hebrewDensity: 'high',
    commentaryComplexity: 'scholarly',
    unitLengthPreference: 'long',
    notes: 'Assumes facility with sources; AI acts more as discussion partner than teacher.',
  },
};

export function getLevel(id: LearningLevel): LevelConfig {
  return learningLevels[id];
}

/** Numeric rank of a level (beginner = 0). */
export function levelRank(level: LearningLevel): number {
  return LEARNING_LEVELS.indexOf(level);
}
