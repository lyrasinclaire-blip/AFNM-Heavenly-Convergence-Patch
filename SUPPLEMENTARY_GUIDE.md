# Supplementary Guide: AFNM Mod Patterns That Matter

This is the guide for the parts that do not fit cleanly into the upstream example repo.

It distills the patterns learned while shipping:

- `AFNM-CraftBuddy`
- `Lucky All Around`
- `ElderGPT Spirit Ring`

Unless noted otherwise, the runtime statements below were rechecked against `afnm-types@0.6.54` and confirmed by the upstream developer.

## 1. Pick The Right Mod Shape First

Start with the mod category, not code. This determines which parts of the ModAPI you lean on and how to structure the project. For method signatures referenced below, see `docs/reference/MODAPI_QUICK_REFERENCE.md`.

### Content addition

The most common mod type. You add new items, characters, locations, quests, events, recipes, enemies, or crafting techniques to the game world.

Default stack:

- `actions.addItem()`, `actions.addLocation()`, `actions.addQuest()`, etc.
- `actions.addItemToShop()`, `actions.addToSectShop()`, `actions.linkLocations()`, `actions.addEventsToLocation()` for integration
- asset imports for icons and backgrounds
- event step definitions for narrative

Use the upstream [AfnmExampleMod docs](https://lyeeedar.github.io/AfnmExampleMod/) as the primary content reference for this shape.

### Narrative / story

Quest chains, branching event sequences, calendar events, triggered events, and companion interactions. A specialization of content addition focused on event flow rather than items.

Default stack:

- `actions.addQuest()`, `actions.addCalendarEvent()`, `actions.addTriggeredEvent()`
- event step arrays with `kind: 'text'`, `kind: 'choice'`, `kind: 'speech'`, etc.
- `utils.createQuestionAnswerList()` for branching dialogue
- flags for tracking quest progress and branching state

### Quality-of-life / UI tool

Custom screens, stat viewers, inventory helpers, map tools, crafting assistants, or any mod that adds a new interface.

Default stack:

- `addScreen()` for full-page interfaces
- `injectUI()` for small affordances in existing dialogs (with screen sub-slots like `'combat-topBarPlayerInfo'`, `'crafting-craftingScreen'`, `'stoneCutting-jadeCuttingScreen'`)
- `useSelector()`, `useGameFlags()`, and `useGameSettings()` inside screen components
- `useKeybinding()` for keyboard shortcuts in screen contexts
- `utils.getHasSaveLoaded()` to gate save-specific UI
- `actions.triggerUIReset()` for full component remount
- `registerKeybinding()` for global mod hotkeys
- `GameTooltip`, `GameTooltipBox`, `TooltipLine` for formatted tooltip displays
- `utils.showToast()` for transient notifications
- persistent overlay mounted to `document.body` if the UI must survive screen transitions
- `actions.setModData()` for persistent mod state in save files

### Gameplay modifier

Changes probabilities, rewards, event pools, stat math, difficulty, or any settings-driven behavior without adding new content.

Default stack:

- mutation hooks (`onCalculateDamage`, `onBeforeCombat`, `onBeforeCraft`, `onModifyRecipeIngredients`, `onDeriveRecipeDifficulty`, `onEventDropItem`, `onGenerateExploreEvents`, `onCreatePlayerCombatEntity`, `onCreatePlayerCraftingEntity`)
- equipment hooks (`onDeriveEquipmentUpgradeRequirement`, `onCompleteEquipmentUpgrade`, `onDeriveEquipmentReforgeRequirement`, `onCompleteEquipmentReforge`) for overriding upgrade/reforge costs and results
- numeric global flags for settings
- `registerOptionsUI()` for a settings panel
- `registerKeybinding()` for mod hotkeys
- `utils.showToast()` for user feedback
- minimal or no custom UI beyond settings

### Overhaul / rebalance

Wholesale changes to game balance — enemy stats, crafting difficulty, damage formulas, reward scaling. A larger-scale version of gameplay modifier.

Default stack:

- `onCreateEnemyCombatEntity` for enemy stat changes
- `onCreatePlayerCombatEntity` for player combat stat changes
- `onCreatePlayerCraftingEntity` for player crafting stat changes
- `onCalculateDamage` for damage formula changes
- `onBeforeCraft` for pre-craft recipe/stat/entity modifications
- `onModifyRecipeIngredients` for dynamic ingredient alteration (runs before `onDeriveRecipeDifficulty`)
- `onDeriveRecipeDifficulty` for crafting rebalancing
- `onDeriveEquipmentUpgradeRequirement` / `onCompleteEquipmentUpgrade` for upgrade cost/result changes
- `onDeriveEquipmentReforgeRequirement` / `onCompleteEquipmentReforge` for reforge cost/result changes
- `onBeforeCombat` for encounter composition changes
- `onReduxAction` only as a last resort (runs inside reducer)

### Cosmetic / personalization

Player sprites, alternative starts, new backgrounds, custom rooms, new music or sound effects.

Default stack:

- `actions.addPlayerSprite()`, `actions.addAlternativeStart()`
- `actions.addBirthBackground()`, `actions.addChildBackground()`, `actions.addTeenBackground()`
- `actions.addRoom()`, `actions.addMusic()`, `actions.addSfx()`
- `utils.generateSkipTutorialFlags()` for alternative starts that skip tutorials

### Read-only advisor or overlay

Explains, visualizes, or recommends without mutating gameplay. Observes game state and presents information.

Default stack:

- `getGameStateSnapshot()` + `subscribe()` for reactive state
- `injectUI()` for contextual entry points
- persistent overlay if the UI must survive screen transitions
- no mutation hooks — observation only

### Search / simulation / optimizer

Predicts future turns, compares possible lines, or automates decision-making.

Default stack:

- strict separation between live game integration and pure simulation logic
- authoritative local math for hypothetical future-state evaluation
- replayable test fixtures for validation

### Combining shapes

Most real mods combine multiple shapes. Pick a primary shape to determine your project structure, then layer in secondary shapes as needed.

Common combinations:

- **Content + Narrative**: Items, locations, and quest chains. The most natural combination.
- **Gameplay modifier + UI tool**: Change probabilities/stats AND provide a settings panel to configure them.
- **Advisor + UI tool**: Read-only state observation with a persistent overlay AND injected entry points in specific dialogs.
- **Content + Gameplay modifier**: Add new items/events AND modify existing game behavior through hooks.
- **Overhaul + Content**: Rebalance existing systems AND add new content designed for the new balance.

When combining, keep each concern in its own module. E.g., hooks in one file, UI in another, content registration in a third. The template’s `src/modContent/` is the integration point — it wires the pieces together.

If your mod doesn’t fit any single shape, start with whichever shape covers your primary feature, then add from others as needed.

## 2. ModAPI-First Means More Than “Use The API When Convenient”

Follow the fallback ladder in `AGENTS.md` § Modding Rules deliberately. Practical consequences:

- Avoid polling with `setInterval` when `subscribe()` suffices
- Avoid scraping English UI copy when the snapshot already contains the state
- Avoid mutating `window.gameStore`
- Avoid reaching for a body-mounted overlay when a small injected affordance solves the problem

## 3. Important Runtime Truths

### `onGenerateExploreEvents` is earlier than it looks

The hook fires before the game expands weighted explore candidates into repeated `{ index, event }` entries.

That matters because repeat-penalty bookkeeping is keyed by the expanded weighted index:

- `currentLocationLastEvent`
- `currentLocationLastEventCount`

If you duplicate events inside the hook, you change repeat semantics. Lucky All Around therefore uses the hook only to arm a narrowly scoped weighted-slot patch.

### `onReduxAction` and `onReduxActionPayload` are powerful and dangerous

They run inside the reducer path.

That means:

- keep them fast
- keep them deterministic
- avoid side effects
- avoid network requests
- avoid UI work

Use `onReduxActionPayload` only when you need to modify or drop an action before the reducer sees it. Use `onReduxAction` only when you need post-reducer state interception. If `subscribe()` can solve the problem, prefer that.

### Combat buff timing changed in 0.6.52

New combat buffs should use the explicit timing fields:

- `beforeTechniqueEffects`
- `afterTechniqueEffects`
- `onStackGainEffects`
- `onRoundEffects`
- `onRoundStartEffects`
- `onCombatStartEffects`

Do not author new buffs with the legacy `onTechniqueEffects` + `afterTechnique` shape. Those fields are no longer read as of 0.6.52. All six timing fields listed above are confirmed implemented in the runtime and typed in `afnm-types`.

### Networking is no longer the blocker

On `0.6.50+`, normal `fetch()` works from mod code. The real risks are now:

- offline players
- CORS/server policy on the target service
- hanging requests
- uncaught failures inside hot paths

Treat remote calls as optional inputs, not required runtime dependencies.

## 4. Settings And UI Patterns

### Use numeric global flags for cross-save settings

This is the clean default for mod configuration.

Why:

- the storage already exists
- the values are available inside game flags
- the settings survive reloads and save switches

Pattern:

- read defaults from `getGlobalFlags()`
- normalize missing or legacy values on startup
- write numbers with `setGlobalFlag(...)`
- render the settings panel through `registerOptionsUI(...)`

### Choose `injectUI()` or a persistent overlay intentionally

Use `injectUI()` when:

- the action belongs to one dialog or screen
- you need a lightweight CTA, button, or readout
- the game already has a natural host slot

Use a persistent overlay when:

- the affordance must survive location, combat, event, and crafting transitions
- the user needs ongoing access from anywhere
- slot-by-slot injection would become a maintenance tax

Spirit Ring uses both: a body-mounted chat overlay plus injected entry points.

## 5. Crafting / Simulation Lessons Worth Preserving

These matter even if your new mod is not CraftBuddy-sized, because they explain where naive parity attempts drift.

- `CraftingTechnique.name` is a stable, non-localized identifier. It matches `KnownCraftingTechnique.technique` and `modAPI.gameData.craftingTechniques`.
- `modAPI.utils.evaluateScaling(...)` is useful, but not trustworthy as the optimizer authority for hypothetical future-state simulation. Keep local evaluation authoritative when future-state variables differ from the live runtime.
- Runtime-shaped percent buffs on crafting stats scale the pre-craft base stat. Flat in-craft bonuses are additive and are not multiplied by those percent buffs.
- Max-pool buffs affect both `% of max pool` restores and the effective clamp cap.
- Static `poolcost`, `stabilitycost`, and `successchance` masteries are already baked into live techniques; double-applying them is a real bug.
- `noQiCost` is a real field in current runtime payloads.
- `craftingTeamUpOverride` companion buffs also matter in current payloads.

Harmony-specific notes:

- Inscribed Patterns has a catastrophic stack-halving penalty on invalid-color actions.
- Spiritual Resonance can retarget after a repeated new-color streak; the state machine is not just “current color plus progress”.

## 6. Anti-Patterns To Avoid

- broad global monkeypatches when a narrow scoped patch will do
- DOM click listeners for behavior that already has a ModAPI hook
- English-only text parsing as the primary state source
- simulation logic that depends on live mutable runtime state
- shipping a template that cannot build as cloned
- telling future agents to use a toolchain that the repo does not actually use

## 7. Translation Support

AFNM supports mod translations via JSON files in a `translations/` directory inside the mod zip.

- Place translation files as `translations/<locale>.json` (e.g., `en.json`, `zh.json`)
- Run `bun run build` so `afnm-extract-translations` refreshes extracted keys before webpack
- The template's `copy-translations.js` stages locale JSON files into the build output before zipping and skips the generated `template.json`
- Use the `modAPI.utils` text formatting helpers (`loc()`, `itm()`, `char()`, etc.) for styled text — these work with the game's localization system
- For simple mods, a `template.json` showing the key format is enough to get started

## 8. Defensive Coding Checklist

Before shipping any mod:

- [ ] All `window.modAPI` access uses optional chaining (see `typescript-afnm` skill)
- [ ] Duplicate installation guard prevents re-initialization (e.g. `if (window.__myModInstalled) return;`)
- [ ] Default flag values are initialized on startup
- [ ] Flag keys are namespaced with mod name prefix
- [ ] Debug API is exposed on `window.__afnmModDebug`
- [ ] `bun run release:validate` passes cleanly
