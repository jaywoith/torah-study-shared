/**
 * Sefaria import library (ADR-010): sanitizing, license policy, merging.
 * HTML inputs reproduce the markup patterns seen in real Sefaria responses.
 */
import { describe, expect, it } from 'vitest';
import { licenseStatus, normalizeLicense, requiresAttribution } from '../src/sefaria/license';
import { estimateMinutes, mergeImported, sefariaUrl } from '../src/sefaria/merge';
import { isEditorialNote, sanitizeSegment, sanitizeText } from '../src/sefaria/sanitize';

describe('sanitizeSegment', () => {
  it('unwraps small caps and poetry spans, turns <br> into spaces', () => {
    expect(sanitizeSegment('The L<small>ORD</small> is good to all,<br>and His mercy')).toBe(
      'The LORD is good to all, and His mercy',
    );
    expect(sanitizeSegment('<span class="poetry indentAll">one,</span><br><span class="poetry">two</span>')).toBe('one, two');
  });

  it('removes footnotes with their nested content', () => {
    const html =
      'Hear, O Israel!<sup class="footnote-marker">b</sup><i class="footnote"><b>The E<small>TERNAL</small> </b>Cf. <a class="refLink" href="Zechariah.14.9">Zech. 14.9</a>.</i> You shall love';
    expect(sanitizeSegment(html)).toBe('Hear, O Israel! You shall love');
  });

  it('removes end-footnote markers', () => {
    expect(sanitizeSegment('He leads me to <sup class="footnote-marker">a</sup><i class="footnote">Others “still waters.”</i>water<sup class="endFootnote">-a</sup>')).toBe(
      'He leads me to water',
    );
  });

  it('removes Masorah parasha markers and decodes spaces', () => {
    expect(sanitizeSegment('עִם־אֱלֹהֶֽיךָ׃&nbsp;<span class="mam-spi-samekh">{ס}</span>&nbsp;&nbsp;&nbsp;')).toBe('עִם־אֱלֹהֶֽיךָ׃');
  });

  it('keeps te\'amim, large letters and the paseq', () => {
    expect(sanitizeSegment('<big>בְּ</big>רֵאשִׁ֖ית')).toBe('בְּרֵאשִׁ֖ית');
    expect(sanitizeSegment('יְהֹוָ֥ה&thinsp;<small>׀</small>&thinsp;אֶחָֽ<big>ד</big>׃')).toBe('יְהֹוָ֥ה ׀ אֶחָֽד׃');
  });

  it('decodes numeric entities', () => {
    expect(sanitizeSegment('a&#8212;b&#x2019;')).toBe('a—b’');
  });
});

describe('sanitizeText', () => {
  it('joins range segments and skips whole-segment editorial notes (Metsudah)', () => {
    const text = [
      '<small>ברוך שאמר צריך לאומרו בניגון</small>',
      '<b>בָּרוּךְ שֶׁאָמַר</b> וְהָיָה הָעוֹלָם.',
    ];
    expect(sanitizeText(text)).toBe('בָּרוּךְ שֶׁאָמַר וְהָיָה הָעוֹלָם.');
    expect(sanitizeText(['<i>This blessing introduces the<i> Pesukei Dezimrah </i>.</i>', 'Blessed is He'])).toBe('Blessed is He');
  });

  it('flattens nested arrays', () => {
    expect(sanitizeText([['a', 'b'], ['c']])).toBe('a b c');
  });

  it('does not treat a segment that merely starts with italics as a note', () => {
    expect(isEditorialNote('<i>Selah</i> and more text')).toBe(false);
  });
});

describe('license policy', () => {
  it('allows open licenses', () => {
    for (const l of ['Public Domain', 'CC0', 'CC-BY', 'CC-BY-SA']) expect(licenseStatus(l)).toBe('allowed');
  });

  it('flags non-commercial licenses', () => {
    expect(licenseStatus('CC-BY-NC')).toBe('non_commercial');
  });

  it('rejects unknown unless the entry is personal-use only (ADR-012)', () => {
    expect(licenseStatus('unknown')).toBe('rejected');
    expect(licenseStatus('')).toBe('rejected');
    expect(licenseStatus('CC-BY-NC-ND')).toBe('rejected');
    expect(licenseStatus('unknown', { personalUseOnly: true })).toBe('personal_use_only');
  });

  it('normalizes spelling variants', () => {
    expect(normalizeLicense('Public domain')).toBe('Public Domain');
    expect(normalizeLicense('CC BY-SA')).toBe('CC-BY-SA');
    expect(normalizeLicense(undefined)).toBe('unknown');
  });

  it('knows which licenses need attribution', () => {
    expect(requiresAttribution('CC-BY-SA')).toBe(true);
    expect(requiresAttribution('Public Domain')).toBe(false);
  });
});

