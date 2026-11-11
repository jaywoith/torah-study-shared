/**
 * Hard constraints that the AI must obey.
 * Enforced by the backend before/after calls.
 */

export const constraints = {
  alwaysCiteSources: true,
  noProgressiveDefaultForTraditionalFrameworks: [
    'masorti_conservative',
    'orthodox',
    'modern_orthodox',
    'hasidic',
  ],
  kabbalahIntermediateStaysSymbolic: true,
  emphasizeKavannahForSiddur: true,
  hebrewMustBePointedWhenPresent: true,
};

export function getConstraintsForFramework(framework: string): string[] {
  const base = [
    'Always cite sources.',
    'Keep Hebrew pointed (with vowels) when including Hebrew text.',
  ];
  if (framework === 'masorti_conservative') {
    base.push(
      'Do not present progressive reinterpretations as the default.',
      'Treat Halachah as binding within the Conservative tradition.',
      'For Kabbalah material at intermediate level, stay symbolic and ethical unless the user has advanced.',
      'Emphasize kavannah (כַּוָּנָה) and practical application.'
    );
  }
  return base;
}
