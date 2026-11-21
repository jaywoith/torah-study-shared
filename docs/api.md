# API Reference (v1)

Base URL in development: `http://localhost:3000` (the web dev server proxies `/v1`). All responses are JSON. Errors are `{ "error": string, "issues"?: string[] }`, and internal error details are never returned.

**Authentication.** When the server has `APP_PASSPHRASE` set, every route except `/health`, `/v1/auth/*`, `/v1/ui-strings` and `/v1/options` returns **401** without a valid `ts_session` cookie. Without `APP_PASSPHRASE` (development) everything is open.

The response types are defined in `packages/core/src/models.ts` and `packages/core/src/api-types.ts` (`DailyStudyResponse`, `SiddurNextResponse`, `OptionsResponse`, `ApiError`).

---

## `GET /health`

```json
{ "status": "ok", "service": "torah-study-api", "version": "0.2.0" }
```

## Auth

| Route | Body | Response |
|---|---|---|
| `GET /v1/auth/session` | none | `{ authRequired, authenticated }` |
| `POST /v1/auth/login` | `{ passphrase }` | 200 `{ ok: true }` + `Set-Cookie: ts_session=…; HttpOnly; SameSite=Lax` · 401 wrong passphrase · 429 too many failures (`Retry-After`) |
| `POST /v1/auth/logout` | none | `{ ok: true }`, clears the cookie |

## `GET /v1/profile` · `PUT /v1/profile`

`GET` → `{ profile: UserProfile | null }` (`null` until saved; the web then uses the model-user default).
`PUT` with a `UserProfile` body → `{ profile }`. 400 with `issues` if invalid.
`showCantillation` (boolean, default `false`) and `divineName` (`abbreviated` | `full` | `yud_yud`, default `abbreviated`) were added in v0.5 and are optional on input: missing values are filled with the defaults, in responses and for profiles saved by v0.4.

## Progress

| Route | Body / query | Response |
|---|---|---|
| `GET /v1/progress` | `?from=YYYY-MM-DD&to=YYYY-MM-DD` (both optional) | `{ siddur: { completed: string[] }, daily: [{ date, unitId, completedAt }] }` |
| `POST /v1/progress/complete` | `{ path: "siddur", unitId }` or `{ path: "daily", unitId, date }` | 201 `{ ok: true }` (idempotent) |
| `DELETE /v1/progress/complete` | same as POST | `{ ok: true }` |
| `POST /v1/progress/reset` | `{ path }` | `{ ok: true, removed }` |
| `POST /v1/progress/import` | `{ profile?, siddurCompleted? }` | `{ importedProfile, importedSiddur }`: one-time import of v0.3 browser data. The profile is imported only if none is saved; only known Siddur ids, no duplicates. |

`unitId` is a content id (`StudyUnit.contentId`, or a Siddur unit id). Unknown ids, a missing daily date, or a non-Siddur id on the Siddur path return 400.

## `POST /v1/study/daily`

Generates, validates and returns the daily study.

**Body**
```json
{
  "profile": {
    "framework": "masorti_conservative",
    "level": "intermediate",
    "interests": ["siddur", "musar", "kabbalah", "kavannah"],
    "studyLength": "medium",
    "languageMode": "mixed",
    "showCantillation": false,
    "divineName": "abbreviated",
    "practiceContext": "Attends Shacharit minyan"
  },
  "date": "2026-11-11"
}
```
`date` is optional (defaults to today, UTC). Allowed values for each field are listed in `models.ts` (`FRAMEWORK_IDS`, `LEARNING_LEVELS`, `INTERESTS`, `STUDY_LENGTHS`, `LANGUAGE_MODES`, `DIVINE_NAME_MODES`).

**200**: `{ "study": DailyStudy, "validation": { "valid": true, "issues": [] } }`. A full example is in [examples/conservative-intermediate-daily.json](examples/conservative-intermediate-daily.json) (kept in sync by a test).

Key `DailyStudy` fields:
- `units[]`: `id` (`<date>-<contentId>`, unique within the study), `contentId` (stable, used for progress); text fields present depend on the language mode
- `display`: `{ mode, showHebrew, showTransliteration, showEnglish, layout: "stacked" | "side-by-side" | "interleaved" }`. Clients lay out units using this.
- `profile`: echoes `framework`, `level`, `studyLength`, `languageMode`, `showCantillation`, `divineName`
- `totalEstimatedMinutes`, `budgetMinutes` (short 10 / medium 20 / long 35)

**Display settings (ADR-011)** are applied to `hebrew` and `transliteration` after the language mode:
- `showCantillation: false` removes te'amim (U+0591–U+05AF), meteg and paseq; nikkud, maqaf and sof pasuq stay.
- `divineName` changes only the Tetragrammaton (any pointing, with prefixes). `abbreviated` → ה׳ and transliteration "Hashem"; `yud_yud` → יְיָ (ה׳ where the source points the Name to be read Elohim); `full` → as in the source. Transliteration reads "Adonai" for `full` and `yud_yud`. English is never changed.

**400**: invalid profile (`issues` lists each problem) or bad date. **422**: the generated study failed validation (`issues`, `study` included for debugging).

## `GET /v1/siddur/next`

| Query | Default | Meaning |
|---|---|---|
| `completed` | from the database | comma-separated Siddur unit ids; overrides the saved progress when given (even empty) |
| `interests` | `siddur,kavannah` | comma-separated; needs one of `siddur`, `kavannah`, `prayerbook_hebrew` |
| `languageMode` | `mixed` | `english` \| `hebrew` \| `split` \| `mixed` |
| `showCantillation` | `false` | `true` \| `false` |
| `divineName` | `abbreviated` | `abbreviated` \| `full` \| `yud_yud` |

**200**
```json
{ "unit": SiddurUnit, "display": LanguageDisplay, "position": 2, "total": 3, "completedCount": 1 }
```
Returns the earliest unit, in path order, that isn't in `completed`.
**400**: unknown interest, language mode, `showCantillation` or `divineName`. **404**: path complete, or no Siddur-related interest.

## `GET /v1/ui-strings`

Returns `packages/content/data/ui-strings.json`. Clients must use these labels for shared copy.

## `GET /v1/options`

Ids and display names for every profile field, so clients never hard-code them. Framework and level names come from core config; the other labels come from `ui-strings.json` (`options`).

```json
{
  "frameworks":    [{ "id": "masorti_conservative", "name": "Masorti / Conservative", "description": "…" }],
  "levels":        [{ "id": "intermediate", "name": "Intermediate", "description": "…" }],
  "interests":     [{ "id": "siddur", "name": "Siddur" }],
  "studyLengths":  [{ "id": "medium", "name": "Medium", "minutes": 20 }],
  "languageModes": [{ "id": "mixed", "name": "Mixed (Hebrew + transliteration + English)" }],
  "divineNames":   [{ "id": "abbreviated", "name": "Abbreviated (ה׳)" }]
}
```
Type: `OptionsResponse` in `packages/core/src/api-types.ts`.

## `POST /v1/coach/message` (stub)

**Body:** `{ "framework"?: FrameworkId (default "masorti_conservative"), "message": string }`
**200:** `{ reply, persona: { name, tone, systemPromptFragment }, constraints: string[], note }`. The reply is a placeholder until v0.6.0.
**400:** missing message or unknown framework.

---

## Planned

| Endpoint | Milestone |
|---|---|
| Real streaming coach replies; conversation history | v0.6.0 |
| Review queue / quiz endpoints; weekly check-in | v0.7.0 |
