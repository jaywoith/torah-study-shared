# apps/web (`@torah/web`)

The web client for phone and desktop (one responsive app; design in ADR-013). React + Vite + TypeScript. Becomes an installable PWA in v0.9.0.

```bash
npm run dev        # from repo root: API + web at http://localhost:5173
npm run dev:lan    # reachable from a phone on the same Wi-Fi
npm run test:e2e   # Playwright: smoke flow + rendering checks (4 language modes × light/dark × phone/desktop)
```

Rules: it talks only to the API (`/v1/*`, proxied by Vite), uses `/v1/ui-strings` and `/v1/options` for all shared labels, may import **types only** from `@torah/core` / `@torah/content`, and contains no content or framework logic. The file map is in [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md#appsweb-torahweb).
