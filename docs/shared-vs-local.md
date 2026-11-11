# Shared vs Local (Best Practice)

## What lives in shared packages + backend (single source of truth)

- All study content, commentaries, kavannah prompts, sources
- Framework configs, learning-level rules, language-mode handling
- AI personas, system prompts, constraints
- Validation logic
- **Shared UI strings** (`ui-strings.json`) that must be identical across platforms

These are served by the backend. Clients receive them via API (or a versioned content endpoint). A change here reaches every client on the next fetch—no app-store release required for content or shared labels.

## What lives in each client repo (platform-local)

- Navigation structure and gestures
- Layout, animations, and native UI components
- Local persistence implementation (UserDefaults, SharedPreferences, IndexedDB, etc.)
- Platform permissions, notifications, biometrics
- Offline caching mechanics
- Purely decorative or platform-specific chrome

These must be updated and released separately for each client.

## How clients should consume shared strings

1. Prefer the backend exposing an endpoint such as `GET /v1/ui-strings` that returns the current `ui-strings.json`.
2. Clients cache the response and fall back to a bundled copy for offline use.
3. Never hard-code shared labels (e.g. “Start Daily Study”, “Ask the Rabbi”) inside client code.

This keeps copy consistent and prevents the classic “spelling fix only shipped on iOS” problem.

## Related docs

- [multi-repo-architecture.md](multi-repo-architecture.md)
- Repos: [backend](https://github.com/jaywoith/torah-study-backend), [web](https://github.com/jaywoith/torah-study-web), [iOS](https://github.com/jaywoith/torah-study-ios), [Android](https://github.com/jaywoith/torah-study-android)
