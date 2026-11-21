import { Router } from 'express';
import { ContentLibrary, SourcesResponse, summarizeSources } from '@torah/core';

/**
 * GET /v1/sources
 * The text versions the content library uses, with licenses. Public: attribution
 * (required by CC-BY / CC-BY-SA) must be readable by anyone who sees the texts.
 */
export function createSourcesRouter(library: ContentLibrary) {
  const body: SourcesResponse = {
    provider: { name: 'Sefaria', url: 'https://www.sefaria.org' },
    versions: summarizeSources(library),
  };
  const router = Router();
  router.get('/', (_req, res) => res.json(body));
  return router;
}
