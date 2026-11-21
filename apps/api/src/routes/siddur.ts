import { Router, Request, Response } from 'express';
import {
  ContentLibrary,
  INTERESTS,
  Interest,
  LANGUAGE_MODES,
  LanguageMode,
  applyLanguageMode,
  getLanguageDisplay,
  getNextSiddurUnit,
} from '@torah/core';

const csv = (value: unknown) =>
  typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

/**
 * GET /v1/siddur/next?completed=a,b&interests=siddur,kavannah&languageMode=mixed
 * Returns the first Siddur unit (in path order) not in `completed`, plus its position.
 */
export function createSiddurRouter(library: ContentLibrary) {
  const router = Router();

  router.get('/next', (req: Request, res: Response) => {
    const completedIds = csv(req.query.completed);
    const interestsRaw = req.query.interests === undefined ? ['siddur', 'kavannah'] : csv(req.query.interests);
    const invalid = interestsRaw.filter((i) => !(INTERESTS as readonly string[]).includes(i));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Unknown interests: ${invalid.join(', ')}` });
    }

    const modeRaw = (req.query.languageMode as string | undefined) ?? 'mixed';
    if (!(LANGUAGE_MODES as readonly string[]).includes(modeRaw)) {
      return res.status(400).json({ error: `languageMode must be one of: ${LANGUAGE_MODES.join(', ')}` });
    }
    const display = getLanguageDisplay(modeRaw as LanguageMode);

    const next = getNextSiddurUnit(library.siddur, completedIds, interestsRaw as Interest[]);
    if (!next) {
      return res.status(404).json({ error: 'No next Siddur unit (path complete or no Siddur interest)' });
    }

    return res.json({
      unit: applyLanguageMode(next.unit, display),
      display,
      position: next.position,
      total: next.total,
      completedCount: next.completedCount,
    });
  });

  return router;
}
