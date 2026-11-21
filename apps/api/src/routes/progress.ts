import { Router, Request, Response } from 'express';
import {
  CompleteRequest,
  ContentLibrary,
  ImportRequest,
  ImportResponse,
  PROGRESS_PATHS,
  ProgressPath,
  ProgressResponse,
  getSiddurSequence,
  parseUserProfile,
} from '@torah/core';
import type { Repository } from '../db/repository';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isPath = (p: unknown): p is ProgressPath => (PROGRESS_PATHS as readonly unknown[]).includes(p);

/**
 * GET    /v1/progress?from&to       -> ProgressResponse
 * POST   /v1/progress/complete      body: CompleteRequest
 * DELETE /v1/progress/complete      body: CompleteRequest
 * POST   /v1/progress/reset         body: { path }
 * POST   /v1/progress/import        body: ImportRequest (one-time browser → server move)
 */
export function createProgressRouter(repo: Repository, library: ContentLibrary) {
  const router = Router();
  const siddurIds = new Set(getSiddurSequence(library.siddur).map((u) => u.id));
  const dailyIds = new Set([...library.studyUnits.map((u) => u.id), ...siddurIds]);

  /** Validates a CompleteRequest. Returns an error message or the normalized values. */
  function parseComplete(body: unknown): { error: string } | { path: ProgressPath; unitId: string; date: string } {
    const { path, unitId, date } = (body ?? {}) as Partial<CompleteRequest>;
    if (!isPath(path)) return { error: `path must be one of: ${PROGRESS_PATHS.join(', ')}` };
    if (typeof unitId !== 'string') return { error: 'unitId is required' };
    if (path === 'siddur') {
      if (!siddurIds.has(unitId)) return { error: `Unknown Siddur unit: ${unitId}` };
      return { path, unitId, date: '' };
    }
    if (typeof date !== 'string' || !ISO_DATE.test(date)) return { error: 'date (YYYY-MM-DD) is required for daily' };
    if (!dailyIds.has(unitId)) return { error: `Unknown unit: ${unitId}` };
    return { path, unitId, date };
  }

  router.get('/', (req: Request, res: Response) => {
    const { from, to } = req.query;
    for (const v of [from, to]) {
      if (v !== undefined && (typeof v !== 'string' || !ISO_DATE.test(v))) {
        return res.status(400).json({ error: 'from/to must be YYYY-MM-DD' });
      }
    }
    const body: ProgressResponse = {
      siddur: { completed: repo.getSiddurCompleted() },
      daily: repo.getDailyCompleted(from as string | undefined, to as string | undefined),
    };
    return res.json(body);
  });

  router.post('/complete', (req, res) => {
    const parsed = parseComplete(req.body);
    if ('error' in parsed) return res.status(400).json(parsed);
    repo.markComplete(parsed.path, parsed.unitId, parsed.date);
    return res.status(201).json({ ok: true });
  });

  router.delete('/complete', (req, res) => {
    const parsed = parseComplete(req.body);
    if ('error' in parsed) return res.status(400).json(parsed);
    repo.unmarkComplete(parsed.path, parsed.unitId, parsed.date);
    return res.json({ ok: true });
  });

  router.post('/reset', (req, res) => {
    const path = req.body?.path;
    if (!isPath(path)) return res.status(400).json({ error: `path must be one of: ${PROGRESS_PATHS.join(', ')}` });
    return res.json({ ok: true, removed: repo.resetPath(path) });
  });

  router.post('/import', (req, res) => {
    const { profile, siddurCompleted } = (req.body ?? {}) as ImportRequest;
    const result: ImportResponse = repo.transaction(() => {
      let importedProfile = false;
      if (profile !== undefined && repo.getProfile() === null) {
        const parsed = parseUserProfile(profile);
        if (parsed.ok) {
          repo.saveProfile(parsed.profile);
          importedProfile = true;
        }
      }
      const ids = Array.isArray(siddurCompleted) ? siddurCompleted.filter((id) => siddurIds.has(id)) : [];
      const existing = new Set(repo.getSiddurCompleted());
      const fresh = ids.filter((id) => !existing.has(id));
      fresh.forEach((id) => repo.markComplete('siddur', id));
      return { importedProfile, importedSiddur: fresh.length };
    });
    res.json(result);
  });

  return router;
}
