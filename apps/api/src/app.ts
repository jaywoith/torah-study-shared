import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import type { ContentLibrary } from '@torah/core';
import { contentLibrary } from '@torah/content';
import { createStudyRouter } from './routes/study';
import { createSiddurRouter } from './routes/siddur';
import coachRouter from './routes/coach';
import uiRouter from './routes/ui';
import pkg from '../package.json';

export interface AppOptions {
  /** Override the content library (used by tests). */
  library?: ContentLibrary;
}

export function createApp(options: AppOptions = {}) {
  const library = options.library ?? contentLibrary;
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'torah-study-api', version: pkg.version });
  });

  app.use('/v1/study', createStudyRouter(library));
  app.use('/v1/siddur', createSiddurRouter(library));
  app.use('/v1/coach', coachRouter);
  app.use('/v1/ui-strings', uiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Log details server-side; never send internal error messages to clients.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
