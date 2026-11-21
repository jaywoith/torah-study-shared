# Architecture Decision Records

Short records of decisions that are settled. Each one has the context, the decision and its consequences. To change one, add a new ADR that supersedes it. Don't edit history.

---

## ADR-001: Single monorepo instead of five repos
**Date:** 2026-11-21 · **Status:** Accepted

**Context.** The project started as five repos (shared, backend, web, iOS, Android). Three held only a README. The backend depended on a git submodule that was never added, so it didn't build. Cross-cutting changes required coordinated commits, and duplicated docs had begun to drift.

**Decision.** One npm-workspaces monorepo (the former `torah-study-shared`). Backend merged in at `apps/api` with history preserved. The web/iOS/Android repos are retired, to be archived on GitHub.

**Consequences.** One clone, one `npm install`, one CI, atomic changes across logic, content and API. Recommended rename: `torah-study`.

## ADR-002: Web first, PWA instead of a native iOS app
**Date:** 2026-11-21 · **Status:** Accepted

**Context.** Personal use, one user, primarily on a phone. Native iOS means Swift, Xcode, an Apple developer account ($99/yr) and a separate codebase.

**Decision.** Build the web app first and make it an installable PWA (v0.8.0). No native app.

**Consequences.** One client codebase. Home-screen icon, full-screen use and offline caching work on iOS. Weaker points: push notifications on iOS (supported for installed PWAs since iOS 16.4, reliability to be tested) and no widgets. Revisit only if one of these blocks real use.

## ADR-003: npm workspaces, TypeScript run via tsx, Vitest
**Date:** 2026-11-21 · **Status:** Accepted

**Decision.** npm workspaces (no extra tool). Packages export TypeScript source directly (`main: src/index.ts`); the API runs via `tsx` with no build step. Vitest for all tests, Supertest for HTTP.

**Consequences.** Minimal tooling and fast feedback. If deployment later needs a compiled artifact, add a bundler (esbuild/tsup) to `apps/api` only.

## ADR-004: Content is data; core is pure
**Date:** 2026-11-21 · **Status:** Accepted

**Context.** Content was hard-coded inside the generator, so every day produced the same study and editing content meant editing logic.

**Decision.** Content lives in JSON (`packages/content/data`). `@torah/core` functions are pure and receive the content library as an argument. Selection is deterministic by date.

**Consequences.** Content can grow (or be imported from a text source) without code changes. Core tests use small fixtures and don't break when content changes. Same date gives the same study, which keeps behavior predictable and testable.

## ADR-005: One version number for the whole project
**Date:** 2026-11-21 · **Status:** Accepted

**Decision.** A single SemVer version mirrored across all packages; one minor version per milestone before 1.0. See VERSIONING.md.

**Consequences.** "What's running?" has one answer. Independent package versioning isn't needed because nothing is published.

## ADR-006: Every content entry carries `verified`
**Date:** 2026-11-21 · **Status:** Accepted

**Context.** A Torah study app that cites sources loses its value if the citations or quotations are wrong. Some seed content couldn't be verified.

**Decision.** Each content unit has `verified: boolean` (and an optional `reviewNote`). Only a human check sets it to `true`. LLM-written content is never marked verified.

**Consequences.** Unverified content is visible and countable. A future UI can mark unverified units, and 1.0 requires the deferred accuracy issues to be closed.

## ADR-007: Web stack: React + Vite, no router, localStorage until v0.4
**Date:** 2026-11-21 · **Status:** Accepted

**Decision.** React 19 + Vite 8 + TypeScript. Three screens behind hash routes (`#/today`, `#/siddur`, `#/settings`) with no router library. Profile and Siddur progress live in `localStorage` until server persistence (v0.4.0). Profile option names come from a new `GET /v1/options` endpoint, so the client hard-codes no framework, level or label text. The Hebrew font (Noto Serif Hebrew) is self-hosted via `@fontsource` so it will work offline in the PWA. Vitest upgraded 2 → 5 to share Vite 8 with the web app.

**Consequences.** Few dependencies. Moving to a router later is easy if screens multiply. Until v0.4 progress is per-browser, so clearing site data resets it.

## ADR-008: SQLite via better-sqlite3, hand-written append-only migrations
**Date:** 2026-11-21 · **Status:** Accepted

**Context.** One user, small data (a profile and completion records), self-hosted on the owner's server.

**Decision.** A single SQLite file through better-sqlite3 (synchronous, mature, prebuilt binaries for common Linux/macOS targets). No ORM. Migrations are plain SQL in `apps/api/src/db/migrations.ts`, applied in order on start and recorded in `schema_migrations`. All SQL lives in `repository.ts`. Content stays in git, never in the DB. Node's built-in `node:sqlite` was considered and rejected: still experimental, with warnings on every start.

