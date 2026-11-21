import type { ContentLibrary, ContentUnit, SiddurUnit, UserProfile } from '../src';

export const modelUser: UserProfile = {
  framework: 'masorti_conservative',
  level: 'intermediate',
  interests: ['siddur', 'musar', 'kabbalah', 'kavannah'],
  studyLength: 'medium',
  languageMode: 'mixed',
  showCantillation: false,
  divineName: 'abbreviated',
  practiceContext: 'Attends Shacharit minyan',
};

export function unit(overrides: Partial<ContentUnit> & Pick<ContentUnit, 'id' | 'type'>): ContentUnit {
  return {
    english: `English for ${overrides.id}`,
    hebrew: 'בָּרוּךְ',
    transliteration: 'baruch',
    source: `Source for ${overrides.id}`,
    estimatedMinutes: 4,
    interests: [],
    minLevel: 'beginner',
    verified: true,
    ...overrides,
  };
}

export function siddurUnit(id: string): SiddurUnit {
  return {
    id,
    section: 'Pesukei Dezimra',
    blessingOrLine: id,
    hebrew: 'בָּרוּךְ שֶׁאָמַר',
    transliteration: 'baruch she’amar',
    english: 'Blessed is He who spoke',
    commentary: 'c',
    kavannahPrompt: 'k',
    estimatedMinutes: 5,
    verified: true,
  };
}

export const library: ContentLibrary = {
  studyUnits: [
    unit({ id: 'tanakh-a', type: 'tanakh', estimatedMinutes: 6 }),
    unit({ id: 'tanakh-b', type: 'tanakh', estimatedMinutes: 6 }),
    unit({ id: 'tanakh-c', type: 'tanakh', estimatedMinutes: 6 }),
    unit({ id: 'musar-a', type: 'musar' }),
    unit({ id: 'musar-b', type: 'musar' }),
    unit({ id: 'kabbalah-symbolic', type: 'kabbalah', depth: 'symbolic' }),
    unit({ id: 'kabbalah-intermediate', type: 'kabbalah', depth: 'intermediate' }),
    unit({ id: 'kabbalah-advanced', type: 'kabbalah', depth: 'advanced' }),
    unit({ id: 'musar-advanced-only', type: 'musar', minLevel: 'advanced' }),
    unit({ id: 'musar-reform-only', type: 'musar', frameworks: ['reform'] }),
  ],
  siddur: [
    { id: 's2', name: 'Shema', order: 2, units: [siddurUnit('shema-1')] },
    { id: 's1', name: 'Pesukei Dezimra', order: 1, units: [siddurUnit('pd-1'), siddurUnit('pd-2')] },
    { id: 's3', name: 'Amidah', order: 3, units: [] },
  ],
};
