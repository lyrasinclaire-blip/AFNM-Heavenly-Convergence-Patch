---
name: workshop-publishing
description: Upload mods to Steam Workshop and manage the release lifecycle. Activate when publishing or updating a mod on Steam Workshop, preparing a release, or setting up Workshop publishing for the first time.
---

# Skill: Workshop Publishing

Upload mods to Steam Workshop and manage the release lifecycle.

## When to activate

- When the user wants to publish or update their mod on Steam Workshop
- When preparing a release
- When setting up Workshop publishing for the first time

## Prerequisites

- The sibling `../ModUploader-AFNM` repo must exist. Run `scripts/setup.sh` if missing.
- Steam must be running locally.
- `package.json` must have valid `afnmWorkshop` fields (title, tags, visibility).

## First-Time Setup

1. Edit `DESCRIPTION.md` at the repo root with your mod's public description (Markdown format). This is the canonical source — it renders on GitHub and is auto-converted to BBCode for Steam Workshop.
2. Update `package.json` with your Workshop metadata:
   ```json
   "afnmWorkshop": {
     "workshopId": "",
     "title": "My Mod Name",
     "tags": ["Gameplay"],
     "visibility": "private",
     "previewImagePath": "path/to/preview.png"
   }
   ```
3. First upload with `--allow-create`:
   ```bash
   bun run workshop:upload -- --change-note "v0.1.0 - Initial release" --allow-create
   ```
4. Save the returned Workshop ID back to `afnmWorkshop.workshopId` in `package.json`.

## Description Resolution

The upload script resolves the Workshop description with this priority:

1. `--description` CLI flag (explicit override, passed as-is)
2. `DESCRIPTION.md` at repo root (read from disk, converted Markdown → BBCode)
3. `package.json#afnmWorkshop.description` (legacy fallback, prints a console warning)
4. Omitted (no `--description` arg passed to ModUploader)

## Release Order

1. Finish code and docs. Update `DESCRIPTION.md` if the public description changed.
2. Run `bun run release:validate`
3. Upload to Workshop: `bun run workshop:upload -- --change-note "vX.Y.Z - What changed"`
4. Commit and push to `main`
5. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z` (triggers GitHub Release using `DESCRIPTION.md` as release body)

## Rules

- Always upload to Workshop BEFORE pushing the git tag. The GitHub Release workflow only handles the GitHub artifact — it does not upload to Workshop.
- Always include a descriptive `--change-note` with the version number.
- Start with `"visibility": "private"` for testing. Change to `"public"` when ready.
- The preview image should be under 1MB. The uploader auto-compresses larger images.
- Only absolute image URLs (`https://...`) are converted to `[img]` tags in BBCode. Relative/local image paths in `DESCRIPTION.md` are stripped to alt text.
