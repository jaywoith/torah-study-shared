# Multi-Repository Architecture

## Repositories

| Repo | URL | Responsibility |
|------|-----|----------------|
| **torah-study-shared** | https://github.com/jaywoith/torah-study-shared | Shared packages (`torah-core`, `torah-ai-rules`) + shared UI strings. Single source of truth for models, generation rules, AI constraints, and consistent labels. |
| **torah-study-backend** | https://github.com/jaywoith/torah-study-backend | Backend service. Loads shared packages and exposes all study generation + AI + UI-string endpoints. Clients never call AI directly. |
| **torah-study-web** | https://github.com/jaywoith/torah-study-web | Web client. Pure consumer of the backend API. No framework logic. |
| **torah-study-ios** | https://github.com/jaywoith/torah-study-ios | Native iOS client. Pure consumer of the backend API. |
| **torah-study-android** | https://github.com/jaywoith/torah-study-android | Native Android client. Pure consumer of the backend API. |

## How drift is prevented

1. **Shared packages are the single source of truth** for all models, framework configs, study generation rules, language handling, AI constraints/personas, **and shared UI strings**.
2. **Backend is the only runtime that loads the shared packages**. It owns every generation and AI call and serves shared strings.
3. **Clients contain zero framework or rule logic**. They only render structured JSON and shared strings returned by the backend.
4. **Versioning**: Shared packages (and ui-strings) are versioned. Backend pins a known version. Clients depend only on the public API contract.
5. **Validation** lives in `torah-core` and is enforced by the backend before any response is returned.
6. **Documentation is cross-linked**. Any change to rules or shared copy must update the shared packages first.

See [shared-vs-local.md](shared-vs-local.md) for the detailed best-practice split.

## Dependency flow

```
Clients (web/ios/android)
        ↓  (HTTP only — study data + UI strings)
     Backend
        ↓  (imports)
Shared packages (torah-core + torah-ai-rules + ui-strings.json)
```

No client ever imports the shared packages directly in production. This eliminates drift.
