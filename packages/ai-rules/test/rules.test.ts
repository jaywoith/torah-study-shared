import { describe, expect, it } from 'vitest';
import { FRAMEWORK_IDS } from '@torah/core';
import { getConstraintsForFramework, personas } from '../src';

describe('personas', () => {
  it('defines a persona for every framework', () => {
    for (const id of FRAMEWORK_IDS) expect(personas[id].framework).toBe(id);
  });
});

describe('getConstraintsForFramework', () => {
  it('always requires sources and pointed Hebrew', () => {
    for (const id of FRAMEWORK_IDS) {
      expect(getConstraintsForFramework(id)).toEqual(
        expect.arrayContaining(['Always cite sources.', 'Keep Hebrew pointed (with vowels) when including Hebrew text.'])
      );
    }
  });

  it('applies the no-progressive-default rule to every traditional framework (bug: Conservative only)', () => {
    for (const id of ['masorti_conservative', 'orthodox', 'modern_orthodox', 'hasidic'] as const) {
      expect(getConstraintsForFramework(id)).toContain('Do not present progressive reinterpretations as the default.');
    }
    expect(getConstraintsForFramework('reform')).not.toContain(
      'Do not present progressive reinterpretations as the default.'
    );
  });
});
