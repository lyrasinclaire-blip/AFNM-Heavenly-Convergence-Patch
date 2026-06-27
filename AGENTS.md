# Repository Guidelines

This template is the default starting point for new *Ascend From Nine Mountains* mods. Keep it lean, ModAPI-first, and easy for later agents to extend.

## Read Order

1. This file — project layout, commands, rules
2. `SUPPLEMENTARY_GUIDE.md` — deep patterns and pitfalls from shipping real mods
3. `docs/reference/MODAPI_QUICK_REFERENCE.md` — compact cheat sheet of every hook, action, and util
4. `docs/reference/AFNM_MODDING.md` — practical reference: upstream sources, fallback ladder, game code patterns
5. `.agents/skills/` — workflow-specific skills (runtime oracle, debugging, validation, publishing, etc.)

## Documentation And Skill Stewardship

Agents have standing permission to edit, correct, prune, or improve any doc or `.agents/skills/*` file. If you discover inaccurate, stale, duplicated, or misleading information while working, fix it in the same change so future agents do not inherit known traps. Verify corrections against code, tests, package scripts, or the installed-runtime oracle; if something cannot be fully verified, make the uncertainty explicit instead of presenting it as fact. Run relevant validation checks after changing docs or skills. After completing your primary task, briefly inform the user of any doc or skill corrections you made and why.

**Lean docs, single source of truth.** This template is written by AI for AI — verbose or repetitive docs degrade agent performance over time. Each fact should live in exactly one place; prefer cross-references over restating information. When adding content, keep it concise. When editing, look for opportunities to tighten or deduplicate. Do not compress artificially at the cost of losing genuinely useful information, but resist the tendency for docs to grow without bound.

## Project Layout

- `DESCRIPTION.md` is the canonical mod description. Rendered as Markdown on GitHub; auto-converted to BBCode for Steam Workshop uploads.
- `src/modContent/index.ts` is the real runtime entrypoint.
- `src/mod.ts` is the AFNM mod-loader bootstrap and metadata export.
- `src/global.d.ts` is the shared typing boundary for `window.modAPI`, runtime React, and the template debug registry.
- `scripts/mod-package.js` is the single metadata source of truth for build/package scripts.
- `scripts/copy-translations.js` copies locale JSON files from `translations/` into `dist/<package-name>/translations/` after extraction/build, excluding the generated `template.json`.
- `scripts/zip-dist.js` packages `dist/<package-name>/` into `builds/<package-name>.zip`.
- `scripts/markdown-to-bbcode.ts` converts Markdown → Steam Workshop BBCode (zero dependencies).
- `scripts/workshop-upload.ts` publishes through the sibling `../ModUploader-AFNM` repo. Reads `DESCRIPTION.md` automatically.
- `scripts/installed-game-runtime.js` is the installed-runtime oracle; use it before assuming current AFNM behavior.
- `docs/reference/MODAPI_QUICK_REFERENCE.md` is the compact ModAPI cheat sheet.
- `docs/reference/AFNM_MODDING.md` is the practical modding reference with upstream links and game code patterns.
- `SUPPLEMENTARY_GUIDE.md` contains the non-obvious patterns and pitfalls learned from CraftBuddy, Lucky All Around, and ElderGPT Spirit Ring.

## Commands

- `bun install`
- `bun run extract-translations`
- `bun run typecheck`
- `bun run build`
- `bun run release:validate` — typecheck + build + runtime:oracle in one step
- `bun run runtime:oracle`
- `bun run runtime:extract`
- `bun run runtime:grep -- "<pattern>"`
- `bun run workshop:upload -- --change-note "vX.Y.Z - ..."`

## Working Principles

These are suggestions that tend to produce better outcomes, not rigid mandates.

### Code Design

- Prefer solutions that generalize well over one-off fixes that will need revisiting.
- Prefer robust solutions over brittle or unnecessarily hacky ones.
- Gather evidence to validate or invalidate assumptions before committing to an approach.
- When in doubt between a simple solution and a clever one, lean toward simple.

### Debugging

- Debugging should be evidence-driven. If evidence is insufficient to determine root cause, increase logging or testing until it is.
- See the `systematic-debugging` skill for the full four-phase methodology.

### Code Comments

Code comments and docstrings can save future agents significant time. Add them where the logic is non-obvious or where context would be lost without them.

## Essential Rules

