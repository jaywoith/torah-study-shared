import { describe, expect, it } from 'vitest';
import { buildMusarOutline, buildSiddurOutline, ContentUnit, musarSectionName, SiddurSection } from '../src';

const sunit = (id: string) => ({ id, section: 's', blessingOrLine: `Title ${id}`, hebrew: 'א', english: 'a', estimatedMinutes: 3, verified: false });
const sections: SiddurSection[] = [
  { id: 'shema', name: 'Shema', order: 2, units: [sunit('sh-1')] },
  { id: 'pd', name: 'Pesukei Dezimra', order: 1, units: [sunit('pd-1'), sunit('pd-2')] },
  { id: 'empty', name: 'Empty', order: 3, units: [] },
];

const munit = (id: string, source: string): ContentUnit => ({
  id, type: 'musar', title: `T ${id}`, english: id, source, interests: ['musar'], minLevel: 'beginner', verified: false,
});

describe('Siddur outline', () => {
  it('lists sections in path order with completion and the next unit', () => {
    const o = buildSiddurOutline(sections, ['pd-1']);
    expect(o.sections.map((s) => s.name)).toEqual(['Pesukei Dezimra', 'Shema']);
    expect(o.sections[0]).toMatchObject({ completedCount: 1, units: [{ id: 'pd-1', title: 'Title pd-1', completed: true }, { id: 'pd-2', completed: false }] });
    expect(o).toMatchObject({ total: 3, completedCount: 1, nextUnitId: 'pd-2' });
  });

  it('has no next unit when everything is done, and ignores unknown ids', () => {
    expect(buildSiddurOutline(sections, ['pd-1', 'pd-2', 'sh-1', 'gone']))
      .toMatchObject({ completedCount: 3, nextUnitId: null });
  });
});

describe('Musar outline', () => {
  it('names sections from the citation without the verse range', () => {
    expect(musarSectionName('Mesillat Yesharim, Introduction 1-2')).toBe('Mesillat Yesharim, Introduction');
    expect(musarSectionName('Mesillat Yesharim 4:6-9')).toBe('Mesillat Yesharim 4');
    expect(musarSectionName('Pirkei Avot 6:11')).toBe('Pirkei Avot 6');
    expect(musarSectionName(undefined)).toBe('Musar');
  });

  it('groups consecutive units and skips non-Musar units', () => {
    const units = [
      munit('i1', 'Mesillat Yesharim, Introduction 1-2'),
      munit('i2', 'Mesillat Yesharim, Introduction 3-4'),
      { ...munit('t', 'Psalms 1:1'), type: 'tanakh' as const },
      munit('c1', 'Mesillat Yesharim 1:1-3'),
    ];
    const o = buildMusarOutline(units, ['i1']);
    expect(o.sections.map((s) => [s.name, s.units.length])).toEqual([['Mesillat Yesharim, Introduction', 2], ['Mesillat Yesharim 1', 1]]);
    expect(o).toMatchObject({ total: 3, completedCount: 1, nextUnitId: 'i2' });
  });
});
