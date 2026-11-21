import { Router, Request, Response } from 'express';
import { ContentLibrary, generateDailyStudy, parseUserProfile, validateDailyStudy } from '@torah/core';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * POST /v1/study/daily
 * Body: { profile: UserProfile, date?: "YYYY-MM-DD" }
 * Generates, validates, and returns a DailyStudy. 422 if validation fails.
 */
export function createStudyRouter(library: ContentLibrary) {
  const router = Router();

  router.post('/daily', (req: Request, res: Response) => {
    const { profile, date } = (req.body ?? {}) as { profile?: unknown; date?: unknown };

    const parsed = parseUserProfile(profile);
    if (!parsed.ok) {
      return res.status(400).json({ error: 'Invalid profile', issues: parsed.errors });
    }

    if (date !== undefined && (typeof date !== 'string' || !ISO_DATE.test(date) || Number.isNaN(Date.parse(date)))) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const studyDate = (date as string | undefined) ?? new Date().toISOString().slice(0, 10);
    const study = generateDailyStudy(parsed.profile, studyDate, library);
    const validation = validateDailyStudy(study);

    if (!validation.valid) {
      return res.status(422).json({ error: 'Generated study failed validation', issues: validation.issues, study });
    }

    return res.json({ study, validation });
  });

  return router;
}
