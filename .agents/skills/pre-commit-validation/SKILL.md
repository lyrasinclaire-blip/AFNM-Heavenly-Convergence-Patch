---
name: pre-commit-validation
description: Run verification commands before claiming work is complete. Activate before committing code changes, before claiming a task is done, or before creating a release to ensure type safety and build success.
---

# Skill: Pre-Commit Validation

Run actual verification commands before claiming work is complete. Evidence before claims, always.

## When to activate

- Before committing code changes
- Before claiming a task is done
- Before creating a release
- After implementing any new feature or fix

## Workflow

```bash
# Minimum validation before any commit:
bun run typecheck
bun run build

# Full validation before release or major changes:
bun run release:validate    # runs typecheck + build + runtime:oracle

# If the mod uses hooks, verify they still exist:
bun run runtime:grep -- "<hook-names-you-use>"
```

## Guidelines

- Confirm code typechecks with `bun run typecheck` before committing.
- Confirm the build succeeds with `bun run build` before claiming it works.
- Include the oracle check before releases — runtime behavior is the authority.
- If any verification step fails, fix the issue before proceeding.
- Check `git diff` for secrets, API keys, or sensitive data before committing.
- Follow commit conventions from the `conventional-git` skill.