**Consequences.** No database server to run, and backup is a file copy (`npm run db:backup` uses SQLite's online backup). better-sqlite3 is a native module, so `npm ci` must run on the target platform. Moving to Postgres later would mean porting `repository.ts`.

## ADR-009: Single-user passphrase auth with an HMAC-signed cookie
**Date:** 2026-11-21 · **Status:** Accepted

**Decision.** `APP_PASSPHRASE` and `SESSION_SECRET` env vars. Login compares SHA-256 digests in constant time and sets `ts_session=<expiry>.<HMAC>`: httpOnly, SameSite=Lax, Secure in production, 30 days. There is no session table. 5 failures per 15 minutes per IP returns 429. Public routes are limited to health, auth, UI strings and options. Auth is disabled when no passphrase is set, but production refuses to start without one.

**Consequences.** No user accounts, no password storage, no dependencies. Rotating the secret signs out every device. If the app ever has multiple users, replace this with real accounts.

## ADR-010: Sefaria as the text source; build-time import now, full mirror later
**Date:** 2026-11-21 · **Status:** Accepted

**Context.** We need trustworthy Hebrew texts and translations with clear licensing.

**Decision.** Sefaria is the source. An import script fetches selected refs and versions and writes curated JSON into `packages/content/data/`, committed to git and reviewed (`verified`). **The app never calls Sefaria at runtime.** Every entry records its license and provenance. Later, the owner's server will hold a full Sefaria mirror synced monthly, and the import script will read from it. The script's fetch layer must be pluggable for that. The AI coach (v0.6) may do server-side, cached lookups.

**Consequences.** No runtime dependency on Sefaria (uptime, rate limits, offline). Content stays deterministic and testable. Texts change only when re-imported on purpose. CC-BY and CC-BY-SA require attribution in the app. CC-BY-NC versions are acceptable only while the app is personal and non-commercial.

## ADR-011: Cantillation and Divine Name are user display settings, applied at render time
**Date:** 2026-11-21 · **Status:** Accepted

**Decision.** Content keeps the source text, including te'amim and the Name as written. Two profile settings control rendering in the API, alongside the language mode: `showCantillation` (default **off**) and `divineName`: `abbreviated` ה׳ (**default**), `full`, or `yud_yud` יְיָ. The transforms are pure functions in `@torah/core`.

**Consequences.** One stored text serves every preference. Changing a setting needs no re-import. A future cantillation-reading track can use the same data.

**Details settled 2026-11-21 (owner confirmed the first two):**
- **Transliteration and English:** transliteration reads "Hashem" when `abbreviated` and "Adonai" for `full` and `yud_yud`. English is shown as the translation renders it (no "LORD" → "Hashem" rewriting), with one exception added the same day: Metsudah spells the Name out as "Adonoy", which reads "Hashem" when `abbreviated` (owner decision).
- **Scope:** only the Tetragrammaton is transformed. אֱלֹהִים, אֲדֹנָי, אֵל, שַׁדַּי etc. render as in the source.
- **Cantillation off** removes te'amim U+0591–U+05AF, meteg U+05BD and paseq U+05C0. It keeps nikkud, qamats qatan, maqaf and sof pasuq (the verse end appears in nikkud-only editions too). Meteg goes because our sources mark qamats qatan explicitly.
- **Matching:** the Name is matched with any marks between letters and up to three one-letter prefixes (ו ב כ ל מ ש ה), which are kept (לַיהוָה → לַה׳ / לַיְיָ). A source that already writes יְיָ is abbreviated too.
- **Elohim reading:** where the source points the Name to be read Elohim (hiriq, e.g. אֲדֹנָי יֱהֹוִה), `yud_yud` writes ה׳, because יְיָ would change the reading.
- **Known limit:** in `abbreviated` mode every transliterated "Adonai" becomes "Hashem", including ones that render אֲדֹנָי (e.g. "Adonai sefatai"). The Hebrew אֲדֹנָי itself is unchanged. Te'amim on the Name are not carried onto the substitute.

## ADR-012: Text versions for v0.5, and a personal-use exception to the license policy
**Date:** 2026-11-21 · **Status:** Accepted (owner chose the versions)

**Context.** ADR-010 picked Sefaria as the source. Each text needs a specific Hebrew and English version, and some versions the owner wants carry Sefaria license "unknown".

**Decision.**
- **Tanakh:** Hebrew *Miqra according to the Masorah* (CC-BY-SA, includes te'amim); English *Tanakh: The Holy Scriptures, published by JPS* (NJPS 1985, CC-BY-NC), the translation in Etz Hayim. Chosen over the 2023 gender-sensitive RJPS, JPS 1917 (public domain, archaic) and Koren.
- **Siddur (Ashkenaz):** Hebrew *The Metsudah siddur, 1981* and English *Translation based on the Metsudah linear siddur* (both CC-BY). The owner also asked for **Siddur Sim Shalom**. On Sefaria, Sim Shalom is an English version with license "unknown" that holds a single segment (Asher Yatzar), so it can't supply Pesukei Dezimra, the Shema or the Amidah today. Revisit if a fuller source appears.
- **License policy:** allowed = Public Domain, CC0, CC-BY, CC-BY-SA; CC-BY-NC allowed and flagged; anything else (including "unknown") is rejected **unless the manifest entry sets `personalUseOnly: true`**. Such entries get `provenance.personalUseOnly: true` and are listed by `npm run content:report`. Owner: "this is personal use and we'll review licensing before we go live."
- **Pinned in** `packages/content/sefaria-manifest.json` (`versionSets`), so changing a version is a one-line edit plus a re-import.

**Consequences.** Before the app is used beyond personal use: clear or replace every `personalUseOnly` entry, and every CC-BY-NC version (NJPS) if use becomes commercial. Metsudah's English writes the Name as "Adonoy"; per the owner it reads "Hashem" when the setting is abbreviated (ADR-011).

## ADR-013: "Sefer" design direction for the web app
**Date:** 2026-11-21 · **Status:** Accepted (owner approved the mockups, 2026-11-21)

**Context.** The owner asked for a world-class UI/UX update and pointed to Aceternity UI, React Bits, benji.org/stageshow and heydamir/unslop as optional inspiration. The audience is confirmed as the owner alone (single user, ADR-009 unchanged). The current UI works but reads as generic: system font, a solid header that turns bright in dark mode, native date controls above the text, text-only tabs, no reading mode or sense of progress.

**Decision.**
- **Direction "Sefer": calm and reading-first.** The text is the hero; chrome stays quiet. Noto Serif Hebrew for Hebrew (larger, room for nikkud and te'amim), Source Serif 4 for English text, Inter for interface labels, all self-hosted. Parchment-and-ink light theme and a warm low-glare dark theme with one tekhelet-blue accent.
- **Not adopted: Aceternity UI and React Bits.** Their effects (spotlights, particles, glowing borders, text scrambles) suit marketing pages, require Tailwind and framer-motion, and would cost readability, battery and tone in a daily text reader. **Adopted from unslop: the process** (audit, agree a direction, then ordered passes over spacing, color, type, layout, motion). benji.org was unreachable from the build environment and was not reviewed.
- **Phone and desktop are both first-class** (owner, 2026-11-21: "this is on web"). One responsive app: bottom tabs on phones, a left sidebar on desktop; on desktop Today and the reader sit side by side, and a focus mode centers the text. Keyboard shortcuts on desktop.
- **Styling stays plain CSS** with design tokens as custom properties. No Tailwind migration, no animation library unless CSS proves insufficient.
- **Honesty is part of the design:** drafted commentary and kavannah carry a visible "Draft · not verified" label; each text shows its source and license.
- **Roadmap:** the refresh is v0.6.0; AI Study Coach, Review & Check-ins and PWA & Deploy move to v0.7.0, v0.8.0 and v0.9.0 (owner decision). Earlier ADRs that cite the old numbers (ADR-002: PWA in v0.8.0) are historical; the plan is authoritative.

**Implementation details (2026-11-21).**
- Breakpoints: 900px switches bottom tabs to a sidebar; 1100px puts Today's plan and the reader side by side. Phones open the reader as its own view and hide the tab bar while reading.
- Draft labelling needs data the client didn't have, so daily units now carry `verified` and `provenance` (additive API change). `reviewNote` stays server-side. Section progress uses new `GET /v1/{siddur,musar}/outline`; outline grouping is pure core logic.
- Split mode aligns Hebrew and English row by row when their sentences line up; otherwise two columns, stacked on phones.
- Text size is a per-device preference in browser storage, not part of the server profile.
- Rendering guardrails are structural Playwright checks plus attached screenshots, not pixel snapshots: font rasterization differs across machines and would make CI flaky.

**Consequences.** Mostly web work; the architecture rules are unchanged (clients call the API, types-only imports, shared copy in `ui-strings.json`). Two new font packages. Screenshot tests across the four language modes and both themes become part of the web test suite.

