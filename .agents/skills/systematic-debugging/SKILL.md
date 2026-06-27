---
name: systematic-debugging
description: Four-phase debugging methodology for AFNM mods that prevents thrashing. Activate when build errors, typecheck failures, runtime errors occur, or when mod behavior does not match expectations after repeated fix attempts.
---

# Skill: Systematic Debugging

Four-phase debugging methodology that prevents thrashing. No fixes without root cause understanding.

## When to activate

- When a build, typecheck, or runtime error occurs
- When mod behavior doesn't match expectations
- When a fix attempt fails and you're about to try another
- When the same bug keeps reappearing

## Phases

### Phase 1: Root Cause Investigation

Before writing any fix:

1. Read the exact error message and stack trace
2. Identify the failing file and line number
3. Use `bun run runtime:grep -- "<symbol>"` to check if the issue is a runtime mismatch
4. Check if the ModAPI method exists: `bun run runtime:grep -- "<method-name>"`
5. Form a specific hypothesis about why it's failing

### Phase 2: Pattern Analysis

- Is this a known AFNM gotcha? Check `SUPPLEMENTARY_GUIDE.md` §3 (Runtime Truths) and §6 (Anti-Patterns)
- Is the hook being used at the wrong timing? (See `MODAPI_QUICK_REFERENCE.md` for hook classifications)
- Missing optional chaining on `window.modAPI?.hooks?.*`?
- Is the mod being double-initialized? (Check for installation guard)

### Phase 3: Hypothesis Testing

- Test ONE change at a time
- Run `bun run typecheck` after each change
- Run `bun run build` to confirm it compiles
- Use the debug API (`window.__afnmModDebug['<mod-name>']`) to inspect runtime state

### Phase 4: Implementation

- Fix the root cause, not the symptom
- Add the installation guard if missing
- Add optional chaining if missing
- Update the debug API to expose the state that would have helped diagnose this

## Guidelines

- **After several failed attempts, step back.** Re-examine your assumptions. Use the runtime oracle to verify the API surface.
- **Avoid fixing without understanding.** If you can't explain why the fix works, it's likely a band-aid.
- **Prefer the oracle over guessing.** `bun run runtime:grep -- "<pattern>"` answers most "does this exist?" questions instantly.
- **Check SUPPLEMENTARY_GUIDE.md first.** Many debugging questions are already answered there.
