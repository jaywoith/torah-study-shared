# Versioning & Releases

## One version for the whole project

The monorepo has **one version number** (in root `package.json`), mirrored into every workspace `package.json` and `ui-strings.json`. Everything ships together, so one number answers "what's running?" (`GET /health` reports it). Use `npm run version:bump` to change it. Never edit versions by hand.

## Semantic Versioning: `MAJOR.MINOR.PATCH`

| Part | Before 1.0 (now) | After 1.0 |
|---|---|---|
| MAJOR | stays `0` | breaking change to API, stored data, or a removed feature |
| MINOR | **one per milestone** in DEVELOPMENT_PLAN.md (0.3.0 = Web App Shell…) | new feature, backward-compatible |
| PATCH | bug fixes, content corrections, doc fixes within a milestone | same |

**Pre-releases:** `0.3.0-rc.1`, `0.3.0-rc.2`… when you want to dogfood a milestone before calling it done. `npm run version:bump -- patch` on an rc finalizes it (`0.3.0-rc.2` → `0.3.0`).

### What counts as what

| Change | Bump |
|---|---|
| Fix a bug, typo, wrong nikkud, wrong citation | patch |
| Add content units (no schema change) | patch |
| Edit an AI prompt or constraint wording | patch, **with a CHANGELOG line under "AI rules"** |
| New endpoint, new screen, new content field (optional) | minor |
| Remove/rename a response field, change DB schema incompatibly | minor before 1.0 (with migration), major after |

## API versioning (separate from app version)

The URL prefix `/v1` changes only for a breaking change to a response shape that a deployed client depends on. Additive changes (new optional fields, new endpoints) stay on `/v1`. With one user and one web client deployed together, a `/v2` should be rare. Prefer additive changes.

## Content and prompt traceability

- Content JSON lives in git; the app version identifies the exact content set.
- AI prompts and constraints live in `packages/ai-rules`; any change is listed in the CHANGELOG under **AI rules**, so a change in coach behavior can be traced to a release.
- From v0.6, coach replies are stored with the app version that produced them.

## Branches

- `main`: always green, always releasable.
- Short-lived branches → PR → CI green → merge (squash preferred).
- No long-lived release branches. If a hotfix is needed while `main` has unreleased work, branch from the last tag, fix, tag a patch, and merge back.

## Release procedure

1. Confirm the milestone checklist in DEVELOPMENT_PLAN.md is complete (or deliberately trimmed, with a note).
2. Run the release gate for the release type (G1/G2/G3, see [TESTING.md](TESTING.md#release-gates)).
3. `npm run version:bump -- minor` (or `patch` / an explicit version).
4. In `CHANGELOG.md`, move the `[Unreleased]` notes under the new version heading the script created.
5. Update "Current version / Current milestone" at the top of DEVELOPMENT_PLAN.md.
6. `npm run check`
7. Commit: `chore(release): v0.3.0`
8. Tag on `main`: `git tag -a v0.3.0 -m "v0.3.0 – Web App Shell" && git push origin v0.3.0`
9. Optional: create a GitHub Release from the tag, pasting the CHANGELOG section.

## CHANGELOG format

[Keep a Changelog](https://keepachangelog.com) style. Sections per release: **Added, Changed, Fixed, Removed, Content, AI rules, Security**. Write for a reader who wasn't there: what changed and why it matters.
