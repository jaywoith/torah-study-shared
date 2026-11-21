# Next session: start here

**Written:** 2026-11-21 · **Branch:** `claude/festive-curie-ueom6q` (not yet merged to `main`) · all tests green (`npm run check`, 1,668 tests)

1. Read `AGENTS.md`.
2. `docs/DEVELOPMENT_PLAN.md` → **v0.5.0: Real Content**. Most tasks are done; open items and **owner decisions pending** are at the top of the task list.
3. ADR-010 (Sefaria import), ADR-011 (display settings, plus details settled this session), ADR-012 (versions chosen, personal-use license rule).

**Done this session**
- Cantillation toggle and Divine Name setting (core transforms, profile fields, API, Settings UI).
- `npm run content:import` (Sefaria, build time, pinned versions in `packages/content/sefaria-manifest.json`, cache in `.cache/sefaria`), `npm run content:report`, `GET /v1/sources` and a Sources & licenses screen.
- Content: 70 Tanakh units (MAM + NJPS 1985), Pesukei Dezimra (19) and Shema with its Blessings (5) from Metsudah, Mesillat Yesharim (286) and Pirkei Avot (108). D2 resolved.
- **Nothing is `verified: true`.** The owner must approve before anything is marked verified.

**Waiting on the owner**
- Amidah source (Metsudah is Orthodox; Sim Shalom isn't on Sefaria in usable form).
- "Adonoy" in Metsudah's English when the Name setting is abbreviated.
- Session length vs. long imported units; whether to build a progress-tracked Musar path.
- Commentary/kavannah drafts for imported units, then review.
- Licensing review before any use beyond personal: NJPS is CC-BY-NC (see `npm run content:report`).

**Still pending, outside v0.5.0:** hosting with the owner; git tags `v0.2.0`/`v0.4.0` (403 from cloud); repo privacy/archiving (owner, GitHub Settings).
