# Architecture

## Principle: one source of truth

All rules, content and AI behavior live in the shared packages. The **API is the only runtime that loads them.** Clients render JSON and never contain framework logic, content or shared labels. A content fix reaches every client on the next fetch, with no client release.

```
 apps/web (v0.3+)            ── HTTP only ──►  apps/api
                                                 │ imports
                         ┌───────────────────────┼────────────────────────┐
                         ▼                       ▼                        ▼
                 packages/core          packages/content          packages/ai-rules
           (pure logic, no I/O)    (JSON content + UI strings)   (personas, prompts,
                         ▲                       │                 constraints)
                         └──── types ────────────┘──── types ─────────────┘
```

Dependency direction is one-way: `content` and `ai-rules` depend on `core` (for types only). `core` depends on nothing. `api` depends on all three. Nothing depends on `api`.

## Packages

### `packages/core` (`@torah/core`)
Pure TypeScript. No I/O, network, randomness or clock access.

| File | Responsibility |
|---|---|
| `models.ts` | All types. Enum id arrays (`FRAMEWORK_IDS`, `LEARNING_LEVELS`, …) are the single source for both types and runtime checks. |
| `frameworks.ts` | Per-framework config (sources, Kabbalah depth cap, Musar emphasis, `progressiveDefaultAllowed`). |
| `learning-levels.ts` | Per-level config (scaffolding, Hebrew density, Kabbalah depth cap). |
| `language.ts` | The four language-mode display contracts; `applyLanguageMode`; Hebrew helpers (shoresh/POS lookups). |
| `siddur-path.ts` | Flattens Siddur sections into a sequence; `getNextSiddurUnit` (first not-completed unit). |
| `study-generator.ts` | `generateDailyStudy(profile, date, library)`: the selection algorithm (see the file header). |
| `validation.ts` | `validateDailyStudy`: structural and heuristic checks run before every response. |
| `profile.ts` | `parseUserProfile`: validation of untrusted input. |
| `paths.ts` | Specialized path definitions (Musar, Kabbalah, Halachah). Not yet wired into generation. |

### `packages/content` (`@torah/content`)
Data, not code. `data/study-units.json` (non-Siddur units with selection metadata), `data/siddur.json` (ordered Siddur sections), `data/ui-strings.json` (shared labels). `src/index.ts` exports them typed as `ContentLibrary`. Rules for content are in [CONTENT.md](CONTENT.md).

### `packages/ai-rules` (`@torah/ai-rules`)
Personas per framework, system prompts (`src/system-prompts/*.md`), and `getConstraintsForFramework`. Prompt changes are reviewed like code and noted in the CHANGELOG.

### `apps/api` (`@torah/api`)
Express. `src/app.ts` exports `createApp({ library? })` (tests inject fixture content). `src/index.ts` only listens. Routes are in `src/routes/`. It runs with `tsx` (no build step); that's fine for personal use, and a bundling step can be added if deployment needs it.

### `apps/web` (`@torah/web`)
React + Vite + TypeScript, phone-first. Becomes an installable PWA in v0.8.0.

| File | Responsibility |
|---|---|
| `src/api.ts` | Typed fetch client for `/v1/*` (relative URLs; Vite proxies to the API in dev/preview). |
| `src/strings.tsx` | Context providing `/v1/ui-strings` and `/v1/options`; `fmt()` for `{placeholder}` strings. |
| `src/storage.ts` | Safe `localStorage` wrappers; profile + Siddur progress until v0.4.0; default = model user. |
| `src/text.ts` | Sentence segmentation and interleaving for the Mixed layout. |
| `src/dates.ts` | Local-calendar ISO dates. The web always sends an explicit date; the API's default is UTC. |
| `src/components/` | `UnitText` (language layouts), `UnitCard` (one study/Siddur unit). |
| `src/screens/` | `TodayScreen`, `SiddurScreen`, `SettingsScreen`. Routing is a hash (`#/today`, `#/siddur`, `#/settings`) with no router library. |

The web imports **types only** from `@torah/core` (including the HTTP contract in `api-types.ts`) and `@torah/content`. No shared runtime code is bundled into the client.

## Daily study generation (summary)

1. Filter content to units eligible for the profile: framework allowed, `minLevel` ≤ user level, and Kabbalah depth ≤ min(framework cap, level cap).
2. Categories come from interests (Siddur, Musar, Kabbalah, Halachah). Tanakh is always the anchor.
3. Each category rotates by day number, so the same date always gives the same study and the next date moves forward.
4. Fill to the study-length budget (short 10 / medium 20 / long 35 min): Tanakh first, then one per category, then more rounds if there's room.
5. Apply the language mode. Validate. Return.

## Shared vs. client-local

**Shared (served by the API):** all study content, commentary, kavannah prompts, sources; framework, level and language rules; AI personas and constraints; validation; shared UI strings.

**Client-local:** navigation, layout, animation, native components; local persistence and offline-cache mechanics; notifications and permissions; purely decorative chrome.

Clients cache `/v1/ui-strings` and may bundle a fallback copy for offline use. They never hard-code shared labels.

## Data that doesn't exist yet

User profile and progress are currently supplied by the client on each request. Server-side persistence (SQLite) arrives in v0.4.0. Until then the API is stateless.
