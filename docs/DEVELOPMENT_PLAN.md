# Development Plan

**Current version:** 0.5.0-rc.1
**Current milestone:** v0.5.0 Real Content, **rc.1 cut**. Waiting on the owner: content review (nothing is `verified` yet) and the G2 phone check (needs hosting). v0.4.0 is likewise waiting on its phone check. **v0.6.0 Design Refresh is built** (ADR-013; on branch `feature/ui-redesign`): waiting on the owner's phone check. Next: v0.7.0 AI Study Coach. Hosting on the owner's server whenever the owner is at a computer (see "Hosting" under v0.3.0).
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
| 0.3.0 | Web App Shell ✅ (superseded by 0.4.0-rc.1) | Usable daily study + Siddur path in a browser | G2 |
| 0.4.0 | Persistence & Progress 🟡 rc.1 | Profile and progress saved server-side; sign-in; backups | G2 |
| 0.5.0 | Real Content 🟡 rc.1 | Verified texts from a licensed source; full Pesukei Dezimra; Musar sequence | G2 |
| 0.6.0 | Design Refresh 🟡 built | Calm, reading-first UI ("Sefer"): new type, color, dark mode, focus reader, path progress | G2 |
| 0.7.0 | AI Study Coach | Real LLM coach bound by shared personas and constraints, with an eval suite | G3 |
| 0.8.0 | Review & Check-ins | Spaced-repetition review from reviewItems; weekly check-in | G2 |
| 0.9.0 | PWA & Deploy | Installed on phone, works offline, hosted privately | G2 |
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
- [x] ~~Owner phone check, then release 0.3.0~~. Folded into the 0.4.0 release: 0.3.0 was never tagged, and its G2 check happens on 0.4.0.

### Hosting (on the owner's own server, done with the owner at a computer)

Updated 2026-11-21: the owner has a server and will set it up from a computer. Do this **with** the owner, since server details (OS, reverse proxy, domain) are needed. PWA/offline stays in v0.9.0.

- [x] API serves the built web app (`apps/web/dist`) from the same origin: one service, one URL, no CORS (`npm run start:prod`)
- [x] Single-user auth: passphrase env var, login screen, signed httpOnly session cookie, login rate limit (done in v0.4.0)
- [x] Health check `/health`; `.env.example` lists every variable; production refuses to start without secrets
- [ ] With the owner: record the server details (OS, Node availability, reverse proxy such as Caddy or nginx, domain/HTTPS) in an ADR
- [ ] Process manager (systemd unit or Docker Compose, whichever fits the server), checked in under `deploy/`
- [ ] HTTPS via the reverse proxy; set `TRUST_PROXY`
- [ ] Scheduled `npm run db:backup` (cron or systemd timer), with copies kept off the server
- [ ] Deploy procedure: a pull-and-restart script to start with; optionally a GitHub Actions deploy on merge to `main` after CI
- [ ] `docs/DEPLOYMENT.md`: deploy, rotate passphrase/secret, roll back, restore a backup, view logs
- [ ] Owner opens the URL on the phone → G2 checklist → release 0.4.0
- [ ] Push the pending git tags (`v0.2.0`, then `v0.4.0`). Tag pushes were refused by the earlier cloud session's git proxy (HTTP 403); push from the owner's computer or a session that allows it

**Done when:** gate G2 passes and the owner can use it for a morning session on a phone browser.

## v0.4.0: Persistence & Progress (current, 0.4.0-rc.1 cut)

**Goal:** the app remembers who you are and where you are.

- [x] SQLite via better-sqlite3; append-only migrations in `apps/api/src/db/migrations.ts`, applied on start (ADR-008)
- [x] Tables: `profile` (single row, JSON), `completed_units` (path, unit id, study date). `review_results` deferred to v0.8.0, when its shape is known
- [x] Single-user auth: `APP_PASSPHRASE` → signed httpOnly session cookie (30 days), login rate limit, sign-out. Off when unset in development; required in production (ADR-009)
- [x] Endpoints: `GET/PUT /v1/profile`; `GET /v1/progress`; `POST/DELETE /v1/progress/complete`; `POST /v1/progress/reset`; `POST /v1/progress/import`; `/v1/siddur/next` reads completed units from the DB
- [x] `StudyUnit.contentId` added, so progress is recorded against stable content ids
- [x] Web: login screen; profile and progress via API; one-time import of v0.3 browser data, then the browser copy is cleared
- [x] Daily study: "Mark done" per unit, "n of m done", works for past days via date navigation
- [x] Backup: `npm run db:backup` (online-safe SQLite backup, keeps newest 30, `BACKUP_DIR` for off-machine targets)
- [x] Tests: migrations and repository (in-memory SQLite), auth (tokens, rate limit, forged cookies, production config), progress/profile endpoints, web screens, and e2e sign-in → progress persists across reload → sign-out
- [ ] **Owner:** G2 phone check once hosted (see Hosting under v0.3.0), then release 0.4.0

