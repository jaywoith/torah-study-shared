import { Router, Request, Response } from 'express';
import {
  ContentLibrary,
  MusarNextResponse,
  applyLanguageMode,
  applyTextPreferences,
  buildMusarOutline,
  getNextMusarUnit,
  PathOutlineResponse,
  toStudyUnit,
} from '@torah/core';
import type { Repository } from '../db/repository';
import { csv, parseDisplayParams } from './display-params';

/**
 * GET /v1/musar/next?interests=musar&languageMode=mixed[&showCantillation=true][&divineName=full][&completed=a,b]
 * The first Musar unit (Mesillat Yesharim, then Pirkei Avot) not yet completed.
 */
export function createMusarRouter(library: ContentLibrary, repo: Repository) {
  const router = Router();

  router.get('/next', (req: Request, res: Response) => {
    const completedIds = req.query.completed === undefined ? repo.getPathCompleted('musar') : csv(req.query.completed);
    const params = parseDisplayParams(req, ['musar']);
    if ('error' in params) return res.status(400).json({ error: params.error });

    const next = getNextMusarUnit(library.studyUnits, completedIds, params.interests);
    if (!next) return res.status(404).json({ error: 'No next Musar unit (path complete or no Musar interest)' });

    const body: MusarNextResponse = {
      unit: applyTextPreferences(applyLanguageMode(toStudyUnit(next.unit), params.display), params.prefs),
      display: params.display,
      position: next.position,
      total: next.total,
      completedCount: next.completedCount,
    };
    return res.json(body);
  });

  /** GET /v1/musar/outline: every Musar unit by book and chapter, with saved completion. */
  router.get('/outline', (_req: Request, res: Response) => {
    const body: PathOutlineResponse = buildMusarOutline(library.studyUnits, repo.getPathCompleted('musar'));
    return res.json(body);
  });

  return router;
}
