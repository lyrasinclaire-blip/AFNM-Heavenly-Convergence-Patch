---
name: agent-browser
description: Browser automation CLI for AI agents. Use for opening pages, clicking, filling forms, taking screenshots, reading DOM snapshots, testing local harnesses, or connecting to AFNM/Electron DevTools sessions.
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Agent Browser

Use `agent-browser` when browser or Electron UI evidence is needed. Prefer AFNM-specific UI and live-testing skills first so you know whether a local harness, runtime oracle, or installed-client DevTools target is appropriate.

## Activate When

- Testing a local browser harness
- Capturing screenshots or accessibility/DOM snapshots
- Clicking through UI flows or forms
- Connecting to an Electron app via Chrome DevTools Protocol
- Collecting visual evidence for regressions

## Core Workflow

```bash
agent-browser open http://127.0.0.1:4173
agent-browser snapshot -i
agent-browser screenshot
```

For Electron/AFNM DevTools sessions, launch the app with `--remote-debugging-port=9222`, then connect or target that port according to the command reference.

## Rules

1. Prefer stable selectors and accessible text over pixel coordinates.
2. Capture a snapshot before and after key interactions.
3. Keep screenshots local to ignored temp/output paths unless the task asks for committed assets.
4. Do not make live Electron testing mandatory when a project harness or runtime oracle can answer the question.
5. Never put credentials, session tokens, or private screenshots in commits.
6. If this skill or its references become stale, correct them immediately; skills are editable project docs.

## AFNM Notes

- Use `runtime-oracle` for API checks before launching the installed game.
- Use `frontend-mod-ui` for AFNM UI component patterns.
- Use `live-game-testing` for installed-client testing and `disable_steam` cleanup.
- Use `electron` for general Electron CDP connection details.

## References

- `references/commands.md` — CLI command reference
- `references/session-management.md` — sessions and target reuse
- `references/snapshot-refs.md` — interpreting snapshots
- `references/video-recording.md` — recordings when needed
- `references/authentication.md` — auth/session patterns
- `references/proxy-support.md` — proxy setup
- `references/profiling.md` — performance profiling
- `templates/` — reusable command snippets
