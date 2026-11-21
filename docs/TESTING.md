# Testing

## Commands

```bash
npm run check        # typecheck all workspaces + all tests (what CI runs)
npm test             # tests only
npm run test:watch   # watch mode
npx vitest run packages/core          # one package
npx vitest run -t "Kabbalah"          # by test name
```

Test runner: **Vitest** (root `vitest.config.ts` picks up `packages/*/test/**/*.test.ts` and `apps/*/test/**/*.test.ts`).

## Test layers

| Layer | Where | What it proves | Exists since |
|---|---|---|---|
| **Unit** | `packages/core/test/` | Generator, Siddur path, language modes, validation and profile parsing behave as specified. Uses small fixture content (`fixtures.ts`), not real content, so tests don't break when content changes. | 0.2.0 |
| **Rules** | `packages/ai-rules/test/` | Every framework has a persona; constraints apply to the right frameworks. | 0.2.0 |
| **Content integrity** | `packages/content/test/content.test.ts` | Every JSON entry is well-formed: unique ids, valid enums, pointed Hebrew, sources present, Siddur sections consistent. **Generates and validates a study for every framework × level × length × language mode** (160 combinations) against real content. | 0.2.0 |
| **Golden examples** | `packages/content/test/examples.test.ts` | `docs/examples/*.json` exactly match current generator output, so the docs can't drift. Regenerate with `npx tsx scripts/generate-examples.ts`. | 0.2.0 |
| **API** | `apps/api/test/` | Every endpoint: success, input validation (400), 404, no internal error leakage. Uses `supertest` against `createApp()` with no network or port. | 0.2.0 |
| **Web component** | `apps/web/test/` | Unit cards render correctly per language mode, RTL handling, UI strings used. | 0.3.0 (planned) |
| **End-to-end smoke** | `apps/web/e2e/` (Playwright) | Real browser against a real API: daily study loads; Siddur unit can be completed and the next one appears. | 0.3.0 (planned) |
| **Persistence** | `apps/api/test/db/` | Repository layer against a temporary SQLite file; migrations run cleanly from empty. | 0.4.0 (planned) |
| **AI coach evals** | `evals/coach/` | A fixed prompt set scored for: cites sources, stays in framework, declines practical psak, pointed Hebrew, no progressive default for traditional frameworks. Calls the real model, so it costs money and is **not** run in CI on every push. | 0.6.0 (planned) |

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
| **G3** | releases that touch AI behavior (0.6.0+ prompt/constraint changes) and 1.0.0 | G2 + `npm run eval:coach` pass rate ≥ 90% with **zero** failures in the "framework boundary" and "declines psak" categories |

### Manual checklist (G2)

- [ ] Today's study loads on a phone in under 2 seconds on Wi-Fi
- [ ] Hebrew renders with correct nikkud and right-to-left direction in all four language modes
- [ ] Switching language mode changes the layout as specified (stacked / side-by-side / interleaved)
- [ ] Siddur path: complete a unit, reload, and the next unit is shown
- [ ] Yesterday's and tomorrow's studies differ from today's
- [ ] No console errors
- [ ] Any new content units were read through once for accuracy

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR: `npm ci` → `npm run typecheck` → `npm test`. A red CI blocks merging. GitHub's free tier includes CI minutes for private repos, which is more than enough here.