**Done when:** gate G2 passes on the hosted app.

## v0.5.0: Real Content (rc.1 cut 2026-11-21)

**Goal:** content you can trust, at enough volume for months of daily use, imported from Sefaria, with display preferences for cantillation and the Divine Name.

**Decisions already made (2026-11-21, owner), see ADR-010 and ADR-011:**
- **Source:** Sefaria. Import at **build time** into committed JSON. The app never calls Sefaria at runtime.
- **Later:** a full mirror of Sefaria on the owner's server with a monthly sync (backlog). The v0.5 import script should be written so it can later read from that mirror instead of the public API (a pluggable fetch source).
- **Cantillation (te'amim):** keep them in imported content. A **settings toggle** shows or hides them (default: hidden). A cantillation-reading learning track comes later, not now.
- **Divine Name:** a **settings option** with three choices: abbreviated ה׳ (**default**), full as in the source, or יְיָ. Content stores the source form; the transformation happens at render time.
- **Sefaria access:** approved. Environment "Torah Study" allows `sefaria.org` / `www.sefaria.org` (verified working).

**What we know about Sefaria (checked 2026-11-21):**
- `GET https://www.sefaria.org/api/v3/texts/{ref}?version=hebrew&version=english` returns `versions[]`, each with `language`, `versionTitle`, `license` and `text`. Per-book version list: `GET /api/texts/versions/{Book_Title}`.
- Tanakh Hebrew "Miqra according to the Masorah": **CC-BY-SA**. Includes te'amim, meteg, qamats qatan (U+05C7), and writes the Name with vowels (e.g. `יְהֹוָ֥ה`, so match every pointed variant, not one spelling).
- Default English Tanakh "THE JPS TANAKH: Gender-Sensitive Edition": **CC-BY-NC**, with HTML markup (`<span>`, `<b>`, `<small>`) that must be stripped.
- Siddur Ashkenaz versions: Metsudah (he + en) **CC-BY**; "Daat Siddur Ashkenaz" (he) **Public Domain**; Singer 1915 (en) **Public Domain**; Sefaria Community Translation (en) **CC0**. Siddur Sim Shalom and several others are "unknown" → **excluded**.

**Tasks**
- [x] **Owner decisions (2026-11-21):** (1) Amidah from Metsudah, with a note that Conservative siddurim offer Imahot; (2) "Adonoy" reads "Hashem" in English when abbreviated; (3) split long Siddur units; (4) progress-tracked Musar path; (5) draft commentary/kavannah for Siddur and Tanakh only
- [x] ADR-010 / ADR-011 are written (done in this commit); keep them current if anything changes
- [x] **License policy** (plus the ADR-012 personal-use exception): allow `Public Domain`, `CC0`, `CC-BY`, `CC-BY-SA`; allow `CC-BY-NC` (fine for this personal, non-commercial app, but flag it in the content report); reject `unknown` and anything else. Every entry stores `license`, `versionTitle`, `sefariaRef`, `sefariaUrl`, `importedAt`
- [x] **Import script** `scripts/import-sefaria.ts`: a list of refs (in a checked-in manifest, e.g. `packages/content/sefaria-manifest.json`) → fetch → sanitize (strip HTML, normalize whitespace) → keep te'amim → write `packages/content/data/*.json`. Idempotent; reports what changed; never overwrites `verified: true` entries without a flag
- [x] **Core (pure) text transforms** with tests: `stripCantillation(text)` (te'amim U+0591–U+05AF plus meteg/sof pasuq handling: decide and document; keep nikkud); `applyDivineName(text, mode)` covering all pointed/unpointed variants of the Tetragrammaton
- [x] **Profile fields:** `showCantillation: boolean` (default false), `divineName: 'abbreviated' | 'full' | 'yud_yud'` (default 'abbreviated'). Enum arrays in `models.ts`; `parseUserProfile` defaults missing fields so saved v0.4 profiles keep working; option labels in `ui-strings.json` and `/v1/options`
- [x] **Apply at render time** in the API (daily study and Siddur) next to the language mode, so clients stay dumb
- [x] **Open questions to settle and record** (settled 2026-11-21, recorded in ADR-011: plan recommendation for (a), Tetragrammaton only for (b)): (a) transliteration and English when abbreviated, e.g. "Adonai" → "Hashem"? Recommendation: Hebrew follows the setting, transliteration uses "Adonai" for full/yud-yud and "Hashem" for abbreviated, English is left as the translation renders it; (b) other Divine Names (אֱלֹהִים etc.): out of scope unless the owner asks
- [x] **Siddur:** ✅ Pesukei Dezimra (19 units) and ✅ Shema and its Blessings (5 units), Metsudah he+en (ADR-012). ✅ Amidah (Metsudah, 24 units; Imahot note on Avot). ✅ Long prayers split by segment. ✅ Seed units replaced, ids kept.
- [x] **Musar:** Mesillat Yesharim (CC0 + CC-BY) in reading order, then Pirkei Avot (PD + CC-BY): 394 units. The daily rotation steps through them in order by date. ✅ Progress-tracked Musar path (`/v1/musar/next`, Musar tab)
- [x] **Tanakh pool:** at least 60 units (70) so rotation doesn't repeat for two months
- [x] Resolve deferred D2: replace or verify the Mesillat Yesharim seed quote; cite Chagigah 12a / Bereishit Rabbah 3:6 for the hidden-light unit
- [x] Drafts written for Siddur (53) and Tanakh (67), flagged in `reviewNote`; Musar left without (owner decision).
- [ ] **Owner:** review the drafts and texts; tell the agent which entries to mark `verified: true` (never marked without the owner)
- [ ] **Owner:** G2 phone checklist (docs/TESTING.md) once hosted, then release 0.5.0 Commentary and kavannah prompts on imported units stay **owner-reviewed**. An LLM may draft them, but they're marked `verified: false` until the owner approves
- [x] `npm run content:report`: counts by type, unverified entries, NC-licensed entries, missing fields
- [x] Content tests: required license/provenance fields; allowed licenses only; no HTML left in text; te'amim present only where the source has them
- [x] Web: Settings gets the cantillation toggle and Divine Name selector; Hebrew font check (verified 2026-11-21) with te'amim (Noto Serif Hebrew supports them; verify visually)
- [x] Attribution (`GET /v1/sources` + Sources & licenses screen): a simple "Sources & licenses" screen or footer listing versions used (required by CC-BY/CC-BY-SA)

## v0.6.0: Design Refresh

**Goal:** a calm, reading-first interface ("Sefer", ADR-013) that keeps Hebrew rendering correct in all four language modes and in dark mode. Mostly web-only; two additive API changes were needed (unit `verified`/`provenance`, path outlines). Owner confirmed 2026-11-21: single user (no multi-user work), mockups before code, this milestone before the AI coach.

**P0: direction (no app code)**
- [x] Review the current UI (phone screenshots, light and dark)
- [x] ADR-013 drafted (status Proposed until the owner approves the mockups)
- [x] Mockups: Today, focus reader (Split, Mixed), Siddur path, Settings with live preview, day complete; light and dark. Desktop (added at the owner's request 2026-11-21): Today + reader two-pane, focus reader, Siddur path. Canvas: https://claude.ai/artifact/7pH98DogMEPwDwf4k7o2mU (private to the owner)
- [x] **Owner approved the mockups** (2026-11-21: "Let's implement this"); ADR-013 Accepted

**P1: foundation (every screen)**
- [x] Responsive shell: bottom tab bar below ~900px, left sidebar at desktop widths (one component tree, CSS breakpoints)
- [x] Design tokens in CSS custom properties (color, type scale, spacing, radius), light and dark from one set
- [x] Self-host Source Serif 4 and Inter via `@fontsource` (Noto Serif Hebrew already is); Hebrew size and line height tuned for nikkud + te'amim
- [x] Icon tab bar (inline SVG components, no icon dependency unless justified), safe areas, 44px targets
- [x] Remove the solid header bar; per-screen headers

**P2: Today and the reader**
- [x] Today: date header, week strip (completion per day from existing progress data), progress ring, "Up next" card, plan list
- [x] Date picker in a sheet instead of the inline native input
- [x] Focus reader: full-screen unit view, text-size control (stored per device), "Mark done · next" flow, source and license line
- [x] Commentary and kavannah as collapsible panels with a visible "Draft · not verified" label when `verified` is false (the API now sends `verified` and `provenance` on daily units; `reviewNote` stays server-side)
- [x] Day-complete state
- [x] Desktop: Today and the reader side by side (plan list + reader pane); focus mode (`F` / `Esc`) with a centered reading column; keyboard shortcuts (← → change day, `D` mark done)

**P3: other screens**
- [x] Siddur and Musar paths: overall progress, section progress, "Continue" card; sections as columns on desktop (new `GET /v1/siddur/outline`, `GET /v1/musar/outline`)
- [x] Settings: grouped lists, segmented controls, live language-mode preview
- [x] Login and Sources & licenses restyled

**P4: polish and guardrails**
- [x] Motion: small CSS transitions (card enter, completion check, ring and progress fills); none under `prefers-reduced-motion`. (View Transitions API not used: not needed for hash routing.)
- [x] Accessibility pass: contrast AA in both themes (lowest pair 4.77:1), focus rings, labelled icon buttons, real buttons/radios/checkboxes. Not done: a pass with VoiceOver on the phone (do it during G2)
- [x] Playwright rendering tests (`e2e/rendering.spec.ts`): the reader in all 4 language modes × light/dark × phone/desktop. Fails on missing RTL/lang, wrong or unloaded Hebrew font, wrong layout, horizontal overflow; attaches a screenshot per case. Not pixel-compared (rasterization differs across machines, ADR-013)
- [x] Any new copy added to `ui-strings.json`; `docs/ARCHITECTURE.md` web section updated

**Remaining (owner):** G2 phone check of the new design on a real iPhone (with v0.5.0's), then release v0.6.0.

**Open option (needs owner say-so):** Hebrew date on Today. It needs calendar logic in `@torah/core` (e.g. `@hebcal/core`), so it is listed under Calendar awareness in the backlog rather than here.

## v0.7.0: AI Study Coach

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

## v0.8.0: Review & Check-ins

- [ ] Quiz generation from `reviewItems` (recognition, shoresh, kavannah, source)
- [ ] Spaced repetition (SM-2 or simpler Leitner boxes) on Hebrew words and shorashim
- [ ] Weekly check-in screen: summary of completed units, Musar reflections, Hebrew progress; optional coach conversation
- [ ] Hebrew familiarity tracking (`Progress.hebrewFamiliarity`)

## v0.9.0: PWA & Deploy

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
- **Full Sefaria mirror on the owner's server with a monthly sync** (owner decision 2026-11-21; ADR-010). The import script then reads from the mirror
- **Cantillation reading track:** learn the te'amim and trope (owner decision 2026-11-21; not yet scheduled)
- Audio: recorded or TTS pronunciation of Hebrew lines
- Calendar awareness: parashah of the week, holidays, Hebrew date (e.g. `@hebcal/core`)
- Native iOS app, **only** if a PWA limitation actually blocks use

---

## Deferred issues (from the 2026-11 review)

These were flagged and intentionally deferred. Each has a target milestone.

| ID | Issue | Target |
|---|---|---|
| D1 | `docs/user-personas.md` contains the owner's name and personal observance details. Low risk once repos are private; genericize before ever making the repo public. | before any public release |
| D2 | ✅ Resolved 2026-11-21 (seed quote removed; hidden-light citations checked). **Source accuracy.** The Mesillat Yesharim quote in `study-units.json` is unverified and may be a paraphrase; the hidden-light unit should cite Chagigah 12a / Bereishit Rabbah 3:6. All seed content is `verified: false`. | v0.5.0 |
| D3 | **Divine Name display.** ✅ Decided 2026-11-21: a user setting with abbreviated ה׳ (default), full, or יְיָ (ADR-011). Implementation in v0.5.0. | v0.5.0 |
| D4 | **"AI Rabbi" framing.** An AI giving practical halachic rulings under the title "Rabbi" carries trust and accuracy risk. Rename to a study companion, state plainly that it is not a posek, and send practical psak questions to the user's own rabbi. | v0.7.0 (before the coach ships) |
| D5 | `docs/handoff.md` is a stale chat-handoff note (marked historical). Delete or fold into history. | v0.5.0 |

## Open decisions

| Topic | Options | Decide by |
|---|---|---|
| Text source & licensing | ✅ Sefaria, build-time import; license policy in v0.5.0 tasks (ADR-010) | decided |
| Hosting | Owner's own server (decided). Remaining details: OS, process manager, reverse proxy, domain | when the owner is at a computer |
| Repo name | Rename `torah-study-shared` → `torah-study` (GitHub Settings → General → Repository name; redirects are automatic) | any time |
