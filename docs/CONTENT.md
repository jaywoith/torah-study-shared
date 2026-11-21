# Content Guide

Content is **data**, in `packages/content/data/`. Adding or fixing content never requires code changes.

| File | Holds |
|---|---|
| `siddur.json` | Siddur path: ordered `sections`, each with ordered `units`. Also the source for the daily study's Siddur slot. |
| `study-units.json` | Everything else (Tanakh, Musar, Kabbalah, Halachah, Midrash). Each unit carries selection metadata. |
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

## After editing content

```bash
npm run check
npx tsx scripts/generate-examples.ts   # if the model user's example output changed
```

Add a CHANGELOG line under **Content**.

## Pending content policy decisions

- **Divine Name display** (deferred issue D3): currently shown fully pointed. A policy will be set in v0.5.0.
- **Text source and licensing** (v0.5.0): translations must be public domain or openly licensed, and each entry will get a `license` field.
