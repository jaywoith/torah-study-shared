# Architecture

## Backend is the Single Source of Truth

All study generation, framework rules, and AI behavior live on the backend. Clients (web, iOS, Android) are thin consumers.

## Shared Packages

- **torah-core**: Pure TypeScript functions and models. No AI calls, no UI. Contains:
  - Framework and level configurations
  - Study generator
  - Siddur path sequencing
  - Language mode handlers
  - Validation

- **torah-ai-rules**: Personas, system prompts, and constraints. Versioned independently so prompt changes can be reviewed.

## Data Flow

1. User profile (framework, level, interests, language mode, length) is stored on the backend.
2. Backend calls `generateDailyStudy` from torah-core.
3. Backend loads the appropriate persona and system prompt from torah-ai-rules for any AI enrichment or Rabbi Coach interaction.
4. Clients receive structured JSON and render it. They never contain framework-specific logic.

## Next Steps

- Backend service that loads the packages and exposes endpoints.
- Web client (with admin surface for rules).
- iOS and Android clients.
