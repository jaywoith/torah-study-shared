/**
 * Validation run by the API on every generated study before it is returned.
 *
 * These are structural and heuristic checks, not a theological review:
 * - every unit has some text
 * - Hebrew is pointed (has nikkud) whenever present
 * - sources are cited for intermediate level and above
 * - unit ids are unique
 * - total time stays within the study-length budget
 * - traditional frameworks: no phrasing that presents progressive /
 *   historical-critical readings as the default (keyword heuristic)
 */

import { DailyStudy } from './models';
import { getFramework } from './frameworks';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

/** Phrases that indicate a progressive reading is being presented as the default. */
export const PROGRESSIVE_DEFAULT_MARKERS = [
  'historical-critical',
  'purely progressive',
  'reinterpretation as default',
  'no longer binding',
];

const HEBREW_LETTER = /[א-ת]/;
// Nikkud (vowel points), dagesh, shin/sin dots, qamats qatan.
const NIKKUD = /[ְ-ׇּׁׂ]/;

/** True if the string has Hebrew letters but no vowel points. */
export function isUnpointedHebrew(text: string): boolean {
  return HEBREW_LETTER.test(text) && !NIKKUD.test(text);
}

export function validateDailyStudy(study: DailyStudy): ValidationResult {
  const issues: string[] = [];
  const framework = getFramework(study.profile.framework);
  const seen = new Set<string>();

  for (const unit of study.units) {
    if (seen.has(unit.id)) issues.push(`Duplicate unit id ${unit.id}`);
    seen.add(unit.id);

    if (!unit.hebrew && !unit.english) {
      issues.push(`Unit ${unit.id} has no Hebrew or English text`);
    }

    if (unit.hebrew && isUnpointedHebrew(unit.hebrew)) {
      issues.push(`Unit ${unit.id} has unpointed Hebrew`);
    }

    if (study.profile.level !== 'beginner' && !unit.source && unit.type !== 'commentary') {
      issues.push(`Unit ${unit.id} missing source citation`);
    }

    if (!framework.progressiveDefaultAllowed) {
      const text = `${unit.english ?? ''} ${unit.commentary ?? ''}`.toLowerCase();
      for (const marker of PROGRESSIVE_DEFAULT_MARKERS) {
        if (text.includes(marker)) {
          issues.push(`Unit ${unit.id} contains "${marker}", not appropriate as a default for ${framework.name}`);
        }
      }
    }
  }

  if (study.units.length > 1 && study.totalEstimatedMinutes > study.budgetMinutes) {
    issues.push(`Total ${study.totalEstimatedMinutes} min exceeds ${study.budgetMinutes} min budget`);
  }

  return { valid: issues.length === 0, issues };
}
