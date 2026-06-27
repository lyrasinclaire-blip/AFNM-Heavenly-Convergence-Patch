---
name: afnm-modding
description: Master orientation skill for Ascend From Nine Mountains mod development. Activate on any AFNM modding task to get project layout, toolchain, ModAPI-first philosophy, the fallback ladder, and routing to the correct specialized skill. This is the entry-point skill — load it first when starting mod work.
---

# AFNM Modding — Orientation

This skill routes to the correct specialized skill for AFNM mod tasks. For project layout, commands, conventions, and the ModAPI-first fallback ladder, see `AGENTS.md`. For deep patterns and pitfalls, see `SUPPLEMENTARY_GUIDE.md`.

## When to Activate

- Starting any AFNM mod development task
- Unfamiliar with this project's layout or conventions
- Unsure which specialized skill applies to the current task

## Task-to-Skill Routing

| Task | Skill to load |
|------|--------------|
| Writing or using ModAPI hooks, actions, utilities | `modapi-lookup` |
| TypeScript code, types, interfaces | `typescript-afnm` |
| General TypeScript patterns and best practices | `typescript-best-practices` |
| Mod settings panels, custom screens, injected UI | `frontend-mod-ui` |
| Generic frontend/web UI design | `frontend-design` |
| Build errors, typecheck failures, runtime bugs | `systematic-debugging` |
| Verifying ModAPI surface against installed game | `runtime-oracle` |
| Testing mod in the actual game client | `live-game-testing` |
| Browser automation (generic or game Electron) | `agent-browser` |
| Automating Electron desktop apps via CDP | `electron` |
| Pre-commit / pre-release validation | `pre-commit-validation` |
| Steam Workshop publishing | `workshop-publishing` |
| Commit messages, branch naming, tags | `conventional-git` |
| Exploratory QA / bug hunting for web apps | `dogfood` |

## Gotchas

1. **This repo IS the mod template.** Do not create separate template directories or scaffold new project structures. The template is the working directory itself — modify it directly.

2. **`bun`, not `npm`.** All commands use `bun`. Using `npm` will create lockfile conflicts and may pull different dependency versions.
