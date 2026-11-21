# Torah Study

A personal Torah study app: a personalized daily study (Chok LeYisrael style), a step-by-step Siddur path, specialized paths (Musar, Kabbalah, Halachah), and an AI study coach.

**Status:** v0.2.0, Foundation. The API, shared logic and seed content work and are tested. The web app has not been built yet; it's next (v0.3.0). See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md).

**Scope:** personal use (one user). It is built cleanly enough to grow, but there are no multi-tenant, scaling or app-store requirements.

## Start here

| If you want to… | Read |
|---|---|
| Understand what's built and what's next | [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) |
| Understand how the code is structured | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Work on this as an AI agent / new developer | [AGENTS.md](AGENTS.md) |
| Release a version | [docs/VERSIONING.md](docs/VERSIONING.md) |
| Know what tests exist and what each release requires | [docs/TESTING.md](docs/TESTING.md) |
| Add or edit study content | [docs/CONTENT.md](docs/CONTENT.md) |
| Call the API | [docs/api.md](docs/api.md) |
| See why things are the way they are | [docs/DECISIONS.md](docs/DECISIONS.md) |
| See what changed | [CHANGELOG.md](CHANGELOG.md) |

## Quick start

Requires Node 20+ (22 recommended, see `.nvmrc`).

```bash
npm install
npm run check        # typecheck + all tests — must pass before any commit
npm run dev          # API on http://localhost:3000 (hot reload)
```

```bash
curl localhost:3000/health
curl -X POST localhost:3000/v1/study/daily -H 'Content-Type: application/json' \
  -d '{"profile":{"framework":"masorti_conservative","level":"intermediate","interests":["siddur","musar","kabbalah"],"studyLength":"medium","languageMode":"mixed"}}'
```

## Layout

```
apps/
  api/                 Express API — the only runtime that loads the shared packages
  web/                 Web client (v0.3.0, not yet scaffolded)
packages/
  core/                Pure logic: models, generator, Siddur path, language modes, validation
  ai-rules/            AI coach personas, system prompts, constraints
  content/             Study content + UI strings as JSON data
docs/                  Plan, architecture, versioning, testing, content, decisions, API
scripts/               Version bump, example regeneration
.github/workflows/     CI (typecheck + tests on every push/PR)
```

## Frameworks, levels, modes

- **Frameworks:** Hasidic, Orthodox, Modern Orthodox, Masorti/Conservative, Reform. Masorti/Conservative is fully specified; the others are stubs.
- **Levels:** Beginner, Intermediate, Advanced, Scholar.
- **Language modes:** English, Hebrew, Split (side-by-side), Mixed (Hebrew + transliteration + English).
- **Model user:** Conservative, Intermediate, interested in Siddur/kavannah, Musar and Kabbalah, medium length, mixed language. See [docs/user-personas.md](docs/user-personas.md).

## History

This repo was originally `torah-study-shared`, one of five repos. In v0.2.0 the backend was merged in at `apps/api` with its git history kept, and the empty web/iOS/Android repos were retired. See [docs/DECISIONS.md](docs/DECISIONS.md) (ADR-001).
