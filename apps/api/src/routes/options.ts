import { Router, Request, Response } from 'express';
import {
  DIVINE_NAME_MODES,
  FRAMEWORK_IDS,
  INTERESTS,
  LANGUAGE_MODES,
  LEARNING_LEVELS,
  OptionsResponse,
  STUDY_LENGTHS,
  STUDY_LENGTH_MINUTES,
  frameworks,
  learningLevels,
} from '@torah/core';
import { uiStrings } from '@torah/content';

/**
 * GET /v1/options
 * Ids and display names for every profile field, so clients never hard-code them.
 * Framework/level names come from core config; other labels from ui-strings.json.
 */
export function buildOptions(): OptionsResponse {
  const labels = uiStrings.options;
  return {
    frameworks: FRAMEWORK_IDS.map((id) => ({ id, name: frameworks[id].name, description: frameworks[id].description })),
    levels: LEARNING_LEVELS.map((id) => ({ id, name: learningLevels[id].name, description: learningLevels[id].notes })),
    interests: INTERESTS.map((id) => ({ id, name: labels.interests[id] })),
    studyLengths: STUDY_LENGTHS.map((id) => ({ id, name: labels.studyLengths[id], minutes: STUDY_LENGTH_MINUTES[id] })),
    languageModes: LANGUAGE_MODES.map((id) => ({ id, name: labels.languageModes[id] })),
    divineNames: DIVINE_NAME_MODES.map((id) => ({ id, name: labels.divineNames[id] })),
  };
}

const router = Router();
router.get('/', (_req: Request, res: Response) => {
  res.json(buildOptions());
});

export default router;
