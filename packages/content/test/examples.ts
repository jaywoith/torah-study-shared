import { UserProfile, generateDailyStudy, getSiddurSequence } from '@torah/core';
import { contentLibrary } from '../src';

export const MODEL_USER: UserProfile = {
  framework: 'masorti_conservative',
  level: 'intermediate',
  interests: ['siddur', 'musar', 'kabbalah', 'kavannah'],
  studyLength: 'medium',
  languageMode: 'mixed',
  showCantillation: false,
  divineName: 'abbreviated',
  practiceContext: 'Attends Shacharit minyan',
};

/** The example files under docs/examples, keyed by file name. */
export function buildExamples(): Record<string, unknown> {
  return {
    'conservative-intermediate-daily.json': generateDailyStudy(MODEL_USER, '2026-11-11', contentLibrary),
    'siddur-unit-example.json': getSiddurSequence(contentLibrary.siddur)[0],
  };
}
