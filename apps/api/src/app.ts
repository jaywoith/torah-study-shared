import express, { NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentLibrary } from '@torah/core';
import { contentLibrary } from '@torah/content';
import { AuthConfig, createAuthRouter, loadAuthConfig, requireAuth } from './auth';
import type { Db } from './db';
import { createRepository } from './db/repository';
import { createStudyRouter } from './routes/study';
import { createSiddurRouter } from './routes/siddur';
import { createProfileRouter } from './routes/profile';
import { createProgressRouter } from './routes/progress';
import coachRouter from './routes/coach';
import uiRouter from './routes/ui';
import optionsRouter from './routes/options';
import { createSourcesRouter } from './routes/sources';
import pkg from '../package.json';

export interface AppOptions {
  db: Db;
  /** Override the content library (used by tests). */
  library?: ContentLibrary;
  /** Defaults to loadAuthConfig(process.env). */
  auth?: AuthConfig;
  /** Value for Express "trust proxy" when running behind a reverse proxy. */
  trustProxy?: boolean | number | string;
  /** Directory of the built web app (apps/web/dist). If it exists, it is served at /. */
  webDist?: string;
}

export function createApp(options: AppOptions) {
  const library = options.library ?? contentLibrary;
  const auth = options.auth ?? loadAuthConfig();
  const repo = createRepository(options.db);
  const app = express();

  if (options.trustProxy !== undefined) app.set('trust proxy', options.trustProxy);
  app.use(express.json());

  // Public: health, auth, and the non-sensitive labels the login screen needs.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'torah-study-api', version: pkg.version });
  });
  app.use('/v1/auth', createAuthRouter(auth));
  app.use('/v1/ui-strings', uiRouter);
  app.use('/v1/options', optionsRouter);
  app.use('/v1/sources', createSourcesRouter(library));

  // Everything else requires a session when APP_PASSPHRASE is set.
  app.use('/v1', requireAuth(auth));
  app.use('/v1/study', createStudyRouter(library));
  app.use('/v1/siddur', createSiddurRouter(library, repo));
  app.use('/v1/profile', createProfileRouter(repo));
  app.use('/v1/progress', createProgressRouter(repo, library));
  app.use('/v1/coach', coachRouter);

  // Production: serve the built web app from the same origin (one service, one URL, no CORS).
  if (options.webDist && existsSync(join(options.webDist, 'index.html'))) {
    app.use(express.static(options.webDist, { index: 'index.html', maxAge: '1h' }));
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Log details server-side; never send internal error messages to clients.
  app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
