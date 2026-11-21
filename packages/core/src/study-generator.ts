/**
 * Daily study generator.
 *
 * Pure function: (profile, date, content library) -> DailyStudy.
 * Same inputs always give the same output; a different date rotates the content.
 *
 * Algorithm
 * 1. Filter the library to units eligible for this profile:
 *    framework allowed, unit.minLevel <= user level, and for Kabbalah,
 *    unit depth <= min(framework.kabbalahDepth, level.maxKabbalahDepth).
 * 2. Build categories from the user's interests (Siddur, Musar, Kabbalah, Halachah).
 *    Tanakh is always included as the anchor unit.
 * 3. Within each category, rotate by day number so each date gets a different unit.
 * 4. Fill to the study-length minute budget: Tanakh first (guaranteed), then one
 *    unit per category in interest order; if room remains (long sessions), take
 *    further rounds of the next units in rotation.
 * 5. Apply the language mode to every unit.
 */

import {
  ContentLibrary,
  ContentUnit,
  DailyStudy,
  DEFAULT_DIVINE_NAME,
  DEFAULT_SHOW_CANTILLATION,
  Interest,
  KABBALAH_DEPTHS,
  KabbalahDepth,
  StudyLength,
  StudyUnit,
  UnitType,
  UserProfile,
} from './models';
import { getFramework } from './frameworks';
import { getLevel, levelRank } from './learning-levels';
import { applyLanguageMode, getLanguageDisplay } from './language';
import { applyTextPreferences } from './text-display';
import { SIDDUR_INTERESTS, getSiddurSequence } from './siddur-path';

/** Target minutes per study length. */
export const STUDY_LENGTH_MINUTES: Record<StudyLength, number> = {
  short: 10,
  medium: 20,
  long: 35,
};

const DEFAULT_UNIT_MINUTES = 5;

/** Category order for interest-driven units. Tanakh is handled separately as the anchor. */
const CATEGORY_ORDER: { type: UnitType; interests: Interest[] }[] = [
  { type: 'siddur', interests: SIDDUR_INTERESTS },
  { type: 'musar', interests: ['musar'] },
  { type: 'kabbalah', interests: ['kabbalah'] },
  { type: 'halachah', interests: ['halachah'] },
];

