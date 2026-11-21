# Content Guide

Content is **data**, in `packages/content/data/`. Adding or fixing content never requires code changes.

| File | Holds |
|---|---|
| `siddur.json` | Siddur path: ordered `sections`, each with ordered `units`. Also the source for the daily study's Siddur slot. |
| `study-units.json` | Everything else (Tanakh, Musar, Kabbalah, Halachah, Midrash). Each unit carries selection metadata. |
| `../sefaria-manifest.json` | Which refs and versions `npm run content:import` brings in from Sefaria. |
| `ui-strings.json` | Shared UI labels served at `/v1/ui-strings`. |

## Rules (enforced by `packages/content/test/content.test.ts`)

1. **Unique, stable ids.** Format: `<type>-<work>-<ref>`, e.g. `tanakh-tehillim-145-9`, `musar-avot-1-14`. Never rename an id once used: progress will reference it (v0.4+).
2. **Hebrew is pointed** (nikkud) whenever present.
3. **Every unit has a `source`.** Use a precise reference (book chapter:verse, tractate daf, work chapter). Avoid vague ones like "(selected)".
4. **`verified` is `false` until a human has checked** the Hebrew, nikkud, translation and citation against a real text. Use `reviewNote` to say what still needs checking.
5. **Never fabricate.** If a quotation, attribution or nikkud is uncertain, leave it out or flag it in `reviewNote`. This applies to people and to LLMs.
6. Siddur units belong in `siddur.json`, not `study-units.json`.
7. `estimatedMinutes` is required for study units (it drives the session budget).

## Study unit fields

```jsonc
{
  "id": "musar-avot-1-14",
  "type": "musar",                 // tanakh | midrash | musar | kabbalah | halachah | commentary
  "title": "Pirkei Avot 1:14 – Hillel’s three questions",
  "hebrew": "אִם אֵין אֲנִי לִי…",   // optional, pointed
  "transliteration": "Im ein ani li…",
  "english": "If I am not for myself…",
  "commentary": "…",               // framework-appropriate
  "kavannahPrompt": "…",
  "source": "Pirkei Avot 1:14",
  "reviewItems": [{ "type": "hebrew_recognition", "text": "…", "expected": "…" }],
  "estimatedMinutes": 4,
  "interests": ["musar"],          // which interests this serves
  "minLevel": "beginner",          // lowest level that should see it
  "frameworks": ["masorti_conservative"], // optional; omit = all frameworks
  "depth": "symbolic",             // Kabbalah only: symbolic | intermediate | advanced
  "verified": false,
  "reviewNote": "optional: what still needs checking"
}
```

## How selection uses the metadata

- A unit is eligible if its `frameworks` include the user's framework (or are omitted), `minLevel` ≤ the user's level, and (for Kabbalah) `depth` ≤ min(framework cap, level cap).
- Within a type, units rotate by date in file order. More units means longer before repeats.

## Importing from Sefaria (ADR-010, ADR-012)

Texts come from Sefaria at **build time**; the app never calls Sefaria at runtime.

1. Add an entry to `packages/content/sefaria-manifest.json`:
   - `studyUnits[]`: `{ "id", "ref", "versions": "tanakh", "defaults": { type, title, interests, minLevel } }`
   - `siddur[]`: `{ "section", "id", "ref", "versions": "siddur", "defaults": { blessingOrLine, relatedInterests } }` (order in the list = order in the path)
   - optional: `source` (citation override), `remove` (hand-written fields to drop when the text changes), `personalUseOnly` (allow an uncleared license, ADR-012)
2. `npm run content:import -- --dry-run`, then `npm run content:import`.
3. Review the diff, `npm run check`, regenerate examples if needed.

The import owns `hebrew`, `english`, `source` and `provenance`; every other field is hand-written and kept. `verified: true` entries are never changed without `--force`, and a forced change resets `verified`.

**License policy:** Public Domain, CC0, CC-BY, CC-BY-SA allowed; CC-BY-NC allowed but flagged; anything else rejected unless `personalUseOnly`. Every imported entry stores `provenance` (ref, URL, import time, per-language version title and license).

**Sanitizing:** HTML tags unwrapped; footnotes, `<sup>` markers and Masorah parasha markers ({פ}/{ס}) removed with their content; whole-segment editorial notes (Metsudah's `<small>`/`<i>` notes) skipped; whitespace collapsed. Te'amim are kept; hiding them is a display setting.

## Drafted commentary

Commentary and kavannah prompts may be drafted by an LLM, but only under these rules: no quotations or citations beyond the unit's own text (any quoted phrase must match the imported translation), a `reviewNote` saying it is a draft, and `verified: false` until the owner approves. A test enforces the last rule.

## After editing content

```bash
npm run check
npx tsx scripts/generate-examples.ts   # if the model user's example output changed
```

Add a CHANGELOG line under **Content**.

## Pending content policy decisions

- **Divine Name display:** decided (ADR-011). Content stores the source form; the API renders it per the user's setting.
- **Text source and licensing:** decided (ADR-010, ADR-012). See "Importing from Sefaria" above.
