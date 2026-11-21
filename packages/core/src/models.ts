/**
 * Core data models for the Torah Study App.
 * The API is the single runtime that uses these; clients only see the JSON shapes.
 *
 * The id lists below are the single source of truth for every enum. Types are
 * derived from them so runtime validation (profile.ts) and types never drift.
 */

export const FRAMEWORK_IDS = [
  'hasidic',
  'orthodox',
  'modern_orthodox',
  'masorti_conservative',
  'reform',
] as const;
export type FrameworkId = (typeof FRAMEWORK_IDS)[number];

/** Ordered from least to most advanced. Order matters (used for comparisons). */
export const LEARNING_LEVELS = ['beginner', 'intermediate', 'advanced', 'scholar'] as const;
export type LearningLevel = (typeof LEARNING_LEVELS)[number];

export const LANGUAGE_MODES = ['english', 'hebrew', 'split', 'mixed'] as const;
export type LanguageMode = (typeof LANGUAGE_MODES)[number];

export const STUDY_LENGTHS = ['short', 'medium', 'long'] as const;
export type StudyLength = (typeof STUDY_LENGTHS)[number];

export const INTERESTS = [
  'siddur',
  'musar',
  'kabbalah',
  'halachah',
  'tanakh',
  'prayerbook_hebrew',
  'kavannah',
] as const;
export type Interest = (typeof INTERESTS)[number];

/** Ordered from shallowest to deepest. Order matters (used for comparisons). */
export const KABBALAH_DEPTHS = ['symbolic', 'intermediate', 'advanced'] as const;
export type KabbalahDepth = (typeof KABBALAH_DEPTHS)[number];

/** Progress tracks: the sequential Siddur path, and units completed within a day's study. */
export const PROGRESS_PATHS = ['siddur', 'daily'] as const;
export type ProgressPath = (typeof PROGRESS_PATHS)[number];

export interface UserProfile {
  framework: FrameworkId;
  level: LearningLevel;
  interests: Interest[];
  studyLength: StudyLength;
  languageMode: LanguageMode;
  practiceContext?: string; // e.g. "Attends Shacharit minyan"
}

export type UnitType =
  | 'tanakh'
  | 'midrash'
  | 'musar'
  | 'siddur'
  | 'kabbalah'
  | 'halachah'
  | 'commentary';

export interface ReviewItem {
  type: 'hebrew_recognition' | 'shoresh' | 'kavannah' | 'source';
  text: string;
  expected?: string;
}

/** The three text fields that language modes show or hide. */
export interface TextFields {
  hebrew?: string; // pointed (with nikkud) whenever present
  transliteration?: string;
  english?: string;
}

/** A unit as returned to clients inside a DailyStudy. */
export interface StudyUnit extends TextFields {
  /** Unique within a study: `${date}-${contentId}`. */
  id: string;
  /** Stable content-library id (what progress is recorded against). */
  contentId: string;
  type: UnitType;
  title?: string;
  commentary?: string; // framework-appropriate
  kavannahPrompt?: string;
  source?: string;
  reviewItems?: ReviewItem[];
  estimatedMinutes?: number;
}

export interface LanguageDisplay {
  mode: LanguageMode;
  showHebrew: boolean;
  showTransliteration: boolean;
  showEnglish: boolean;
  /** How clients should lay out the text fields that are present. */
  layout: 'stacked' | 'side-by-side' | 'interleaved';
}

export interface DailyStudy {
  date: string; // ISO date YYYY-MM-DD
  profile: Pick<UserProfile, 'framework' | 'level' | 'studyLength' | 'languageMode'>;
  display: LanguageDisplay;
  units: StudyUnit[];
  totalEstimatedMinutes: number;
  budgetMinutes: number;
  notes?: string;
}

export interface SiddurUnit {
  id: string;
  section: string; // e.g. "Pesukei Dezimra", "Shema"
  blessingOrLine: string;
  hebrew: string; // pointed
  transliteration: string;
  english: string;
  commentary: string;
  kavannahPrompt: string;
  source?: string;
  reviewItems?: ReviewItem[];
  estimatedMinutes?: number;
  relatedInterests?: Interest[];
  /** False until a human has checked text, translation and citation against a source. */
  verified: boolean;
  reviewNote?: string;
}

export interface SiddurSection {
  id: string;
  name: string;
  order: number;
  units: SiddurUnit[];
}

/** A non-Siddur unit in the content library, with the metadata used to select it. */
export interface ContentUnit extends Omit<StudyUnit, 'id' | 'contentId'> {
  id: string; // stable content id, e.g. "tanakh-tehillim-145-9"
  interests: Interest[];
  minLevel: LearningLevel;
  /** Omit to allow every framework. */
  frameworks?: FrameworkId[];
  /** Only meaningful for type "kabbalah". Defaults to "symbolic". */
  depth?: KabbalahDepth;
  verified: boolean;
  reviewNote?: string;
}

/** Everything the generator selects from. Supplied by @torah/content (or test fixtures). */
export interface ContentLibrary {
  studyUnits: ContentUnit[];
  siddur: SiddurSection[];
}

export interface Progress {
  userId: string;
  completedUnits: string[];
  hebrewFamiliarity: Record<string, number>; // word or shoresh -> familiarity 0-1
  lastCheckIn?: string;
}

export interface QuizItem {
  id: string;
  type: 'recognition' | 'shoresh' | 'kavannah' | 'source';
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}
