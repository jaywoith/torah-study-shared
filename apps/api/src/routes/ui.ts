import { Router, Request, Response } from 'express';
import { uiStrings } from '@torah/content';

const router = Router();

/**
 * GET /v1/ui-strings
 * Shared labels (packages/content/data/ui-strings.json) so every client uses the same copy.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json(uiStrings);
});

export default router;
