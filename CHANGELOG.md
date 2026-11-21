# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com); versioning: [SemVer](https://semver.org) as described in [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

### Added
- **Redesigned web app ("Sefer", ADR-013), phone and desktop.** Parchment-and-ink light theme and a warm low-glare dark theme; Source Serif 4 and Inter alongside Noto Serif Hebrew (all self-hosted); larger Hebrew with room for nikkud and te'amim.
  - Shell: bottom icon tabs on phones, a sidebar from 900px; the solid header bar is gone.
  - Today: date header, week strip with a dot for each day studied, progress ring, "Up next" card, plan list, date picker in a sheet, day-complete state. From 1100px the plan and the reader sit side by side.
  - Reader: the unit in the profile's language layout, commentary and kavannah as collapsible panels, source and license line, text-size control (per device), "Mark done · next" on phones. Focus mode (`F`/`Esc`) centers the text; keyboard shortcuts on desktop (← → change day, `D` mark done).
  - Honesty: unverified entries show "Draft · not verified" on commentary and kavannah and "Text not yet verified" under the text.
  - Siddur and Musar: overview with overall and per-section progress and a "Continue" card, then the reader.
  - Settings: grouped sections, language-mode cards with a live preview from the API, segmented study length, interest chips.
  - Split mode lines Hebrew and English up row by row when their sentences align.
- API: `GET /v1/siddur/outline` and `GET /v1/musar/outline` (every path unit by section, with completion). Core: `buildSiddurOutline`, `buildMusarOutline`, `musarSectionName`; type `PathOutlineResponse`.
- API: daily study units now include `verified` and `provenance` (additive; `reviewNote` is still never sent). `docs/examples` regenerated.
- Tests: path outlines (core and API), reader draft labels, Today reader flow and week strip, Settings radio cards; Playwright `rendering.spec.ts` (RTL/lang, Hebrew font loaded, layout, no overflow, screenshot per case) and a desktop keyboard/focus test.

### Fixed
- Hebrew inside dropdown options ("Abbreviated (ה׳)") rendered with the geresh on the wrong side; Hebrew runs are now wrapped in Unicode isolates.


### Changed
- Playwright runs with one worker (specs share one API server and change the saved profile).
- **Roadmap:** new v0.6.0 Design Refresh; AI Study Coach, Review & Check-ins and PWA & Deploy move to v0.7.0, v0.8.0 and v0.9.0. Version references in the docs updated.

### Docs
- ADR-013 (Accepted): "Sefer" design direction for the web app. Mockups (phone and desktop) approved by the owner.

## [0.5.0-rc.1] – 2026-11-21 — Real Content

### Added
- **Display settings (ADR-011):** `showCantillation` (default off) and `divineName` (`abbreviated` ה׳ default, `full`, `yud_yud` יְיָ) on the profile. Applied by the API to daily study and the path endpoints (query params `showCantillation`, `divineName`). Transliteration reads "Hashem" when abbreviated; English is untouched except Metsudah's spelled-out "Adonoy".
- Core: `stripCantillation`, `hasCantillation`, `applyDivineName`, `applyDivineNameTransliteration`, `applyTextPreferences`; `DIVINE_NAME_MODES` enum.
- `GET /v1/options` returns `divineNames`; `study.profile` echoes both settings.
- Web Settings: "Text display" group with the cantillation toggle and Divine Name selector.
- **Sefaria import (ADR-010, ADR-012):** `npm run content:import` (`scripts/import-sefaria.ts`) reads `packages/content/sefaria-manifest.json`, fetches pinned versions, strips HTML/footnotes/parasha markers, keeps te'amim, enforces the license policy and merges into the content JSON. Idempotent, `--dry-run`, `--only=<prefix>`, `--force` (verified entries), `--refresh` (bypass the gitignored `.cache/sefaria`). Throttled with 429 retry. Fetch source is pluggable (`SEFARIA_BASE_URL` or a `TextSource`) for the planned mirror.
- `Provenance` on content entries: `sefariaRef`, `sefariaUrl`, `importedAt`, per-language `versionTitle` + `license`, optional `personalUseOnly`.
- **Musar path:** `GET /v1/musar/next`, progress path `musar`, and a Musar tab in the web app. Reads Mesillat Yesharim then Pirkei Avot in order, tracked by completion, so a missed day never skips text. Migration 002 widens the `completed_units.path` check (rows are copied; v0.4 data kept). The Siddur and Musar screens share one `PathScreen` component; the API shares one display-params parser.
- **Amidah** (weekday, Metsudah) in the Siddur path, one unit per blessing; Modim is split into Modim and the two Al Hanisim insertions.
- `npm run content:report` (`--json` too): counts by kind, verified vs unverified, versions and licenses, CC-BY-NC and uncleared-license entries, missing transliteration/commentary/kavannah.
- **Sources & licenses:** public `GET /v1/sources` and a web screen linked from Settings, listing every version with its license (attribution for CC-BY / CC-BY-SA).
- Core: `summarizeSources`, `buildContentReport`; the license policy moved to `@torah/core` (`licenseStatus`, `normalizeLicense`, `requiresAttribution`).
- The import keeps study units in manifest order, which is the daily rotation order within each type (so Musar reads sequentially).
- Tests: sanitizer, license policy, merge rules, and content checks for provenance, allowed licenses, no leftover HTML, te'amim, and a Tanakh pool of 60+.

