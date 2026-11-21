# apps/web (`@torah/web`)

The phone-first web client. React + Vite + TypeScript. Becomes an installable PWA in v0.8.0.

```bash
npm run dev        # from repo root: API + web at http://localhost:5173
npm run dev:lan    # reachable from a phone on the same Wi-Fi
npm run test:e2e   # Playwright smoke test against a production build
```

Rules: it talks only to the API (`/v1/*`, proxied by Vite), uses `/v1/ui-strings` and `/v1/options` for all shared labels, may import **types only** from `@torah/core` / `@torah/content`, and contains no content or framework logic. The file map is in [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md#appsweb-torahweb).
