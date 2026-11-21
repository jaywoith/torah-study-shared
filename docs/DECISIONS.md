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
