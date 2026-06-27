---
name: live-game-testing
description: Safe workflow for testing mods in the actual AFNM game client without Steam relaunch loops. Activate when the runtime oracle is insufficient and you need visual or UI verification of mod behavior.
---

# Live Game Testing

Safe workflow for testing mods in the actual game client without Steam relaunch loops. Includes optional automated browser testing via CDP for agents that need programmatic UI verification.

## When to Activate

- The runtime oracle is insufficient (need visual/UI verification)
- Testing UI overlays, screens, or injected components
- Verifying mod behavior in actual gameplay
- Capturing screenshots of mod UI for Workshop previews
- Automated UI testing across screen transitions

## Workflow

### 1. Build the mod

```bash
bun run build
```

### 2. Copy the zip to the game's mods directory

```bash
# Linux/macOS:
cp builds/*.zip "/path/to/Ascend From Nine Mountains/mods/"
# Windows (PowerShell):
Copy-Item builds\*.zip "C:\Program Files (x86)\Steam\steamapps\common\Ascend From Nine Mountains\mods\"
```

### 3. Create the disable_steam sentinel

```bash
# Linux/macOS:
touch "/path/to/Ascend From Nine Mountains/disable_steam"
# Windows (PowerShell):
New-Item "C:\Program Files (x86)\Steam\steamapps\common\Ascend From Nine Mountains\disable_steam" -ItemType File
```

### 4. Launch the game directly (NOT through Steam)

```bash
# Linux:
"/path/to/Ascend From Nine Mountains/launch-native.sh"
# Windows:
& "C:\Program Files (x86)\Steam\steamapps\common\Ascend From Nine Mountains\Ascend From Nine Mountains.exe"
# With DevTools (any platform — add this flag):
--remote-debugging-port=9222
```

### 5. Test the mod

### 6. Clean up — CRITICAL

```bash
# Linux/macOS:
rm "/path/to/Ascend From Nine Mountains/disable_steam"
# Windows (PowerShell):
Remove-Item "C:\Program Files (x86)\Steam\steamapps\common\Ascend From Nine Mountains\disable_steam"
```

## Automated Browser Testing (Optional)

When programmatic UI interaction is needed (screenshot capture, automated click-through, DOM inspection), connect to the running game via Chrome DevTools Protocol. This requires `agent-browser` CLI or equivalent CDP client. See the `agent-browser` skill for full CLI reference.

### Connect to the game

Launch the game with `--remote-debugging-port=9222` (see step 4 above), then:

```bash
# Take a screenshot of the current game state
agent-browser screenshot --url "http://localhost:9222" --output screenshot.png

# Execute JS in the game context
agent-browser eval --url "http://localhost:9222" --js "JSON.stringify(window.__afnmModDebug)"

# Inspect a specific mod's debug state
agent-browser eval --url "http://localhost:9222" --js "JSON.stringify(window.__afnmModDebug?.['<mod-name>']?.getConfig())"
```

### Use cases

- **Workshop preview screenshots**: Capture in-game screenshots of mod UI for Steam Workshop listing images.
- **Overlay verification**: Confirm injected UI appears in the correct dialog slots and z-index layers across screen transitions.
- **Automated smoke tests**: Script navigation through game menus to verify mod options panel renders correctly.
- **Debug state inspection**: Read `window.__afnmModDebug` to verify mod configuration and runtime state without manual DevTools interaction.

### Prerequisites

`agent-browser` is optional and not a project dependency. Not all environments will have it installed. Do not make automated browser testing a required step in any workflow.

## Gotchas

1. **`disable_steam` left behind breaks all Workshop mods.** This is the most dangerous mistake in live testing. If the sentinel file remains, Steam Workshop mod loading silently fails for all users. Always delete it immediately after testing, even if the test session crashes or is interrupted.

2. **Do NOT launch the game from the repo directory.** The game may write a `settings.json` in the working directory, polluting the project. Always launch from the game's own install directory.

3. **Recopy the zip after every rebuild.** The mods directory uses the zip from when the game launched. Rebuilding the mod does not automatically update what the game loaded. Copy the new zip and restart.

4. **Mod Manager requires CONTINUE before load.** If the Mod Manager screen is open, press CONTINUE to apply mod enable/disable state before loading a save. Skipping this causes mods to load with stale enable/disable flags.

5. **DevTools via `chrome://inspect`.** After launching with `--remote-debugging-port=9222`, open `chrome://inspect` in any Chromium browser to access the game's DevTools console. This works for both manual inspection and automated CDP connections.

6. **Prefer the runtime oracle over live launches.** Live testing is expensive and error-prone. Use `bun run runtime:oracle` and `bun run runtime:grep` for API surface verification. Reserve live testing for visual/UI concerns that cannot be verified statically.

## Integration

- `runtime-oracle` — Prefer the oracle for API surface verification; use live testing only for visual/UI concerns
- `agent-browser` — Generic browser automation CLI; provides the CDP tooling referenced in the automated testing section
- `electron` — AFNM is an Electron app; the electron skill covers general Electron automation patterns
- `pre-commit-validation` — Run validation before live testing to catch build/type errors early
- `afnm-modding` — Master orientation skill; routes here for live testing tasks
