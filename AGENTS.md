# AGENTS.md: instructions for AI agents and new developers

Read this file first. It is the operating manual for working in this repo with any LLM or tool.

## 1. Orient (2 minutes)

1. `docs/DEVELOPMENT_PLAN.md`: find the **current milestone** and its unchecked tasks. That is the work.
2. `docs/ARCHITECTURE.md`: the rules for where code goes.
3. `CHANGELOG.md`, under `[Unreleased]`: what has changed since the last release.
4. `docs/DECISIONS.md`: settled decisions. Don't reopen them without a reason, and record a new ADR if you change one.

## 2. Commands

```bash
npm install          # once
npm run check        # typecheck + tests; must pass before every commit
npm test             # tests only
npm run test:watch   # tests in watch mode
npm run dev          # API (:3000) + web (:5173) with hot reload
npm run dev:lan      # same, web reachable from a phone on the LAN
npm run test:e2e     # Playwright smoke test (builds the web app)
npm run db:backup    # back up the SQLite database
npm run start:prod   # build web + run API in production mode (serves the web app)
npx tsx scripts/generate-examples.ts   # after changing generator output or content
npm run version:bump -- <patch|minor|major>   # releases only, see docs/VERSIONING.md
```

## 3. Rules that must not be broken

1. **Logic lives in `packages/core`, content lives in `packages/content/data/*.json`, AI rules live in `packages/ai-rules`.** The API wires them together. Clients (web) only call the API, and may import **types only** from `@torah/core` / `@torah/content`.
2. **`packages/core` is pure.** No I/O, no network, no randomness, no `Date.now()`. Functions take what they need, including the content library, as arguments. Same input means same output.
3. **Enums have one source:** the `*_IDS` / `LEARNING_LEVELS` / etc. arrays in `packages/core/src/models.ts`. Never redeclare a union type elsewhere.
4. **Hebrew is always pointed (nikkud)** when present. Tests enforce this.
5. **Never fabricate sources or quotations.** Every content entry has `verified: false` until a human checks it against a real text. If you are not certain of a quote, citation or nikkud, don't add it. Leave a `reviewNote` or a TODO in the plan.
6. **Every bug fix gets a regression test**, named after the bug where practical.
7. **Don't change public API response shapes without** updating `docs/api.md`, adding a CHANGELOG entry, and (if breaking) following the API versioning rules in `docs/VERSIONING.md`.
8. **Secrets never go in the repo** (`.env` is gitignored; `.env.example` documents every variable).
9. **Migrations are append-only.** Never edit a migration that has shipped; add a new one. Never put content in the database.

## 4. Definition of done (every change)

- [ ] `npm run check` passes
- [ ] Tests added or updated for the change
- [ ] `docs/examples` regenerated if generator output changed (a test fails if you forget)
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] `docs/DEVELOPMENT_PLAN.md` task checkboxes updated
- [ ] Any new decision recorded in `docs/DECISIONS.md`
- [ ] Docs that describe changed behavior updated in the same commit

## 5. Git workflow

- `main` is always releasable, and CI must be green on it.
- Work on a branch (`feature/<short-name>`, `fix/<short-name>`, or the branch your tool assigns). Open a PR to `main`.
- Commit messages: imperative summary line (≤72 chars), blank line, then why. Conventional prefixes (`feat:`, `fix:`, `docs:`, `test:`, `chore:`) are encouraged; they make CHANGELOG writing easier.
- Releases are tags on `main` (`v0.3.0`). See `docs/VERSIONING.md`.

## 6. Handing off

Before ending a session, make sure the plan checkboxes and `[Unreleased]` changelog reflect reality. The next agent should be able to start from Section 1 alone. Don't leave the state only in chat.

## 7. Owner preferences

- Direct, concise, no fluff. State trade-offs when giving options.
- Flag ethical, brand or accuracy risks early; don't lecture.
- The app must stay faithful to the chosen framework (see `docs/user-personas.md`) and honest about sources.