### Content
- **Tanakh:** 70 units (3 existing re-imported + 67 new), Hebrew *Miqra according to the Masorah* (CC-BY-SA) and English NJPS 1985 (CC-BY-NC). Citations now use Sefaria's names (e.g. "Psalms 145:9").
- **Siddur:** complete weekday Pesukei Dezimra in Ashkenaz order (19 units) and the Shema and its Blessings (5 units), Metsudah Hebrew + English (CC-BY). Existing ids kept: `baruch_sheamar`, `ashrei_opening` (now all of Ashrei), `yishtabach_opening` (now all of Yishtabach); their hand-written transliterations were removed because they covered only the opening lines. New units have no transliteration, commentary or kavannah yet (pending owner-reviewed drafts).
- **Musar:** Mesillat Yesharim in full, in reading order (286 units of ~800 Hebrew characters; Hebrew *Sefaria Vocalized Edition*, CC0; English *Path of the Just*, trans. Yosef Sebag, CC-BY) followed by Pirkei Avot, one mishnah per unit (108 units; Hebrew *Torat Emet 357*, Public Domain; English *Mishnah Yomit*, Joshua Kulp, CC-BY). Existing `musar-avot-1-2` / `musar-avot-1-14` kept.
- **D2 resolved:** removed the unverified, possibly paraphrased Mesillat Yesharim seed quote (`musar-mesillat-yesharim-kavannah`); the real text now comes from the import. The hidden-light unit now cites Chagigah 12a and Bereishit Rabbah 3:6, both checked against Sefaria.
- **Commentary and kavannah drafts** for 53 Siddur units and 67 Tanakh units (LLM drafts, source-free, each flagged in `reviewNote`). Quoted phrases were checked against the imported translation. The Avot (Amidah) unit's commentary notes that many Conservative siddurim offer the Matriarchs. Musar units have none yet.
- All imported entries are `verified: false`; a test fails if any LLM-drafted entry is marked verified.

### Changed
- Long Siddur prayers split at Sefaria segment boundaries (Hodu, Yotzer Or, the Shema by paragraph, Emet Veyatziv): parts get ids `<id>_2`, `<id>_3`; the existing id keeps the first part so progress stays valid. Single-segment texts (Ashrei, Psalm 147, Az Yashir, Ahavah Rabbah) stay whole, because splitting them would misalign the Hebrew and English.
- In abbreviated mode, Metsudah's spelled-out "Adonoy" reads "Hashem" in English (owner decision, ADR-011 amended). Other English is unchanged.
- `ProgressResponse` gains `musar` (additive).
- e2e smoke test no longer hard-codes the Siddur path length, and now covers the Musar path.
- Profiles saved by v0.4 (or sent without the new fields) get the defaults; `GET /v1/profile` always returns both fields. Non-breaking.
- `SiddurUnit.transliteration`, `commentary` and `kavannahPrompt` are optional (imported units may lack them). Additive for clients; the web already handled missing values.
- Settings note now says texts are imported and not yet owner-reviewed.
- Verified visually: Noto Serif Hebrew renders te'amim correctly (390px phone viewport).
- `/v1/siddur/next` now starts at `psalm_30` (the path begins with the introductory psalm). API tests derive Siddur ids from content instead of hard-coding them.
- With the default setting, Tanakh Hebrew now shows ה׳ and transliteration "Hashem" where they previously showed the Name and "Adonai".
- Plan: v0.5.0 detailed with owner decisions: Sefaria build-time import (ADR-010); cantillation toggle and Divine Name setting, default ה׳ (ADR-011); full Sefaria mirror with monthly sync and a cantillation track added to the backlog. Deferred issue D3 decided.

## [0.4.0-rc.1] – 2026-11-21 — Persistence & Progress

### Added
- **Server-side persistence (SQLite):** profile and progress survive across devices and browsers. Migrations run automatically on start (ADR-008).
- **Sign-in:** single-user passphrase (`APP_PASSPHRASE`), signed httpOnly session cookie, login rate limit, sign-out (ADR-009). Production refuses to start without secrets.
- **Daily study "Mark done"** per unit, with "n of m done". Works for any date.
- Endpoints: `/v1/auth/{session,login,logout}`, `GET/PUT /v1/profile`, `GET /v1/progress`, `POST/DELETE /v1/progress/complete`, `POST /v1/progress/reset`, `POST /v1/progress/import`.
- `StudyUnit.contentId` (stable content id for progress).
- One-time import of v0.3 browser-stored profile/Siddur progress to the server.
- `npm run db:backup` (online-safe backup with retention), `npm run start:prod` (API serves the built web app), `.env.example`.
- Tests: migrations, repository, auth, progress/profile endpoints, web login/done/Siddur screens; e2e covers sign-in and persistence across reloads. 141 unit/integration tests + 1 e2e.

