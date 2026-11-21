/**
 * HTTP contract types shared by apps/api (producer) and apps/web (consumer, type-only import).
 * Changing these is changing the public API: see AGENTS.md rule 7.
 */

import type { Rendered } from './language';
import type {
  DailyStudy,
  DivineNameMode,
  FrameworkId,
  Interest,
  LanguageDisplay,
  LanguageMode,
  LearningLevel,
  ProgressPath,
  SiddurUnit,
  StudyUnit,
  StudyLength,
  UserProfile,
} from './models';
import type { ValidationResult } from './validation';
import type { SourceVersion } from './content-report';

export interface ApiError {
  error: string;
  issues?: string[];
}

export interface DailyStudyResponse {
  study: DailyStudy;
  validation: ValidationResult;
}

export interface SiddurNextResponse {
  unit: Rendered<SiddurUnit>;
  display: LanguageDisplay;
  position: number;
  total: number;
  completedCount: number;
}

/** GET /v1/musar/next. `unit.id` equals `unit.contentId`. */
export interface MusarNextResponse {
  unit: Rendered<StudyUnit>;
  display: LanguageDisplay;
  position: number;
  total: number;
  completedCount: number;
}

export interface Option<T extends string> {
  id: T;
  name: string;
  description?: string;
}

/** GET /v1/options: everything a client needs to build the profile form. */
export interface OptionsResponse {
  frameworks: Option<FrameworkId>[];
  levels: Option<LearningLevel>[];
  interests: Option<Interest>[];
  studyLengths: (Option<StudyLength> & { minutes: number })[];
  languageModes: Option<LanguageMode>[];
  divineNames: Option<DivineNameMode>[];
}

/** GET /v1/auth/session */
export interface AuthSessionResponse {
  /** False when the server runs without APP_PASSPHRASE (local development). */
  authRequired: boolean;
  authenticated: boolean;
}

/** GET /v1/profile and PUT /v1/profile response. `null` until a profile is saved. */
export interface ProfileResponse {
  profile: UserProfile | null;
}

/** Body for POST and DELETE /v1/progress/complete. `date` (YYYY-MM-DD) is required for path "daily". */
export interface CompleteRequest {
  path: ProgressPath;
  unitId: string;
  date?: string;
}

export interface DailyCompletion {
  date: string;
  unitId: string;
  completedAt: string;
}

/** GET /v1/progress?from=YYYY-MM-DD&to=YYYY-MM-DD */
export interface ProgressResponse {
  siddur: { completed: string[] };
  musar: { completed: string[] };
  daily: DailyCompletion[];
}

/** POST /v1/progress/import: one-time move of browser-stored data to the server. */
export interface ImportRequest {
  profile?: unknown;
  siddurCompleted?: string[];
}

export interface ImportResponse {
  importedProfile: boolean;
  importedSiddur: number;
}

/** GET /v1/sources: text versions the content uses, for the "Sources & licenses" screen. */
export interface SourcesResponse {
  provider: { name: string; url: string };
  versions: SourceVersion[];
}
