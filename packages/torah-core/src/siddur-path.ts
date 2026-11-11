/**
 * Siddur path sequencing and unit structure.
 * For Conservative Intermediate: begins with Shacharit / Pesukei Dezimra.
 */

import { SiddurUnit, Interest } from './models';

export interface SiddurSection {
  id: string;
  name: string;
  order: number;
  units: SiddurUnit[];
}

export const siddurPathConservativeIntermediate: SiddurSection[] = [
  {
    id: 'pesukei_dezimra',
    name: 'Pesukei Dezimra',
    order: 1,
    units: [
      // Example unit will be expanded in examples/
    ],
  },
  {
    id: 'shema',
    name: 'Shema and its Blessings',
    order: 2,
    units: [],
  },
  {
    id: 'amidah',
    name: 'Amidah',
    order: 3,
    units: [],
  },
];

export function getNextSiddurUnit(
  completedIds: string[],
  interests: Interest[]
): SiddurUnit | null {
  // Stub: prioritize Pesukei Dezimra for users interested in Siddur
  if (interests.includes('siddur')) {
    return {
      id: 'baruch_sheamar',
      section: 'Pesukei Dezimra',
      blessingOrLine: 'Baruch She’amar',
      hebrew: 'בָּרוּךְ שֶׁאָמַר וְהָיָה הָעוֹלָם',
      transliteration: 'Baruch she’amar ve’hayah ha’olam',
      english: 'Blessed is He who spoke, and the world came into being.',
      commentary: 'Traditional Conservative commentary emphasizes the creative power of divine speech and the kavannah of acknowledging God as Creator at the start of the morning praises.',
      kavannahPrompt: 'As you recite these words, pause and consider: what does it mean that the world exists because God spoke?',
      relatedInterests: ['siddur', 'kavannah'],
    };
  }
  return null;
}
