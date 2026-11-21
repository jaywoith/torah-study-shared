/**
 * Text display transforms (ADR-011). Strings here are test inputs built from
 * real Masoretic mark patterns (as Sefaria's "Miqra according to the Masorah"
 * writes them), not content.
 */
import { describe, expect, it } from 'vitest';
import {
  applyDivineName,
  applyDivineNameEnglish,
  applyDivineNameTransliteration,
  applyTextPreferences,
  hasCantillation,
  parseUserProfile,
  stripCantillation,
} from '../src';
import { modelUser } from './fixtures';

const ETNAHTA = '֑';
const TIPEHA = '֖';
const MERKHA = '֥';
const METEG = 'ֽ';
const PASEQ = '׀';
const SOF_PASUQ = '׃';
const MAQAF = '־';
const QAMATS_QATAN = 'ׇ';

describe('stripCantillation', () => {
  it('removes te\'amim and keeps nikkud', () => {
    expect(stripCantillation(`יְהֹוָ${MERKHA}ה`)).toBe('יְהֹוָה');
    expect(stripCantillation(`בְּרֵאשִׁ${TIPEHA}ית`)).toBe('בְּרֵאשִׁית');
  });

  it('removes meteg', () => {
    expect(stripCantillation(`וַ${METEG}יְהִי`)).toBe('וַיְהִי');
  });

  it('removes paseq and collapses the space around it', () => {
    expect(stripCantillation(`אָמַר ${PASEQ} לוֹ`)).toBe('אָמַר לוֹ');
  });

  it('keeps sof pasuq, maqaf and qamats qatan', () => {
    const text = `כׇּל${MAQAF}הָאָ${ETNAHTA}רֶץ${SOF_PASUQ}`.replace('כׇּ', `כ${QAMATS_QATAN}ּ`);
    const out = stripCantillation(text);
    expect(out).toContain(SOF_PASUQ);
    expect(out).toContain(MAQAF);
    expect(out).toContain(QAMATS_QATAN);
    expect(hasCantillation(out)).toBe(false);
  });

  it('leaves text without te\'amim unchanged', () => {
    const text = 'טוֹב־יְהוָה לַכֹּל וְרַחֲמָיו';
    expect(stripCantillation(text)).toBe(text);
  });
});

describe('applyDivineName', () => {
  const variants = [
    'יְהוָה', // common pointing
    'יְהֹוָה', // with holam (Sefaria Miqra)
    `יְהֹוָ${MERKHA}ה`, // with a ta'am
    `יְהֹוָ${METEG}ה`, // with meteg
    'יהוה', // unpointed
  ];

  it.each(variants)('abbreviates %s to ה׳', (name) => {
    expect(applyDivineName(name, 'abbreviated')).toBe('ה׳');
  });

  it.each(variants)('writes %s as יְיָ in yud_yud mode', (name) => {
    expect(applyDivineName(name, 'yud_yud')).toBe('יְיָ');
  });

  it('leaves the text as in the source in full mode', () => {
    for (const v of variants) expect(applyDivineName(v, 'full')).toBe(v);
  });

  it('keeps prefixes and their vowels', () => {
    expect(applyDivineName('לַיהוָה', 'abbreviated')).toBe('לַה׳');
    expect(applyDivineName('וַיהוָה', 'yud_yud')).toBe('וַיְיָ');
    expect(applyDivineName('וּבַיהוָה', 'abbreviated')).toBe('וּבַה׳');
    expect(applyDivineName('מֵיְהוָה', 'abbreviated')).toBe('מֵה׳');
  });

  it('works inside a verse and after a maqaf', () => {
    expect(applyDivineName('טוֹב־יְהוָה לַכֹּל', 'abbreviated')).toBe('טוֹב־ה׳ לַכֹּל');
    expect(applyDivineName('קָרוֹב יְהוָה לְכָל־קֹרְאָיו', 'yud_yud')).toBe('קָרוֹב יְיָ לְכָל־קֹרְאָיו');
  });

  it('keeps sof pasuq after the Name', () => {
    expect(applyDivineName(`יְהוָֽה${SOF_PASUQ}`, 'abbreviated')).toBe(`ה׳${SOF_PASUQ}`);
  });

  it('replaces every occurrence', () => {
    expect(applyDivineName('יְהוָה אֶחָד יְהוָה', 'abbreviated')).toBe('ה׳ אֶחָד ה׳');
  });

  it('abbreviates a source that already writes יְיָ', () => {
    expect(applyDivineName('בָּרוּךְ אַתָּה יְיָ', 'abbreviated')).toBe('בָּרוּךְ אַתָּה ה׳');
    expect(applyDivineName('לַייָ', 'abbreviated')).toBe('לַה׳');
  });

  it('does not touch words that only contain the letters', () => {
    for (const word of ['יְהוּדָה', 'וִיהוּדָה', 'יְהוֹשֻׁעַ', 'יְהוֹנָתָן', 'אֵלִיָּהוּ', 'בְּיַיִן', 'חַיַּי', 'וְהָיָה']) {
      expect(applyDivineName(word, 'abbreviated')).toBe(word);
    }
  });

  it('does not touch other Divine Names (Tetragrammaton only, owner decision 2026-11-21)', () => {
    for (const word of ['אֱלֹהִים', 'אֲדֹנָי', 'אֵל', 'שַׁדַּי']) {
      expect(applyDivineName(word, 'abbreviated')).toBe(word);
    }
  });

  it('uses ה׳ for the Name pointed to be read Elohim, even in yud_yud mode', () => {
    // אֲדֹנָי יֱהֹוִה: hiriq under the vav.
    expect(applyDivineName('אֲדֹנָי יֱהֹוִה', 'yud_yud')).toBe('אֲדֹנָי ה׳');
    expect(applyDivineName('אֲדֹנָי יֱהֹוִה', 'abbreviated')).toBe('אֲדֹנָי ה׳');
    expect(applyDivineName('אֲדֹנָי יֱהוִה', 'yud_yud')).toBe('אֲדֹנָי ה׳');
  });
});

