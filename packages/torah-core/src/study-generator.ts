/**
 * Study generator.
 * Pure function: takes UserProfile + date/context and returns structured DailyStudy.
 * All generation rules live here (and in frameworks/levels); backend calls this.
 */

import { UserProfile, DailyStudy, StudyUnit } from './models';
import { getFramework } from './frameworks';
import { getLevel } from './learning-levels';
import { getLanguageOptions } from './language';

export function generateDailyStudy(profile: UserProfile, date: string): DailyStudy {
  const framework = getFramework(profile.framework);
  const level = getLevel(profile.level);
  const lang = getLanguageOptions(profile.languageMode);

  // For Conservative Intermediate medium: prioritize Siddur, Musar, light Kabbalah, Tanakh
  const units: StudyUnit[] = [];

  if (profile.interests.includes('siddur') || profile.interests.includes('kavannah')) {
    units.push({
      id: `${date}-siddur-1`,
      type: 'siddur',
      title: 'Pesukei Dezimra – Baruch She’amar',
      hebrew: 'בָּרוּךְ שֶׁאָמַר וְהָיָה הָעוֹלָם',
      transliteration: lang.includeTransliteration ? 'Baruch she’amar ve’hayah ha’olam' : undefined,
      english: 'Blessed is He who spoke, and the world came into being.',
      commentary: 'In the Conservative tradition this opening of the morning praises focuses on God as Creator through speech. Kavannah is directed toward recognizing the ongoing creative power of the Divine Word.',
      kavannahPrompt: 'Before continuing, take a moment to feel gratitude that the world exists because God spoke.',
      source: 'Siddur, Pesukei Dezimra',
      reviewItems: [
        { type: 'hebrew_recognition', text: 'בָּרוּךְ', expected: 'Baruch' },
        { type: 'shoresh', text: 'אָמַר', expected: 'אמר' },
      ],
      estimatedMinutes: 5,
    });
  }

  if (profile.interests.includes('musar')) {
    units.push({
      id: `${date}-musar-1`,
      type: 'musar',
      title: 'From Mesillat Yesharim – on Kavannah',
      english: 'The beginning of all avodah is the intention of the heart. Without kavannah, the external act remains incomplete.',
      commentary: 'Classic Musar teaching appropriate for intermediate Conservative study: practical focus on directing the heart during prayer and daily life.',
      kavannahPrompt: 'Where in your davening today can you strengthen your kavannah?',
      source: 'Mesillat Yesharim (selected)',
      estimatedMinutes: 4,
    });
  }

  if (profile.interests.includes('kabbalah') && framework.kabbalahDepth !== 'advanced') {
    units.push({
      id: `${date}-kabbalah-1`,
      type: 'kabbalah',
      title: 'Symbolic Light – a Conservative framing',
      english: 'The light of the first day is understood in many traditional sources as a spiritual light hidden for the righteous. For intermediate study we focus on its ethical and symbolic meaning: clarity and kindness in our actions.',
      commentary: 'Presented within Conservative bounds – symbolic and ethical emphasis, not deep theosophy.',
      kavannahPrompt: 'How can the idea of hidden light inspire one act of kindness today?',
      source: 'Midrashic / Kabbalistic framing (introductory)',
      estimatedMinutes: 4,
    });
  }

  // Always include a short Tanakh unit for medium length
  units.push({
    id: `${date}-tanakh-1`,
    type: 'tanakh',
    title: 'Psalm 145 (Ashrei) – selected verse',
    hebrew: 'טוֹב־יְהוָה לַכֹּל וְרַחֲמָיו עַל־כָּל־מַעֲשָׂיו',
    transliteration: lang.includeTransliteration ? 'Tov Adonai lakol verachamav al kol ma’asav' : undefined,
    english: 'The Lord is good to all, and His mercy is upon all His works.',
    commentary: 'Traditional Conservative reading emphasizes universal divine compassion and the call to emulate it in our own conduct.',
    kavannahPrompt: 'As you recite Ashrei this morning, which of God’s works around you invites your gratitude?',
    source: 'Tehillim 145:9',
    reviewItems: [
      { type: 'hebrew_recognition', text: 'טוֹב', expected: 'tov' },
      { type: 'kavannah', text: 'Divine compassion' },
    ],
    estimatedMinutes: 6,
  });

  const total = units.reduce((sum, u) => sum + (u.estimatedMinutes || 5), 0);

  return {
    date,
    profile: {
      framework: profile.framework,
      level: profile.level,
      studyLength: profile.studyLength,
      languageMode: profile.languageMode,
    },
    units,
    totalEstimatedMinutes: total,
    notes: `Generated for ${framework.name} – ${level.name}. Focus on kavannah and traditional sources.`,
  };
}
