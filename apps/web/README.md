# apps/web (planned for v0.3.0)

The web client: React + Vite + TypeScript, installable as a PWA in v0.8.0.

Not scaffolded yet. The task list is in [docs/DEVELOPMENT_PLAN.md](../../docs/DEVELOPMENT_PLAN.md#v030-web-app-shell-current).

Rules: it talks only to the API (`/v1/*`), uses `/v1/ui-strings` for shared labels, may import **types only** from `@torah/core`, and contains no content or framework logic.
