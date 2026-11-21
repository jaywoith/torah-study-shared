/**
 * HTTP contract types shared by apps/api (producer) and apps/web (consumer, type-only import).
 * Changing these is changing the public API: see AGENTS.md rule 7.
 */

import type { Rendered } from './language';
import type {
  DailyStudy,
  FrameworkId,
  Interest,
  LanguageDisplay,
  LanguageMode,
  LearningLevel,
  SiddurUnit,
  StudyLength,
} from './models';
import type { ValidationResult } from './validation';

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
}
