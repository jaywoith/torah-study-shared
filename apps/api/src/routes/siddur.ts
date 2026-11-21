import { Router, Request, Response } from 'express';
import {
  ContentLibrary,
  SiddurNextResponse,
  applyLanguageMode,
  applyTextPreferences,
  getNextSiddurUnit,
} from '@torah/core';
import type { Repository } from '../db/repository';
import { csv, parseDisplayParams } from './display-params';

/**
 * GET /v1/siddur/next?interests=siddur,kavannah&languageMode=mixed[&showCantillation=true][&divineName=full][&completed=a,b]
 * Returns the first Siddur unit (in path order) not yet completed, plus its position.
 * Completed units come from the database unless `completed` is passed explicitly.
 */
export function createSiddurRouter(library: ContentLibrary, repo: Repository) {
  const router = Router();

  router.get('/next', (req: Request, res: Response) => {
    const completedIds = req.query.completed === undefined ? repo.getPathCompleted('siddur') : csv(req.query.completed);
    const params = parseDisplayParams(req, ['siddur', 'kavannah']);
    if ('error' in params) return res.status(400).json({ error: params.error });

    const next = getNextSiddurUnit(library.siddur, completedIds, params.interests);
    if (!next) {
      return res.status(404).json({ error: 'No next Siddur unit (path complete or no Siddur interest)' });
    }

    const body: SiddurNextResponse = {
      unit: applyTextPreferences(applyLanguageMode(next.unit, params.display), params.prefs),
      display: params.display,
      position: next.position,
      total: next.total,
      completedCount: next.completedCount,
    };
    return res.json(body);
  });

  return router;
}
