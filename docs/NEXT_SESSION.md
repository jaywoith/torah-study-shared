# Next session: start here

**Written:** 2026-11-21 · **Version:** 0.5.0-rc.1 on branch `claude/festive-curie-ueom6q` (not yet merged to `main`; tag not pushed) · `npm run check` (1,778 tests) and `npm run test:e2e` pass

1. Read `AGENTS.md`.
2. `docs/DEVELOPMENT_PLAN.md`: v0.5.0 is rc.1. What remains is the owner's (below). The next milestone to build is **v0.6.0 AI Study Coach**.
3. Decisions: ADR-010 (Sefaria import), ADR-011 (display settings, with the details settled on 2026-11-21), ADR-012 (versions, personal-use license rule).

**v0.5.0 delivered**
- Cantillation toggle; Divine Name setting (ה׳ / full / יְיָ), including transliteration, plus English for Metsudah's "Adonoy".
- `npm run content:import` (pinned versions in `packages/content/sefaria-manifest.json`), `npm run content:report`, `GET /v1/sources` and a Sources & licenses screen.
- Content: 70 Tanakh units; Siddur: Pesukei Dezimra, Shema and its Blessings, weekday Amidah (56 units; long prayers split by Sefaria segment); Musar: Mesillat Yesharim (286) then Pirkei Avot (108).
- Progress-tracked Musar path (`/v1/musar/next`, Musar tab, migration 002).
- LLM-drafted commentary and kavannah for Siddur and Tanakh, flagged in `reviewNote`.

**Waiting on the owner**
- Review texts and drafts. **Never mark anything `verified: true` without the owner's say-so**; a test blocks it for drafted entries.
- G2 phone checklist (docs/TESTING.md), which needs hosting, then finalize 0.5.0 (`npm run version:bump -- patch`) and 0.4.0.
- Merge this branch to `main` (PR) and push tags; cloud sessions got HTTP 403 on tag pushes before.
- Licensing review before any use beyond personal: NJPS is CC-BY-NC (`npm run content:report`).

**Known limits / candidates for later**
- Single-segment texts (Ashrei, Psalm 147, Az Yashir, Ahavah Rabbah) can't be split by Sefaria ref, so a medium session can still run long on those days.
- The daily study's Musar slot rotates by date; the Musar path is the sequential reader.
- No transliteration for imported texts (516 entries); writing them by hand risks errors, and automatic transliteration would be a project of its own.
- Musar units have no commentary/kavannah (owner decision for now).
