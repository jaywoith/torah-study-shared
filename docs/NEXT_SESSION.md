# Next session: start here

**Written:** 2026-11-21 · **Version:** 0.5.0-rc.1 merged to `main` (tag `v0.5.0-rc.1` not pushed: cloud tag pushes fail) · `npm run check` (1,778 tests) and `npm run test:e2e` pass

1. Read `AGENTS.md`.
2. `docs/DEVELOPMENT_PLAN.md`: v0.5.0 is rc.1. What remains is the owner's (below). The milestone in progress is **v0.6.0 Design Refresh** (ADR-013): P0 mockups are done and **waiting on the owner's approval** before any app code (canvas: https://claude.ai/artifact/7pH98DogMEPwDwf4k7o2mU). Then P1–P4 in the plan. AI Study Coach is now v0.7.0.
3. Decisions: ADR-010 (Sefaria import), ADR-011 (display settings, with the details settled on 2026-11-21), ADR-012 (versions, personal-use license rule), ADR-013 (Sefer design direction, Proposed).

**Design refresh, settled with the owner 2026-11-21:** single user ("staff" was a slip), phone and desktop both first-class, mockups before code, refresh before the AI coach. Not adopted: Aceternity / React Bits (see ADR-013). Work on branch `feature/ui-redesign`.

**v0.5.0 delivered**
- Cantillation toggle; Divine Name setting (ה׳ / full / יְיָ), including transliteration, plus English for Metsudah's "Adonoy".
- `npm run content:import` (pinned versions in `packages/content/sefaria-manifest.json`), `npm run content:report`, `GET /v1/sources` and a Sources & licenses screen.
- Content: 70 Tanakh units; Siddur: Pesukei Dezimra, Shema and its Blessings, weekday Amidah (56 units; long prayers split by Sefaria segment); Musar: Mesillat Yesharim (286) then Pirkei Avot (108).
- Progress-tracked Musar path (`/v1/musar/next`, Musar tab, migration 002).
- LLM-drafted commentary and kavannah for Siddur and Tanakh, flagged in `reviewNote`.

**Waiting on the owner**
- Review texts and drafts. **Never mark anything `verified: true` without the owner's say-so**; a test blocks it for drafted entries.
- G2 phone checklist (docs/TESTING.md), which needs hosting, then finalize 0.5.0 (`npm run version:bump -- patch`) and 0.4.0.
- Push tags `v0.2.0`, `v0.4.0`, `v0.5.0-rc.1` from a computer (cloud sessions cannot push tags).
- Licensing review before any use beyond personal: NJPS is CC-BY-NC (`npm run content:report`).

**Known limits / candidates for later**
- Single-segment texts (Ashrei, Psalm 147, Az Yashir, Ahavah Rabbah) can't be split by Sefaria ref, so a medium session can still run long on those days.
- The daily study's Musar slot rotates by date; the Musar path is the sequential reader.
- No transliteration for imported texts (516 entries); writing them by hand risks errors, and automatic transliteration would be a project of its own.
- Musar units have no commentary/kavannah (owner decision for now).