describe('mergeImported', () => {
  const imported = {
    hebrew: 'טוֹב־יְהֹוָ֥ה לַכֹּ֑ל',
    english: 'The LORD is good to all',
    source: 'Psalms 145:9',
    provenance: {
      sefariaRef: 'Psalms 145:9',
      sefariaUrl: 'https://www.sefaria.org/Psalms.145.9',
      hebrew: { versionTitle: 'Miqra according to the Masorah', license: 'CC-BY-SA' },
    },
  };
  const opts = { id: 'tanakh-x', defaults: { type: 'tanakh' }, now: '2026-11-21T00:00:00.000Z' };

  it('creates a new unverified entry with provenance', () => {
    const r = mergeImported(undefined, imported, opts);
    expect(r.status).toBe('created');
    expect(r.entry).toMatchObject({ id: 'tanakh-x', type: 'tanakh', hebrew: imported.hebrew, verified: false });
    expect(r.entry.provenance).toMatchObject({ sefariaRef: 'Psalms 145:9', importedAt: opts.now });
  });

  it('is idempotent: a re-import with the same text changes nothing, not even importedAt', () => {
    const first = mergeImported(undefined, imported, opts).entry;
    const again = mergeImported(first, imported, { ...opts, now: '2027-01-01T00:00:00.000Z' });
    expect(again.status).toBe('unchanged');
    expect(again.entry).toBe(first);
  });

  it('preserves hand-written fields when updating text', () => {
    const existing = { id: 'tanakh-x', hebrew: 'old', commentary: 'mine', kavannahPrompt: 'mine too', verified: false };
    const r = mergeImported(existing, imported, opts);
    expect(r.status).toBe('updated');
    expect(r.entry).toMatchObject({ commentary: 'mine', kavannahPrompt: 'mine too', hebrew: imported.hebrew });
  });

  it('removes listed fields only when the text changes', () => {
    const existing = { id: 'tanakh-x', hebrew: 'old', transliteration: 'stale', verified: false };
    const r = mergeImported(existing, imported, { ...opts, remove: ['transliteration'] });
    expect(r.entry).not.toHaveProperty('transliteration');

    const current = { ...r.entry, transliteration: 'rewritten to match' };
    const again = mergeImported(current, imported, { ...opts, remove: ['transliteration'] });
    expect(again.status).toBe('unchanged');
    expect(again.entry.transliteration).toBe('rewritten to match');
  });

  it('never overwrites a verified entry without force', () => {
    const existing = { id: 'tanakh-x', hebrew: 'checked by a human', verified: true };
    const r = mergeImported(existing, imported, opts);
    expect(r.status).toBe('skipped_verified');
    expect(r.entry).toBe(existing);
  });

  it('with force, updates a verified entry and resets verified for re-review', () => {
    const existing = { id: 'tanakh-x', hebrew: 'checked by a human', verified: true, reviewNote: 'n' };
    const r = mergeImported(existing, imported, { ...opts, force: true });
    expect(r.status).toBe('updated');
    expect(r.entry).toMatchObject({ verified: false, reviewNote: 'n', hebrew: imported.hebrew });
  });
});

describe('helpers', () => {
  it('builds Sefaria URLs for simple and complex refs', () => {
    expect(sefariaUrl('Psalms 145:9')).toBe('https://www.sefaria.org/Psalms.145.9');
    expect(sefariaUrl('I Samuel 16:7')).toBe('https://www.sefaria.org/I_Samuel.16.7');
    expect(sefariaUrl("Siddur Ashkenaz, Weekday, Shacharit, Pesukei Dezimra, Psalm 146")).toBe(
      'https://www.sefaria.org/Siddur_Ashkenaz,_Weekday,_Shacharit,_Pesukei_Dezimra,_Psalm_146',
    );
  });

  it('estimates 3–12 minutes', () => {
    expect(estimateMinutes('', '')).toBe(3);
    expect(estimateMinutes('א '.repeat(2000), '')).toBe(12);
  });
});
