# API Reference (v1)

Base URL in development: `http://localhost:3000`. All responses are JSON. Errors are `{ "error": string, "issues"?: string[] }`, and internal error details are never returned.

The response types are defined in `packages/core/src/models.ts`.

---

## `GET /health`

```json
{ "status": "ok", "service": "torah-study-api", "version": "0.2.0" }
```

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
    "practiceContext": "Attends Shacharit minyan"
  },
  "date": "2026-11-11"
}
```
`date` is optional (defaults to today, UTC). Allowed values for each field are listed in `models.ts` (`FRAMEWORK_IDS`, `LEARNING_LEVELS`, `INTERESTS`, `STUDY_LENGTHS`, `LANGUAGE_MODES`).

**200**: `{ "study": DailyStudy, "validation": { "valid": true, "issues": [] } }`. A full example is in [examples/conservative-intermediate-daily.json](examples/conservative-intermediate-daily.json) (kept in sync by a test).

Key `DailyStudy` fields:
- `units[]`: text fields present depend on the language mode
- `display`: `{ mode, showHebrew, showTransliteration, showEnglish, layout: "stacked" | "side-by-side" | "interleaved" }`. Clients lay out units using this.
- `totalEstimatedMinutes`, `budgetMinutes` (short 10 / medium 20 / long 35)

**400**: invalid profile (`issues` lists each problem) or bad date. **422**: the generated study failed validation (`issues`, `study` included for debugging).

## `GET /v1/siddur/next`

| Query | Default | Meaning |
|---|---|---|
| `completed` | none | comma-separated Siddur unit ids already completed |
| `interests` | `siddur,kavannah` | comma-separated; needs one of `siddur`, `kavannah`, `prayerbook_hebrew` |
| `languageMode` | `mixed` | `english` \| `hebrew` \| `split` \| `mixed` |

**200**
```json
{ "unit": SiddurUnit, "display": LanguageDisplay, "position": 2, "total": 3, "completedCount": 1 }
```
Returns the earliest unit, in path order, that isn't in `completed`.
**400**: unknown interest or language mode. **404**: path complete, or no Siddur-related interest.

## `GET /v1/ui-strings`

Returns `packages/content/data/ui-strings.json`. Clients must use these labels for shared copy.

## `POST /v1/coach/message` (stub)

**Body:** `{ "framework"?: FrameworkId (default "masorti_conservative"), "message": string }`
**200:** `{ reply, persona: { name, tone, systemPromptFragment }, constraints: string[], note }`. The reply is a placeholder until v0.6.0.
**400:** missing message or unknown framework.

---

## Planned

| Endpoint | Milestone |
|---|---|
| `GET/PUT /v1/profile`, `POST /v1/progress/complete`, `GET /v1/progress` | v0.4.0 |
| Real streaming coach replies; conversation history | v0.6.0 |
| Review queue / quiz endpoints; weekly check-in | v0.7.0 |
