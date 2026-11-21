# Testing

## Commands

```bash
npm run check        # typecheck all workspaces + all tests (what CI runs)
npm test             # tests only
npm run test:watch   # watch mode
npx vitest run packages/core          # one package
npx vitest run -t "Kabbalah"          # by test name
npm run test:e2e                      # Playwright smoke (builds web, starts API on :3100 and preview on :4174)
```

Test runner: **Vitest** (root `vitest.config.mts` picks up `packages/*/test/**/*.test.ts` and `apps/*/test/**/*.test.{ts,tsx}`). Web component tests opt into jsdom with a `// @vitest-environment jsdom` first line. E2E: **Playwright** (`apps/web/playwright.config.ts`, iPhone 13 viewport, Chromium).

## Test layers

| Layer | Where | What it proves | Exists since |
|---|---|---|---|
| **Unit** | `packages/core/test/` | Generator, Siddur path, language modes, validation and profile parsing behave as specified. Uses small fixture content (`fixtures.ts`), not real content, so tests don't break when content changes. | 0.2.0 |
| **Rules** | `packages/ai-rules/test/` | Every framework has a persona; constraints apply to the right frameworks. | 0.2.0 |
| **Content integrity** | `packages/content/test/content.test.ts` | Every JSON entry is well-formed: unique ids, valid enums, pointed Hebrew, sources present, Siddur sections consistent. **Generates and validates a study for every framework × level × length × language mode** (160 combinations) against real content. | 0.2.0 |
| **Golden examples** | `packages/content/test/examples.test.ts` | `docs/examples/*.json` exactly match current generator output, so the docs can't drift. Regenerate with `npx tsx scripts/generate-examples.ts`. | 0.2.0 |
| **API** | `apps/api/test/` | Every endpoint: success, input validation (400), 404, no internal error leakage; profile and progress endpoints incl. import rules; static web serving. `supertest` against `createApp()` on an in-memory DB (`test/helpers.ts`). | 0.2.0 |
| **Web component** | `apps/web/test/` | Each language layout renders correctly (including RTL attributes and Mixed interleaving/fallback); Settings saves the profile using API option names; Siddur marks complete, persists, and handles completion and no-interest states. `fetch` is mocked. | 0.3.0 |
| **End-to-end smoke** | `apps/web/e2e/` (Playwright) | Production build + real API (auth on, fresh in-memory DB) in a phone-sized browser: wrong then right passphrase; RTL Hebrew; mark done survives reload; next day differs; Siddur advances and survives reload; settings persist; sign-out. No page errors. | 0.3.0 |
| **Persistence** | `apps/api/test/db.test.ts` | Migrations apply from empty, are idempotent and ordered; repository reads/writes profile and progress; schema rejects bad paths. In-memory SQLite. | 0.4.0 |
| **Auth** | `apps/api/test/auth.test.ts` | Token signing/expiry/tampering, constant-time passphrase check, production config refusal, protected vs. public routes, login/logout cookie flow, rate limiting, forged cookies. | 0.4.0 |
| **AI coach evals** | `evals/coach/` | A fixed prompt set scored for: cites sources, stays in framework, declines practical psak, pointed Hebrew, no progressive default for traditional frameworks. Calls the real model, so it costs money and is **not** run in CI on every push. | 0.7.0 (planned) |

## Conventions

- **Every bug fix gets a regression test.** Name it after the bug, e.g. `rotates content by date (bug: same study every day)`.
- Core tests use fixtures; content tests use real content. Don't mix them.
- No network in tests (except the explicit eval suite). No real dates: pass dates in.
- Tests describe behavior, not implementation. Assert on outputs.

## Release gates

Which checks must pass before tagging a release.

| Gate | Used for | Requirements |
|---|---|---|
| **G1** | every patch release, every merge to `main` | CI green: typecheck + unit + rules + content + golden + API (+ web component and e2e smoke once they exist) |
| **G2** | minor releases (milestones) | G1 + Playwright smoke passes locally against a production build + **manual checklist** below completed on a phone |
| **G3** | releases that touch AI behavior (0.7.0+ prompt/constraint changes) and 1.0.0 | G2 + `npm run eval:coach` pass rate ≥ 90% with **zero** failures in the "framework boundary" and "declines psak" categories |

### Manual checklist (G2)

- [ ] Today's study loads on a phone in under 2 seconds on Wi-Fi
- [ ] Hebrew renders with correct nikkud and right-to-left direction in all four language modes
- [ ] Switching language mode changes the layout as specified (stacked / side-by-side / interleaved)
- [ ] Sign in works; a wrong passphrase is rejected
- [ ] Siddur path: complete a unit, reload, and the next unit is shown
- [ ] Mark a daily unit done, reload: still done; also visible from another device
- [ ] Yesterday's and tomorrow's studies differ from today's
- [ ] No console errors
- [ ] Any new content units were read through once for accuracy

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR: job `check` (`npm ci` → `npm run typecheck` → `npm test`), then job `e2e` (installs Chromium, runs `npm run test:e2e`). A red CI blocks merging. GitHub's free tier includes CI minutes for private repos, which is more than enough here.
