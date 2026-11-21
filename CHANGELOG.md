# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com); versioning: [SemVer](https://semver.org) as described in [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

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
