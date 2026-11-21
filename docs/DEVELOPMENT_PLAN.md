# Development Plan

**Current version:** 0.3.0-rc.1
**Current milestone:** v0.3.0, Web App Shell
**Last updated:** 2026-11-21

This is the master plan. Every milestone is a minor version (pre-1.0). Tick the boxes as work lands; an agent picking up the project starts at the first unchecked task in the current milestone. Release gates (G1–G3) are defined in [TESTING.md](TESTING.md#release-gates).

---

## Product direction

- **Personal tool, one user.** Optimize for daily usefulness and correctness, not scale.
- **Web first, installable as a PWA.** No native iOS/Android app is planned (ADR-002). A PWA added to the iPhone home screen gives an app icon, full-screen use and offline caching. Revisit native only if a concrete need appears that a PWA can't meet (reliable push reminders, home-screen widgets, Apple Watch).
- **Correctness over volume.** A smaller set of verified texts beats a large unverified one.

## Roadmap at a glance

| Version | Milestone | Outcome | Gate |
|---|---|---|---|
| 0.1.0 | Prototype | Five-repo skeleton, Conservative seed content | — |
| **0.2.0** | **Foundation** ✅ | Monorepo, bugs fixed, content as data, 87 tests, CI, docs | G1 |
| 0.3.0 | Web App Shell 🟡 rc.1 | Usable daily study + Siddur path in a browser | G2 |
| 0.4.0 | Persistence & Progress | Profile and progress saved server-side; Siddur path remembers place | G2 |
| 0.5.0 | Real Content | Verified texts from a licensed source; full Pesukei Dezimra; Musar sequence | G2 |
| 0.6.0 | AI Study Coach | Real LLM coach bound by shared personas and constraints, with an eval suite | G3 |
| 0.7.0 | Review & Check-ins | Spaced-repetition review from reviewItems; weekly check-in | G2 |
| 0.8.0 | PWA & Deploy | Installed on phone, works offline, hosted privately | G2 |
| 1.0.0 | Daily Driver | Used daily for 30 days; all deferred accuracy issues resolved | G3 |
| post-1.0 | Expansion | Other frameworks fleshed out, Kabbalah/Halachah paths, Hebrew analyzer | per release |

---

## v0.2.0: Foundation ✅ (released)

- [x] Consolidate five repos into one npm-workspaces monorepo (backend history preserved under `apps/api`)
- [x] Move content out of code into `packages/content/data/*.json`
- [x] Fix: daily study identical every day → date-based rotation
- [x] Fix: `level` and `studyLength` ignored → level filtering + minute budgets
- [x] Fix: Siddur "next" never advanced → real sequence honoring completed units
- [x] Fix: Kabbalah excluded for Hasidic users → depth = min(framework cap, level cap)
- [x] Fix: language modes not distinct → four distinct display contracts
- [x] Fix: duplicate `FrameworkId` type → single source in core
- [x] Fix: validation false positives / only 2 of 4 traditional frameworks checked
- [x] Fix: no-progressive constraint applied to Conservative only
- [x] Fix: `extractShorest` typo, `getPartOfSpeech` always `'verb'`, API leaking error messages
- [x] Fix: backend didn't build (missing submodule)
- [x] Unit, content-integrity and API tests (vitest + supertest); CI on GitHub Actions
- [x] Versioning, testing, content, architecture, decisions docs; AGENTS.md

## v0.3.0: Web App Shell (current, 0.3.0-rc.1 cut)

**Goal:** open a browser, see today's study and the next Siddur unit, rendered correctly in all four language modes.

- [x] Scaffold `apps/web` (Vite + React + TypeScript), add it to the root `workspaces`
- [x] Dev proxy `/v1` → API; `npm run dev` starts both API and web (`npm run dev:lan` exposes it to a phone on the same Wi-Fi)
- [x] Typed API client (`apps/web/src/api.ts`); contract types in `packages/core/src/api-types.ts`, imported **type-only**
- [x] Load `/v1/ui-strings` and `/v1/options` (new endpoint); no hard-coded shared labels or option names
- [x] Profile settings screen (framework, level, interests, length, language mode, practice context), stored in `localStorage` until v0.4
- [x] Daily study screen: unit cards with Hebrew (RTL, Noto Serif Hebrew, self-hosted), transliteration, English, commentary, kavannah prompt, review items, source
- [x] Language layouts: stacked / side-by-side / interleaved (sentence-aligned, falls back to stacked) per `display.layout`
- [x] Siddur path screen: next unit, "Unit n of N", progress bar, mark complete, reset (completed ids in `localStorage`)
- [x] Previous/next day buttons and date picker (local calendar date, not UTC)
- [x] Mobile-first layout with bottom tabs, safe-area insets, dark mode
- [x] Component tests (Vitest + Testing Library, jsdom) for language layouts, Settings and Siddur screens
- [x] Playwright smoke test against a production build: daily study → next day differs → Siddur advances and persists across reload → English mode removes Hebrew
- [x] CI runs web tests + Playwright smoke (separate `e2e` job)
- [x] Accessibility: `lang="he"` / `dir="rtl"` on Hebrew, labelled controls, visible focus rings, keyboard navigable
- [ ] **Owner:** run the G2 manual checklist (docs/TESTING.md) on a phone via `npm run dev:lan`, then release 0.3.0

**Done when:** gate G2 passes and the owner can use it for a morning session on a phone browser.

## v0.4.0: Persistence & Progress

**Goal:** the app remembers who you are and where you are.

- [ ] SQLite via a light library (better-sqlite3 or Drizzle + SQLite); migrations checked into repo
- [ ] Tables: `profile`, `completed_units` (unit id, date, path), `review_results`
- [ ] Single-user auth: passphrase → signed session cookie (enough for a private deployment; see ADR-006 when written)
- [ ] Endpoints: `GET/PUT /v1/profile`, `POST /v1/progress/complete`, `GET /v1/progress`; `/v1/siddur/next` reads completed units from DB
- [ ] Web: replace `localStorage` profile/progress with API; one-time import of existing local data
- [ ] Daily study history: revisit past days; mark units done
- [ ] Backup: `npm run db:backup` (copy of the SQLite file with a timestamp)
- [ ] Tests: repository layer against a temp SQLite file; API tests for new endpoints

## v0.5.0: Real Content

**Goal:** content you can trust, at enough volume for months of daily use.

- [ ] Decide the text source and record an ADR (likely the Sefaria API/exports; check the license of each text and translation, prefer CC-BY/CC0 or public domain, and avoid copyrighted translations such as modern JPS unless licensed)
- [ ] Import script `scripts/import-*.ts` → writes JSON into `packages/content/data/` with source + license per entry
- [ ] Siddur: complete Pesukei Dezimra in order (Ashkenaz / Sim Shalom order, which is the right fit for a Conservative user), then Shema and its Blessings, then Amidah
- [ ] Musar: sequential Mesillat Yesharim path (chapter by chapter) + Pirkei Avot
- [ ] Tanakh pool: at least 60 units so rotation doesn't repeat for 2 months
- [ ] Content review workflow: `verified: true` only after human check; an `npm run content:report` lists unverified entries
- [ ] Resolve deferred issues D2 (source accuracy) and D3 (Divine Name policy), below
- [ ] Content tests extended: license field required; no duplicate texts

## v0.6.0: AI Study Coach

**Goal:** a real coach that stays inside the framework and cites sources.

- [ ] Resolve deferred issue D4 (naming and "not a posek" framing) **before** shipping
- [ ] LLM provider: Anthropic Claude API (check the current model list and pricing at implementation time; don't hard-code model IDs from memory). Key in `.env` only
- [ ] `packages/ai-rules`: `buildSystemPrompt(profile)` composes the persona + framework/level prompt file + constraints + user practice context
- [ ] System prompt files for Conservative at every level; stubs are acceptable for other frameworks
- [ ] `POST /v1/coach/message` streams a real reply; conversation history persisted (v0.4 DB)
- [ ] Post-validation: reply cites at least one source; Hebrew pointed; no progressive-default markers for traditional frameworks; failures are retried once, then returned with a warning
- [ ] Coach can see recent completed units and review results for context
- [ ] **Eval suite** `evals/coach/*.yaml`: ~30 fixed prompts with expected properties (cites sources, stays in framework, refuses psak, handles off-topic). `npm run eval:coach`. Required for gate G3
- [ ] Cost guard: per-day token cap configured in `.env`

## v0.7.0: Review & Check-ins

- [ ] Quiz generation from `reviewItems` (recognition, shoresh, kavannah, source)
- [ ] Spaced repetition (SM-2 or simpler Leitner boxes) on Hebrew words and shorashim
- [ ] Weekly check-in screen: summary of completed units, Musar reflections, Hebrew progress; optional coach conversation
- [ ] Hebrew familiarity tracking (`Progress.hebrewFamiliarity`)

## v0.8.0: PWA & Deploy

- [ ] Web app manifest, icons, service worker (Workbox / vite-plugin-pwa)
- [ ] Offline: cache today's and tomorrow's study, the next Siddur units, and UI strings
- [ ] Hosting decision (ADR): (a) **home server/NAS + Tailscale**: free, private, HTTPS via Tailscale, nothing public; or (b) **small cloud host** (Fly.io/Render, ~$5–10/mo): reachable anywhere, needs the v0.4 auth hardened. Recommendation: (a) if a home machine is always on, otherwise (b)
- [ ] Production run script, health check, daily DB backup off-machine
- [ ] Optional: daily reminder (web push works on iOS for installed PWAs; reliability to be tested)

## v1.0.0: Daily Driver

- [ ] Used for 30 consecutive days without blocking bugs
- [ ] All deferred issues (D1–D5) closed
- [ ] Gate G3 passes
- [ ] README and docs reflect the shipped product

## Post-1.0 backlog (unordered)

- Flesh out Hasidic, Orthodox, Modern Orthodox and Reform configs, personas and content
- Kabbalah path and Halachah path as sequential tracks (definitions exist in `packages/core/src/paths.ts`)
- Real Hebrew morphological analysis for shoresh/POS (replace lookup tables)
- Audio: recorded or TTS pronunciation of Hebrew lines
- Calendar awareness: parashah of the week, holidays, Hebrew date (e.g. `@hebcal/core`)
- Native iOS app, **only** if a PWA limitation actually blocks use

---

## Deferred issues (from the 2026-11 review)

These were flagged and intentionally deferred. Each has a target milestone.

| ID | Issue | Target |
|---|---|---|
| D1 | `docs/user-personas.md` contains the owner's name and personal observance details. Low risk once repos are private; genericize before ever making the repo public. | before any public release |
| D2 | **Source accuracy.** The Mesillat Yesharim quote in `study-units.json` is unverified and may be a paraphrase; the hidden-light unit should cite Chagigah 12a / Bereishit Rabbah 3:6. All seed content is `verified: false`. | v0.5.0 |
| D3 | **Divine Name display.** Content currently shows the Tetragrammaton fully pointed (e.g. Tehillim 145:9). Decide a policy (e.g. render as ה׳ or יְיָ, perhaps per framework) and enforce it in content tests. | v0.5.0 |
| D4 | **"AI Rabbi" framing.** An AI giving practical halachic rulings under the title "Rabbi" carries trust and accuracy risk. Rename to a study companion, state plainly that it is not a posek, and send practical psak questions to the user's own rabbi. | v0.6.0 (before the coach ships) |
| D5 | `docs/handoff.md` is a stale chat-handoff note (marked historical). Delete or fold into history. | v0.3.0 |

## Open decisions

| Topic | Options | Decide by |
|---|---|---|
| Text source & licensing | Sefaria (per-text licenses) vs. manual entry | v0.5.0 |
| Hosting | Tailscale home server vs. small cloud host | v0.8.0 |
| Repo name | Rename `torah-study-shared` → `torah-study` (GitHub Settings → General → Repository name; redirects are automatic) | any time |
