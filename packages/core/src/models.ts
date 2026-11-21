/**
 * Core data models for the Torah Study App.
 * All clients and backend share these types via the torah-core package.
 * Backend is the single source of truth; clients never hard-code framework logic.
 */

export type FrameworkId =
  | 'hasidic'
  | 'orthodox'
  | 'modern_orthodox'
  | 'masorti_conservative'
  | 'reform';

export type LearningLevel = 'beginner' | 'intermediate' | 'advanced' | 'scholar';

export type LanguageMode = 'english' | 'hebrew' | 'split' | 'mixed';

export type StudyLength = 'short' | 'medium' | 'long';

export type Interest =
  | 'siddur'
  | 'musar'
  | 'kabbalah'
  | 'halachah'
  | 'tanakh'
  | 'prayerbook_hebrew'
  | 'kavannah';

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

export interface StudyUnit {
  id: string;
  type: UnitType;
  title?: string;
  hebrew?: string; // pointed where present
  transliteration?: string;
  english: string;
  commentary?: string; // framework-appropriate
  kavannahPrompt?: string;
  source?: string;
  reviewItems?: ReviewItem[];
  estimatedMinutes?: number;
}

export interface DailyStudy {
  date: string; // ISO date
  profile: Pick<UserProfile, 'framework' | 'level' | 'studyLength' | 'languageMode'>;
  units: StudyUnit[];
  totalEstimatedMinutes: number;
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
  relatedInterests?: Interest[];
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
