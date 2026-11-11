/**
 * Specialized paths: Musar, Kabbalah, Halachah.
 */

import { Interest } from './models';

export interface SpecializedPath {
  id: string;
  name: string;
  description: string;
  suitableForInterests: Interest[];
  depthByLevel: Record<string, string>;
}

export const specializedPaths: SpecializedPath[] = [
  {
    id: 'musar',
    name: 'Musar Path',
    description: 'Daily short selections from classic works with practical reflection questions.',
    suitableForInterests: ['musar'],
    depthByLevel: {
      beginner: 'simple ethical stories',
      intermediate: 'classic Musar excerpts with reflection',
      advanced: 'deeper textual study',
      scholar: 'primary sources and discussion',
    },
  },
  {
    id: 'kabbalah',
    name: 'Kabbalah Path',
    description: 'Introductory and intermediate material presented within Conservative bounds (symbolic and ethical emphasis first).',
    suitableForInterests: ['kabbalah'],
    depthByLevel: {
      beginner: 'symbolic only',
      intermediate: 'symbolic and ethical; light theosophic framing',
      advanced: 'deeper with clear framing',
      scholar: 'primary texts',
    },
  },
  {
    id: 'halachah',
    name: 'Halachah Path',
    description: 'Practical rulings consistent with Conservative positions, with notes on traditional alternatives when useful.',
    suitableForInterests: ['halachah'],
    depthByLevel: {
      intermediate: 'practical Conservative rulings',
    },
  },
];
