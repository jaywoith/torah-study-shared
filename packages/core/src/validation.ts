/**
 * Validation that generated material stays inside the chosen framework.
 */

import { DailyStudy, FrameworkId } from './models';
import { getFramework } from './frameworks';

const progressiveMarkers = [
  'historical-critical',
  'purely progressive',
  'not binding',
  'reinterpretation as default',
];

export function validateDailyStudy(study: DailyStudy): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const framework = getFramework(study.profile.framework);

  if (study.profile.framework === 'masorti_conservative' || study.profile.framework === 'orthodox') {
    for (const unit of study.units) {
      const text = `${unit.english} ${unit.commentary || ''}`.toLowerCase();
      for (const marker of progressiveMarkers) {
        if (text.includes(marker)) {
          issues.push(`Unit ${unit.id} contains progressive marker not appropriate for ${framework.name}: ${marker}`);
        }
      }
    }
  }

  // Ensure sources are present for intermediate+
  if (study.profile.level !== 'beginner') {
    for (const unit of study.units) {
      if (!unit.source && unit.type !== 'commentary') {
        issues.push(`Unit ${unit.id} missing source citation`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
