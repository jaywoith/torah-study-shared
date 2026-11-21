import { describe, expect, it } from 'vitest';
import { ContentLibrary, buildContentReport, summarizeSources } from '../src';

const prov = (he: [string, string], en?: [string, string], personalUseOnly?: boolean) => ({
  sefariaRef: 'X 1:1',
  sefariaUrl: 'https://www.sefaria.org/X.1.1',
  importedAt: '2026-11-21T00:00:00.000Z',
  hebrew: { versionTitle: he[0], license: he[1] },
  ...(en ? { english: { versionTitle: en[0], license: en[1] } } : {}),
  ...(personalUseOnly ? { personalUseOnly } : {}),
});

const base = { type: 'tanakh' as const, interests: ['tanakh' as const], minLevel: 'beginner' as const, source: 'X', estimatedMinutes: 3 };
const library: ContentLibrary = {
  studyUnits: [
    { ...base, id: 'a', hebrew: 'א', english: 'a', verified: false, provenance: prov(['MAM', 'CC-BY-SA'], ['NJPS', 'CC-BY-NC']) },
    { ...base, id: 'b', hebrew: 'ב', english: 'b', verified: true, provenance: prov(['MAM', 'CC-BY-SA'], ['Sim', 'unknown'], true) },
    { ...base, id: 'c', english: 'c', commentary: 'x', kavannahPrompt: 'y', transliteration: 't', verified: false },
  ],
  siddur: [
    {
      id: 'pd',
      name: 'Pesukei Dezimra',
      order: 1,
      units: [
        { id: 's1', section: 'Pesukei Dezimra', blessingOrLine: 'x', hebrew: 'ש', english: 's', verified: false, provenance: prov(['Daat', 'Public Domain']) },
      ],
    },
  ],
};

describe('summarizeSources', () => {
  it('groups by language and version, counts entries and flags licenses', () => {
    const s = summarizeSources(library);
    expect(s.map((v) => `${v.language}:${v.versionTitle}:${v.units}`)).toEqual([
      'english:NJPS:1',
      'english:Sim:1',
      'hebrew:Daat:1',
      'hebrew:MAM:2',
    ]);
    expect(s.find((v) => v.versionTitle === 'NJPS')).toMatchObject({ nonCommercial: true, requiresAttribution: true });
    expect(s.find((v) => v.versionTitle === 'Sim')).toMatchObject({ personalUseOnly: true, requiresAttribution: false });
    expect(s.find((v) => v.versionTitle === 'Daat')).toMatchObject({ requiresAttribution: false, nonCommercial: false });
  });
});

describe('buildContentReport', () => {
  it('counts totals, kinds, licensing flags and missing fields', () => {
    const r = buildContentReport(library);
    expect(r.totals).toEqual({ entries: 4, imported: 3, handWritten: 1, verified: 1, unverified: 3 });
    expect(r.byKind).toEqual({ tanakh: 3, 'siddur:pd': 1 });
    expect(r.nonCommercial).toEqual(['a']);
    expect(r.personalUseOnly).toEqual(['b']);
    expect(r.missing.hebrew).toEqual(['c']);
    expect(r.missing.commentary).toEqual(['a', 'b', 's1']);
  });
});
