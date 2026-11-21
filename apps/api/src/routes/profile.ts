import { Router } from 'express';
import { ProfileResponse, parseUserProfile } from '@torah/core';
import type { Repository } from '../db/repository';

/**
 * GET /v1/profile -> { profile | null }
 * PUT /v1/profile  body: UserProfile -> { profile }
 */
export function createProfileRouter(repo: Repository) {
  const router = Router();

  router.get('/', (_req, res) => {
    const body: ProfileResponse = { profile: repo.getProfile() };
    res.json(body);
  });

  router.put('/', (req, res) => {
    const parsed = parseUserProfile(req.body);
    if (!parsed.ok) return res.status(400).json({ error: 'Invalid profile', issues: parsed.errors });
    repo.saveProfile(parsed.profile);
    const body: ProfileResponse = { profile: parsed.profile };
    return res.json(body);
  });

  return router;
}