describe('applyDivineNameTransliteration', () => {
  it('uses Hashem when abbreviated, keeping case', () => {
    expect(applyDivineNameTransliteration('Tov Adonai lakol', 'abbreviated')).toBe('Tov Hashem lakol');
    expect(applyDivineNameTransliteration('baruch atah adonai', 'abbreviated')).toBe('baruch atah hashem');
    expect(applyDivineNameTransliteration('ADONAI', 'abbreviated')).toBe('HASHEM');
  });

  it('keeps Adonai for full and yud_yud', () => {
    expect(applyDivineNameTransliteration('Tov Adonai lakol', 'full')).toBe('Tov Adonai lakol');
    expect(applyDivineNameTransliteration('Tov Adonai lakol', 'yud_yud')).toBe('Tov Adonai lakol');
  });

  it('does not change words that merely start with Adonai', () => {
    expect(applyDivineNameTransliteration('Adonaim', 'abbreviated')).toBe('Adonaim');
  });
});

describe('applyDivineNameEnglish', () => {
  it('replaces the spelled-out Name "Adonoy" only when abbreviated', () => {
    expect(applyDivineNameEnglish('Blessed are You, Adonoy our God', 'abbreviated')).toBe('Blessed are You, Hashem our God');
    expect(applyDivineNameEnglish('Blessed are You, Adonoy our God', 'full')).toBe('Blessed are You, Adonoy our God');
    expect(applyDivineNameEnglish('Blessed are You, Adonoy our God', 'yud_yud')).toBe('Blessed are You, Adonoy our God');
  });

  it('leaves translations of the Name alone', () => {
    expect(applyDivineNameEnglish('The LORD is my shepherd; God is good', 'abbreviated')).toBe('The LORD is my shepherd; God is good');
  });
});

describe('applyTextPreferences', () => {
  const unit = {
    hebrew: `טוֹב־יְהֹוָ${MERKHA}ה לַכֹּל`,
    transliteration: 'Tov Adonai lakol',
    english: 'The LORD is good to all',
  };

  it('defaults: abbreviated Name, cantillation hidden, English translation untouched', () => {
    const out = applyTextPreferences(unit, { showCantillation: false, divineName: 'abbreviated' });
    expect(out).toEqual({ hebrew: 'טוֹב־ה׳ לַכֹּל', transliteration: 'Tov Hashem lakol', english: unit.english });
  });

  it('full + cantillation shown returns the source text', () => {
    expect(applyTextPreferences(unit, { showCantillation: true, divineName: 'full' })).toEqual(unit);
  });

  it('cantillation shown keeps te\'amim outside the Name', () => {
    const out = applyTextPreferences({ hebrew: `יְהוָה אֶ${ETNAHTA}חָד` }, { showCantillation: true, divineName: 'abbreviated' });
    expect(out.hebrew).toBe(`ה׳ אֶ${ETNAHTA}חָד`);
  });

  it('leaves absent fields absent and does not mutate the input', () => {
    const input = { english: 'only English' };
    const out = applyTextPreferences(input, { showCantillation: false, divineName: 'abbreviated' });
    expect(out).toEqual({ english: 'only English' });
    expect(out).not.toBe(input);
  });
});

describe('profile display settings', () => {
  it('default when missing so v0.4 profiles keep working', () => {
    const { showCantillation, divineName, ...v04 } = modelUser;
    const r = parseUserProfile(v04);
    expect(r.ok && r.profile.showCantillation).toBe(false);
    expect(r.ok && r.profile.divineName).toBe('abbreviated');
  });

  it('accept valid values', () => {
    const r = parseUserProfile({ ...modelUser, showCantillation: true, divineName: 'yud_yud' });
    expect(r.ok && r.profile).toMatchObject({ showCantillation: true, divineName: 'yud_yud' });
  });

  it('reject invalid values', () => {
    const r = parseUserProfile({ ...modelUser, showCantillation: 'yes', divineName: 'hashem' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(2);
  });
});