- Always use optional chaining on `window.modAPI` access: `window.modAPI?.hooks?.onLocationEnter?.()`
- React, ReactDOM, MUI, and MUI Icons are externalized (provided by game runtime) — never bundle them
- Prefer importing game types from the `afnm-types` package
- Run `bun run typecheck && bun run build` before committing
- When docs and runtime disagree, trust the installed runtime: `bun run runtime:grep -- "<symbol>"`
- Use commit prefixes: `feat:`, `fix:`, `docs:`, `perf:`, `chore:`

## Modding Rules

- Prefer official state access in this order (see `AFNM_MODDING.md` § Fallback Ladder for details):
  1. `window.modAPI.getGameStateSnapshot()`
  2. `window.modAPI.subscribe()`
  3. `window.modAPI.injectUI()` / `registerOptionsUI()`
  4. raw store or DOM/fiber fallback only for verified gaps
- Store mod settings in numeric global flags unless the data truly belongs to a save file (see `SUPPLEMENTARY_GUIDE.md` §4 for the pattern).
- Treat `window.modAPI.hooks.onReduxAction(...)` and `onReduxActionPayload(...)` as high-risk — they run inside the reducer path (see `SUPPLEMENTARY_GUIDE.md` §3).
- Treat `window.modAPI.hooks.onGenerateExploreEvents(...)` as pre-weight-expansion — it is not a direct "set final odds" hook (see `SUPPLEMENTARY_GUIDE.md` §3).
- Use `fetch()` normally on `0.6.50+`, but keep failures non-fatal.
- Consider keeping game-shape assumptions centralized rather than scattering them across UI and logic modules.

## Validation Workflow

- Default path:
  1. `bun run typecheck`
  2. `bun run build`
  3. `bun run runtime:oracle`
  4. `bun run runtime:grep -- "<symbol-you-care-about>"`
- Use live UI/manual testing only when the installed-runtime oracle is insufficient.
- If you launch the real client directly, create `disable_steam` beside the executable first and delete it when done. Leaving it behind will block Workshop mod loading.
- Prefer the platform's direct executable or native launcher rather than bouncing back through the Steam UI when you only need a smoke test.

## Release Workflow

1. Finish code and docs. Update `DESCRIPTION.md` if the public description changed.
2. Run `bun run release:validate`.
3. Upload to Workshop: `bun run workshop:upload -- --change-note "vX.Y.Z - ..." --allow-create`
4. Commit and push to `main`.
5. Tag with `git tag vX.Y.Z && git push origin vX.Y.Z` to trigger the GitHub Release workflow (uses `DESCRIPTION.md` as the release body).

## Available Skills

Skills in `.agents/skills/` provide workflow-specific guidance (auto-discovered by agents following the agentskills.io standard):

**Start here:**
- `afnm-modding/SKILL.md` — task-to-skill routing table and AFNM-specific gotchas

**AFNM-specific:**
- `modapi-lookup/SKILL.md` — hook/action/util reference and classification
- `typescript-afnm/SKILL.md` — TypeScript conventions for AFNM mods
- `frontend-mod-ui/SKILL.md` — mod UI design with game components
- `runtime-oracle/SKILL.md` — verify API surface against the shipped game
- `live-game-testing/SKILL.md` — disable_steam procedure and automated browser testing
- `systematic-debugging/SKILL.md` — four-phase debugging methodology
- `pre-commit-validation/SKILL.md` — evidence before claims
- `workshop-publishing/SKILL.md` — upload and release lifecycle
- `conventional-git/SKILL.md` — commit message and branch naming

**General-purpose:**
- `typescript-best-practices/SKILL.md` — general TypeScript patterns and best practices
- `frontend-design/SKILL.md` — frontend UI design principles
- `agent-browser/SKILL.md` — browser automation CLI via CDP
- `electron/SKILL.md` — Electron app automation via CDP
- `dogfood/SKILL.md` — systematic exploratory QA for web apps

## Template-Specific Notes

- The example options panel in `src/modContent/index.ts` is intentionally small but real. Replace it, do not work around it.
- The template debug surface is `window.__afnmModDebug['<package-name>']`.
- React/MUI dependencies are already present so future agents can add overlay UI without first reshaping the toolchain.
- `bun run build` now runs translation extraction before webpack, then copies locale translation files into the dist output before zipping. The generated `translations/template.json` stays as authoring scaffolding and is not packaged.
- The `.github/workflows/release.yml` builds the mod and creates a GitHub Release when you push a `v*` tag. The release body is composed from `DESCRIPTION.md` (if present) followed by auto-generated commit notes.
