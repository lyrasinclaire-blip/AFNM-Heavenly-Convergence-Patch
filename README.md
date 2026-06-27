# AFNM Agent Mod Template

A reusable starter repo for building *Ascend From Nine Mountains* mods with a workflow that already matches the current `0.6.53` ModAPI types, installed-runtime validation, and Steam Workshop packaging.

If you are handing this repo to an AI coding agent, have it read [AGENTS.md](./AGENTS.md) first.

## What this template gives you

- a modular TypeScript + webpack scaffold instead of a single-file throwaway mod
- a working options-panel example backed by numeric global flags
- installed-runtime inspection scripts for verifying the live game bundle without launching Steam
- packaging and Workshop upload helpers that derive metadata from `package.json`
- preinstalled React/MUI dependencies so UI work does not start with dependency churn

Use the upstream [AfnmExampleMod](https://github.com/Lyeeedar/AfnmExampleMod) repo as the content/API reference. Use this repo as the implementation scaffold you actually clone for new work.

## Why this repo exists

`AfnmExampleMod` is the right upstream API/content reference, but it is not optimized as a modern starter scaffold for iterative mod shipping.

This template exists to give you:

- a cleaner build and packaging baseline
- a real settings/debug scaffold instead of throwaway sample code
- installed-runtime validation scripts for checking live game behavior quickly
- repository guidance tuned for future work by AI coding agents as well as humans

## Prerequisites

- **[bun](https://bun.sh)** — this template uses bun as its package manager and script runner. All commands (`bun run build`, `bun run typecheck`, etc.) expect bun. Install it with `curl -fsSL https://bun.sh/install | bash` or see [bun.sh](https://bun.sh) for other methods.

## Quick Start

1. Clone or copy this directory into a new repo.
2. Run the setup script:
   ```bash
   bun run setup
   ```
   This installs dependencies, clones the [ModUploader-AFNM](https://github.com/lemon07r/ModUploader-AFNM) sibling repo (needed for Workshop uploads), detects your game installation, and verifies the build works. Works on Windows, macOS, and Linux.
3. Update `package.json`:
    - `name`
    - `version`
    - `description`
    - `author`
    - `afnmWorkshop.*` (title, tags, visibility)
4. Edit `DESCRIPTION.md` with your mod's public description (used on GitHub and converted to BBCode for Steam Workshop).
5. Replace the example logic in `src/modContent/index.ts`.
5. Run `bun run build`.
6. Copy `builds/<package-name>.zip` into the installed game's `mods/` directory.

The template exposes a debug surface at `window.__afnmModDebug['<package-name>']`.

## Replace These First

Before you do real feature work, update:

- `package.json` metadata and `afnmWorkshop` fields
- `DESCRIPTION.md` with your mod's public description
- the example settings/debug logic in `src/modContent/index.ts`
- any placeholder public copy in this README if you keep it in your own repo

## Layout

Start in `src/modContent/index.ts` for gameplay logic and settings wiring.

<details>
<summary>Expand full repository layout</summary>

- `DESCRIPTION.md`
  Canonical mod description. Markdown on GitHub, auto-converted to BBCode for Steam Workshop.
- `src/mod.ts`
  Metadata/bootstrap entry for the AFNM mod loader.
- `src/modContent/index.ts`
  Real runtime entrypoint. Start here for gameplay logic, hooks, settings, and UI wiring.
- `src/global.d.ts`
  Shared typings for `MOD_METADATA`, `window.modAPI`, runtime React, and the debug registry.
- `scripts/mod-package.js`
  Single source of truth for metadata and `gameVersion` resolution.
- `scripts/installed-game-runtime.js`
  Installed-runtime oracle for parity checks.
- `scripts/copy-translations.js`
  Post-build translation staging — copies locale translation files from `translations/` into the dist folder before zipping, excluding the generated `template.json`.
- `scripts/markdown-to-bbcode.ts`
  Zero-dependency Markdown → Steam Workshop BBCode converter used by the upload script.
- `scripts/workshop-upload.ts`
  Upload wrapper around the sibling `../ModUploader-AFNM` repo. Reads `DESCRIPTION.md` automatically.
- `scripts/zip-dist.js`
  Post-build packaging — writes dist `package.json` and creates the zip.
- `translations/`
  Translation authoring files. `bun run build` extracts keys before webpack, regenerates `template.json`, then stages locale `.json` files into the build output before zipping.
- `.github/workflows/release.yml`
  GitHub Actions workflow that builds the mod and creates a GitHub Release on `v*` tags.
- `AGENTS.md`
  Low-noise implementation guidance for future coding agents.
- `SUPPLEMENTARY_GUIDE.md`
  The deeper strategy guide: architecture choices, gotchas, testing discipline, and advanced patterns.
- `.agents/skills/`
  Workflow-specific skills following the [agentskills.io](https://agentskills.io/) standard. Auto-discovered by supporting agents (Roo Code, Cline, Claude Code). Each skill is a directory containing a `SKILL.md` with task-specific instructions.

</details>

## Default Workflow

Build and validation:

```bash
bun run typecheck
bun run build
bun run runtime:oracle

# Or run all three in sequence:
bun run release:validate
```

Useful runtime grep examples:

```bash
bun run runtime:grep -- "getGameStateSnapshot|injectUI|onGenerateExploreEvents|registerOptionsUI"
```

Workshop upload:

```bash
bun run workshop:upload -- --change-note "v0.1.0 - Initial release" --allow-create
```

Before the first public upload, make sure you have set:

- `afnmWorkshop.title`
- `DESCRIPTION.md` (converted to BBCode automatically)
- `afnmWorkshop.previewImagePath`
- either `afnmWorkshop.workshopId` or `--allow-create`

## Recommended Architecture

- Use `window.modAPI.getGameStateSnapshot()` for read-only state.
- Use `window.modAPI.subscribe()` for reactive updates.
- Use `window.modAPI.actions.registerOptionsUI(...)` for mod settings before inventing your own settings surface.
- Use `window.modAPI.injectUI(...)` for screen- or dialog-local affordances.
- Use a persistent body-mounted overlay only when the UI truly must survive screen transitions.
- Keep game-shape assumptions centralized in `src/modContent/` or a dedicated `src/integration/` folder if the mod grows.

## Manual Live Testing

Most tasks should use the installed-runtime oracle, not a live UI launch.

<details>
<summary>If you need a real client smoke test</summary>

1. create the empty `disable_steam` file beside the game executable
2. launch through the platform's direct executable or native launcher
3. remove `disable_steam` when you finish, or Workshop mods will stop loading

</details>

## Compatible AI Coding Agents

Agent context files (`CLAUDE.md`, `GEMINI.md`, `.clinerules`, `.github/copilot-instructions.md`, `.windsurf/rules/afnm-modding.md`) are symlinks to `AGENTS.md` — any agent that reads one of these will pick up the project rules and skills automatically.

[Amp](https://ampcode.com) · [Charm Crush](https://github.com/charmbracelet/crush) · [Claude Code](https://docs.anthropic.com/en/docs/claude-code) · [Cline](https://cline.bot) · [Codex CLI](https://github.com/openai/codex) · [Cursor](https://cursor.com) · [Droid](https://docs.factory.ai) · [Gemini CLI](https://github.com/google-gemini/gemini-cli) · [GitHub Copilot](https://github.com/features/copilot) · [Goose](https://goose-docs.ai) · [JetBrains Junie](https://www.jetbrains.com/junie/) · [Kilo Code](https://kilocode.ai) · [Kiro](https://kiro.dev) · [OpenCode](https://opencode.ai) · [Qwen Code](https://github.com/QwenLM/qwen-code) · [Windsurf](https://windsurf.com)

## Docs To Read Next

- [AGENTS.md](./AGENTS.md) — project rules and validation workflow
- [SUPPLEMENTARY_GUIDE.md](./SUPPLEMENTARY_GUIDE.md) — deep patterns from shipping real mods
- [ModAPI Quick Reference](./docs/reference/MODAPI_QUICK_REFERENCE.md) — compact cheat sheet of every hook, action, and util
- [AFNM Modding Reference](./docs/reference/AFNM_MODDING.md) — upstream sources, fallback ladder, game code patterns
- [Skills](./.agents/skills/) — workflow-specific skills (runtime oracle, debugging, validation, publishing, etc.)
- [AfnmExampleMod docs](https://lyeeedar.github.io/AfnmExampleMod/) — upstream API and content reference
