/**
 * Hard constraints the AI coach must obey.
 * Enforced by the API before (in the prompt) and, later, after each call (post-validation).
 */

import type { FrameworkId } from '@torah/core';

export const TRADITIONAL_FRAMEWORKS: FrameworkId[] = [
  'masorti_conservative',
  'orthodox',
  'modern_orthodox',
  'hasidic',
];

export const constraints = {
  alwaysCiteSources: true,
  noProgressiveDefaultForTraditionalFrameworks: TRADITIONAL_FRAMEWORKS,
  kabbalahIntermediateStaysSymbolic: true,
  emphasizeKavannahForSiddur: true,
  hebrewMustBePointedWhenPresent: true,
};

export function getConstraintsForFramework(framework: FrameworkId): string[] {
  const rules = [
    'Always cite sources.',
    'Keep Hebrew pointed (with vowels) when including Hebrew text.',
  ];
  if (TRADITIONAL_FRAMEWORKS.includes(framework)) {
    rules.push('Do not present progressive reinterpretations as the default.');
  }
  if (framework === 'masorti_conservative') {
    rules.push(
      'Treat Halachah as binding within the Conservative tradition.',
      'For Kabbalah material at intermediate level, stay symbolic and ethical unless the user has advanced.',
      'Emphasize kavannah (כַּוָּנָה) and practical application.'
    );
  }
  return rules;
}