### Changed
- `/v1/siddur/next` uses saved progress when `completed` is not passed.
- The web Siddur path and profile are now server-backed (no longer `localStorage`).
- Malformed JSON bodies return 400 instead of 500.
- Removed the `cors` dependency: the web app is same-origin (dev proxy, or served by the API).
- Node 22+ required (`process.loadEnvFile`).
- Plan: hosting will be on the owner's own server, set up with the owner. 0.3.0 was not tagged; its phone check is folded into 0.4.0.

## [0.3.0-rc.1] – 2026-11-21

### Added
- **Web app (`apps/web`)**: React + Vite, phone-first, with three screens:
  - **Today:** the daily study for any date, with previous/next day and a date picker.
  - **Siddur:** the next unit, "Unit n of N", mark complete, reset.
  - **Settings:** the study profile.
  Hebrew is rendered RTL in self-hosted Noto Serif Hebrew. All four language layouts are supported; Mixed interleaves Hebrew, transliteration and English sentence by sentence. Dark mode included.
- `GET /v1/options`: ids and display names for every profile field.
- HTTP contract types in `packages/core/src/api-types.ts` (`DailyStudyResponse`, `SiddurNextResponse`, `OptionsResponse`, `ApiError`), used by both API and web.
- UI strings: `nav`, `siddur`, `settings` and `options` groups, plus new `study` labels. A content test requires a label for every interest, length, mode and unit type.
- Tests: web component tests (jsdom) and a Playwright smoke test against a production build. CI gains an `e2e` job.
- Scripts: `npm run dev` (API + web), `npm run dev:lan` (phone on same Wi-Fi), `npm run build`, `npm run test:e2e`.

### Changed
- Vitest 2 → 5 (shares Vite 8 with the web app); config renamed to `vitest.config.mts`.

### Fixed
- Mixed layout crashed when given a full unit (non-text fields such as `reviewItems` were passed to sentence splitting). Caught by the e2e test before release; regression test added.

## [0.2.0] – 2026-11-21 — Foundation

### Changed
- **Five repos consolidated into one npm-workspaces monorepo** (this repo). The backend moved to `apps/api` with git history preserved. Packages renamed to `packages/core` and `packages/ai-rules`. The web/iOS/Android repos are retired (ADR-001, ADR-002).
- Content moved out of code into `packages/content/data/*.json` (ADR-004). `generateDailyStudy` now takes the content library as an argument and stays pure.
- `DailyStudy` adds `display` (language layout contract) and `budgetMinutes`. `StudyUnit.english` is now optional (omitted in Hebrew mode when Hebrew is present).
- `/v1/siddur/next` returns `{ unit, display, position, total, completedCount }` and accepts `languageMode`.
- `/v1/ui-strings` is served from the bundled content package (no submodule or GitHub fetch, so it works with private repos).
- `/health` reports the real package version; the service is named `torah-study-api`.
- API inputs are validated against the enum lists (`parseUserProfile`); bad values return 400 with specific issues.

### Fixed
- Daily study was identical every day: content now rotates by date.
- `level` and `studyLength` were ignored: units are filtered by `minLevel`, and sessions fill a minute budget (10/20/35).
- Siddur "next" always returned Baruch She'amar: it now returns the first uncompleted unit in path order.
- Kabbalah was excluded for Hasidic users (inverted check). Depth is now min(framework cap, level cap).
- `split` and `mixed` were identical and `hebrew` still showed English. All four modes are now distinct.
- `FrameworkId` was declared twice (core and ai-rules). It now has a single source in core.
- Validation flagged legitimate phrases ("not binding") and only checked 2 of 4 traditional frameworks.
- The no-progressive-default constraint applied only to Conservative instead of all traditional frameworks.
- `extractShorest` typo renamed to `extractShoresh`. `getPartOfSpeech` always returned `'verb'` and now returns `null` when unknown.
- The API error handler leaked internal error messages to clients.
- The backend didn't build (its tsconfig pointed to a submodule that was never added).

### Added
- Validation checks: pointed Hebrew, at least one text field, unique ids, budget not exceeded.
- 87 tests: core unit tests, ai-rules tests, content-integrity tests (including all 160 framework × level × length × mode combinations), golden example tests, API tests.
- GitHub Actions CI (typecheck + tests).
- `npm run version:bump` script.
- Docs: AGENTS.md, CLAUDE.md, DEVELOPMENT_PLAN, ARCHITECTURE, VERSIONING, TESTING, CONTENT, DECISIONS, api.

### Content
- New seed units: Tehillim 145:18, Micah 6:8, Pirkei Avot 1:2 and 1:14; Siddur: Ashrei opening (Tehillim 84:5) and Yishtabach opening. All marked `verified: false`.
- Flagged with `reviewNote`: the Mesillat Yesharim quote (unverified) and the hidden-light citation (needs a primary source).

## [0.1.0] – 2026-11-11 — Prototype
- Initial five-repo skeleton: shared packages (models, frameworks, levels, generator, validation, personas, constraints), Express backend with study/siddur/coach/ui-strings endpoints, and README-only web/iOS/Android repos.
