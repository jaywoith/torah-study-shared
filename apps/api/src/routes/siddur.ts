import { Router, Request, Response } from 'express';
import {
  ContentLibrary,
  DEFAULT_DIVINE_NAME,
  DEFAULT_SHOW_CANTILLATION,
  DIVINE_NAME_MODES,
  DivineNameMode,
  INTERESTS,
  Interest,
  LANGUAGE_MODES,
  LanguageMode,
  SiddurNextResponse,
  applyLanguageMode,
  applyTextPreferences,
  getLanguageDisplay,
  getNextSiddurUnit,
} from '@torah/core';
import type { Repository } from '../db/repository';

const csv = (value: unknown) =>
  typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

/**
 * GET /v1/siddur/next?interests=siddur,kavannah&languageMode=mixed[&showCantillation=true][&divineName=full][&completed=a,b]
 * Returns the first Siddur unit (in path order) not yet completed, plus its position.
 * Completed units come from the database unless `completed` is passed explicitly.
 */
export function createSiddurRouter(library: ContentLibrary, repo: Repository) {
  const router = Router();

  router.get('/next', (req: Request, res: Response) => {
    const completedIds = req.query.completed === undefined ? repo.getSiddurCompleted() : csv(req.query.completed);
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

    const cantillationRaw = req.query.showCantillation;
    if (cantillationRaw !== undefined && cantillationRaw !== 'true' && cantillationRaw !== 'false') {
      return res.status(400).json({ error: 'showCantillation must be true or false' });
    }
    const showCantillation = cantillationRaw === undefined ? DEFAULT_SHOW_CANTILLATION : cantillationRaw === 'true';

    const divineNameRaw = (req.query.divineName as string | undefined) ?? DEFAULT_DIVINE_NAME;
    if (!(DIVINE_NAME_MODES as readonly string[]).includes(divineNameRaw)) {
      return res.status(400).json({ error: `divineName must be one of: ${DIVINE_NAME_MODES.join(', ')}` });
    }
    const prefs = { showCantillation, divineName: divineNameRaw as DivineNameMode };

    const next = getNextSiddurUnit(library.siddur, completedIds, interestsRaw as Interest[]);
    if (!next) {
      return res.status(404).json({ error: 'No next Siddur unit (path complete or no Siddur interest)' });
    }

    const body: SiddurNextResponse = {
      unit: applyTextPreferences(applyLanguageMode(next.unit, display), prefs),
      display,
      position: next.position,
      total: next.total,
      completedCount: next.completedCount,
    };
    return res.json(body);
  });

  return router;
}
