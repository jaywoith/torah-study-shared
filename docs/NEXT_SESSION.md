# Next session: start here

**Written:** 2026-11-21 · **Repo state:** `main` = v0.4.0-rc.1 (all tests green)

1. Read `AGENTS.md` (rules, commands, definition of done).
2. Open `docs/DEVELOPMENT_PLAN.md` and go to **"v0.5.0: Real Content (next, start here)"**. The owner's decisions, the Sefaria facts already checked, and the task list are all there.
3. Read ADR-010 (Sefaria import) and ADR-011 (cantillation and Divine Name settings) in `docs/DECISIONS.md`.

**Environment:** use the cloud environment **"Torah Study"**. It allows `sefaria.org` and `www.sefaria.org`, and its setup script runs `npm ci` in `torah-study-shared` (not yet proven in a fresh session; if it fails, run `npm ci` by hand).

**Suggested order for v0.5.0:**
1. Core transforms (`stripCantillation`, `applyDivineName`) + profile fields + API rendering + Settings UI, all with tests. Small and self-contained.
2. Import script + manifest + license policy + content tests, proven on a handful of Tanakh refs.
3. Siddur (Pesukei Dezimra) import, keeping existing unit ids.
4. Tanakh pool, Musar path, `content:report`, attribution screen.
5. Owner review of commentary and kavannah text before anything is marked `verified: true`.

**Still pending, outside v0.5.0:**
- Hosting on the owner's server: do it with the owner at a computer (plan, "Hosting" under v0.3.0).
- Git tags `v0.2.0` / `v0.4.0` could not be pushed from cloud sessions (HTTP 403).
- The owner was asked to make the repos private and archive the four retired repos (GitHub Settings).