/** Days since 1970-01-01 for an ISO date (YYYY-MM-DD). Throws on invalid input. */
export function dayNumber(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Invalid ISO date: ${isoDate}`);
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const day = Math.floor(ms / 86_400_000);
  if (Number.isNaN(day)) throw new Error(`Invalid ISO date: ${isoDate}`);
  return day;
}

function minDepth(a: KabbalahDepth, b: KabbalahDepth): KabbalahDepth {
  return KABBALAH_DEPTHS.indexOf(a) <= KABBALAH_DEPTHS.indexOf(b) ? a : b;
}

/** The deepest Kabbalah this profile may receive. */
export function effectiveKabbalahDepth(profile: Pick<UserProfile, 'framework' | 'level'>): KabbalahDepth {
  return minDepth(getFramework(profile.framework).kabbalahDepth, getLevel(profile.level).maxKabbalahDepth);
}

/** Candidate pool for a category, in stable library order. */
function candidatesFor(type: UnitType, profile: UserProfile, library: ContentLibrary): ContentUnit[] {
  if (type === 'siddur') {
    // Siddur units come from the Siddur path so content is defined once.
    return getSiddurSequence(library.siddur).map((u) => ({
      id: u.id,
      type: 'siddur' as const,
      title: `${u.section} – ${u.blessingOrLine}`,
      hebrew: u.hebrew,
      transliteration: u.transliteration,
      english: u.english,
      commentary: u.commentary,
      kavannahPrompt: u.kavannahPrompt,
      source: u.source ?? `Siddur, ${u.section}`,
      reviewItems: u.reviewItems,
      estimatedMinutes: u.estimatedMinutes,
      interests: u.relatedInterests ?? ['siddur'],
      minLevel: 'beginner' as const,
      verified: u.verified,
    }));
  }

  const maxDepth = effectiveKabbalahDepth(profile);
  return library.studyUnits.filter((u) => {
    if (u.type !== type) return false;
    if (u.frameworks && !u.frameworks.includes(profile.framework)) return false;
    if (levelRank(u.minLevel) > levelRank(profile.level)) return false;
    if (u.type === 'kabbalah' && KABBALAH_DEPTHS.indexOf(u.depth ?? 'symbolic') > KABBALAH_DEPTHS.indexOf(maxDepth)) {
      return false;
    }
    return true;
  });
}

function toStudyUnit(unit: ContentUnit, date: string): StudyUnit {
  const { interests, minLevel, frameworks, depth, verified, reviewNote, ...rest } = unit;
  return { ...rest, id: `${date}-${unit.id}`, contentId: unit.id };
}

const minutesOf = (u: ContentUnit) => u.estimatedMinutes ?? DEFAULT_UNIT_MINUTES;

export function generateDailyStudy(profile: UserProfile, date: string, library: ContentLibrary): DailyStudy {
  const framework = getFramework(profile.framework);
  const level = getLevel(profile.level);
  const display = getLanguageDisplay(profile.languageMode);
  const budget = STUDY_LENGTH_MINUTES[profile.studyLength];
  const day = dayNumber(date);

  const categories = CATEGORY_ORDER.filter((c) => c.interests.some((i) => profile.interests.includes(i)))
    .map((c) => ({ type: c.type, pool: candidatesFor(c.type, profile, library) }))
    .filter((c) => c.pool.length > 0);
  const tanakhPool = candidatesFor('tanakh', profile, library);

  const chosen = new Set<string>();
  const picked: ContentUnit[] = [];
  let anchor: ContentUnit | undefined;
  let used = 0;

  // Rotation: the pool index advances one per day; round r takes the r-th next unit.
  const pickFrom = (pool: ContentUnit[], round: number): ContentUnit | undefined => {
    if (round >= pool.length) return undefined;
    const unit = pool[(day + round) % pool.length];
    return chosen.has(unit.id) ? undefined : unit;
  };

  if (tanakhPool.length > 0) {
    anchor = pickFrom(tanakhPool, 0)!;
    chosen.add(anchor.id);
    used += minutesOf(anchor);
  }

  const maxRounds = Math.max(0, ...categories.map((c) => c.pool.length));
  for (let round = 0; round < maxRounds; round++) {
    let addedThisRound = false;
    for (const category of categories) {
      const unit = pickFrom(category.pool, round);
      if (!unit) continue;
      if (used + minutesOf(unit) > budget && (picked.length > 0 || anchor)) continue;
      picked.push(unit);
      chosen.add(unit.id);
      used += minutesOf(unit);
      addedThisRound = true;
    }
    if (!addedThisRound) break;
  }

  // Group by category order so a long session reads Siddur, Siddur, Musar, ... then Tanakh.
  const order = CATEGORY_ORDER.map((c) => c.type);
  picked.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  const selected = anchor ? [...picked, anchor] : picked;

  // Defaults guard callers that pass an unparsed (pre-v0.5) profile.
  const prefs = {
    showCantillation: profile.showCantillation ?? DEFAULT_SHOW_CANTILLATION,
    divineName: profile.divineName ?? DEFAULT_DIVINE_NAME,
  };
  const units = selected.map((u) => applyTextPreferences(applyLanguageMode(toStudyUnit(u, date), display), prefs));

  return {
    date,
    profile: {
      framework: profile.framework,
      level: profile.level,
      studyLength: profile.studyLength,
      languageMode: profile.languageMode,
      showCantillation: prefs.showCantillation,
      divineName: prefs.divineName,
    },
    display,
    units,
    totalEstimatedMinutes: units.reduce((sum, u) => sum + (u.estimatedMinutes ?? DEFAULT_UNIT_MINUTES), 0),
    budgetMinutes: budget,
    notes: `Generated for ${framework.name} – ${level.name}, ${profile.studyLength} session (${budget} min target).`,
  };
}
