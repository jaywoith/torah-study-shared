# Torah Independent Study App – Shared Packages

Multi-platform (iOS, Android, web) Torah study application with a shared backend.

## Core Principles

- **Backend is the single source of truth** for all rules, study generation, and AI behavior.
- Shared packages (`torah-core` and `torah-ai-rules`) prevent drift across clients.
- Shared UI strings (`ui-strings.json`) keep labels consistent across platforms.
- Clients never hard-code framework logic or shared labels. All generation and AI calls go through the backend.

## Five Theological Frameworks

1. Hasidic
2. Orthodox
3. Modern Orthodox
4. Masorti / Conservative
5. Reform

## Learning Levels (independent of framework)

- Beginner
- Intermediate
- Advanced
- Scholar

## Language Modes

- English
- Hebrew
- Split
- Mixed (English + transliteration + pointed key Hebrew words)

## Primary Modules

- Personalized daily study (Chok LeYisrael style)
- Siddur path
- Specialized paths (Musar, Kabbalah, Halachah)
- AI Rabbi Coach

## Model User (initial implementation)

Conservative framework, Intermediate level, interests in Siddur/davening/kavannah, Musar, and Kabbalah, medium study length, mixed language mode. Attends Shacharit minyan.

## Related Repositories

| Repo | Purpose |
|------|---------|
| [torah-study-backend](https://github.com/jaywoith/torah-study-backend) | Backend service (loads these packages and serves UI strings) |
| [torah-study-web](https://github.com/jaywoith/torah-study-web) | Web client |
| [torah-study-ios](https://github.com/jaywoith/torah-study-ios) | iOS client |
| [torah-study-android](https://github.com/jaywoith/torah-study-android) | Android client |

See [docs/multi-repo-architecture.md](docs/multi-repo-architecture.md) and [docs/shared-vs-local.md](docs/shared-vs-local.md) for how drift is prevented and best-practice split.

## Repository Layout (this repo)

```
packages/
  torah-core/          # Shared models, generators, validation (pure functions)
  torah-ai-rules/      # Personas, system prompts, constraints
docs/
examples/              # Sample daily study and Siddur units
ui-strings.json        # Shared labels served by the backend
```

See `docs/architecture.md` and `docs/user-personas.md` for details.
