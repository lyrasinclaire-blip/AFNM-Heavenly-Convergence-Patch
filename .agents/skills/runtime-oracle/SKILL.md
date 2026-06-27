---
name: runtime-oracle
description: Verify ModAPI surface, hook existence, and launcher behavior against the installed AFNM game runtime. Activate before using any ModAPI hook you have not verified, when docs and observed behavior disagree, or when checking if a game update changed the API.
---

# Skill: Runtime Oracle

Use the installed-game runtime oracle to verify ModAPI surface, hook existence, and launcher behavior before making assumptions based on docs or types.

## When to activate

- Before using any ModAPI hook or method you haven't verified exists in the current runtime
- When docs, types, and observed behavior disagree
- When checking if a new game update changed the API surface
- Before building against undocumented behavior

## Workflow

```bash
# Print full parity summary (version, hooks, launcher behavior)
bun run runtime:oracle

# Search for specific API symbols
bun run runtime:grep -- "registerOptionsUI|injectUI|onGenerateExploreEvents"

# Check if a specific hook exists
bun run runtime:grep -- "onAdvanceDay|onAdvanceMonth"

# Check newer ModAPI symbols after a game update
bun run runtime:grep -- "onReduxActionPayload|addToSectShop|beforeTechniqueEffects"

# Check launcher behavior
bun run runtime:grep -- "disable_steam|Restarting app through Steam"

# Extract the full bundle for manual inspection
bun run runtime:extract
```

## Rules

- The extracted runtime is the source of truth. When docs say one thing and the runtime says another, trust the runtime.
- Type declarations can lead or lag the shipped binary. Verify newly-added APIs such as save helpers, reducer-payload hooks, and combat buff timing fields before depending on them.
- Cache is fingerprinted by asar file size + mtime. It auto-invalidates on game updates.
- Override game path with `AFNM_GAME_DIR="/path/to/game" bun run runtime:oracle` if auto-detection fails.
- Do NOT launch the full game just to confirm a symbol exists. The oracle is faster and non-disruptive.
