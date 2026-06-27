# ModAPI Quick Reference

Compact cheat sheet for the AFNM ModAPI surface. For full documentation, see the [upstream docs](https://lyeeedar.github.io/AfnmExampleMod/).

All methods are on `window.modAPI` unless noted otherwise.

---

## State Access

| Method | Returns | Notes |
|--------|---------|-------|
| `getGameStateSnapshot()` | `RootState \| null` | Read-only snapshot of entire game state |
| `subscribe(callback)` | `() => void` | Returns unsubscribe function; fires on every Redux action |
| `actions.getGlobalFlags()` | `Record<string, number>` | Cross-save numeric flags |
| `actions.setGlobalFlag(key, value)` | `void` | Persist a numeric flag across all saves |

## UI Integration

| Method | Signature | Notes |
|--------|-----------|-------|
| `actions.registerOptionsUI(component)` | `(ModOptionsFC) => void` | Settings panel in mod-loading dialog |
| `actions.registerKeybinding(definition)` | `(KeybindingDefinition) => void` | Register custom keybinding; appears in Controls > Mods |
| `actions.triggerUIReset()` | `() => void` | Force all UIRefreshWrapper-wrapped components to unmount/remount. Added in `0.6.54`. |
| `injectUI(slotId, generator)` | `(string, InjectGenerator) => void` | Inject React content into a named game dialog/screen slot |
| `addScreen(config)` | `({ key, component, music?, ambience? }) => void` | Register a full mod screen |

### `injectUI` Slot Names and Positioning

- **Dialogs:** the dialog's DOM `id` (e.g. `'combat-victory'`)
- **Full screens:** the `ScreenType` value (e.g. `'combat'`, `'location'`, `'crafting'`, `'jadeCutting'`)
- **Screen sub-slots:** `'combat-topBarPlayerInfo'`, `'crafting-craftingScreen'`, `'stoneCutting-jadeCuttingScreen'`

The `inject` helper's 4th parameter (`position`) controls placement relative to the matched element (added in `0.6.54`):

```
inject(selector, content, mode?, position?)
// position: 'inside' (default) | 'before' | 'after'
```

## Screen/Options API (ModReduxAPI)

Methods and hooks available from the `api` object passed to mod screens,
options panels, and injected UI generators.

| Method | Notes |
|--------|-------|
| `api.actions.setModData(modName, key, data)` | Store save-scoped JSON-serializable mod data |
| `api.actions.executeCraftingTechnique(technique)` | Execute a resolved crafting technique during an active crafting session |
| `api.actions.previewCraftingTechnique(technique, state)` | Preview crafting technique results without dispatching Redux actions |
| `api.useGameSettings()` | Returns `GameSettingsProps` — access to game settings with getters and setters. Added in `0.6.54`. |

## Lifecycle Hooks — Observation (no return value)

| Hook | Parameters |
|------|-----------|
| `hooks.onLocationEnter` | `(locationId, gameFlags)` |
| `hooks.onLootDrop` | `(items[], gameFlags)` |
| `hooks.onAdvanceDay` | `(days, gameFlags)` |
| `hooks.onAdvanceMonth` | `(month, year, gameFlags)` |

## Lifecycle Hooks — Mutation (return value modifies gameplay)

| Hook | Parameters | Returns |
|------|-----------|---------|
| `hooks.onCreatePlayerCombatEntity` | `(player, combatEntity, breakthrough, gameFlags)` | `CombatEntity` |
| `hooks.onCreatePlayerCraftingEntity` | `(player, craftingEntity, breakthrough, characters, gameFlags)` | `CraftingEntity` |
| `hooks.onCreateEnemyCombatEntity` | `(enemy, combatEntity, gameFlags)` | `CombatEntity` |
| `hooks.onCalculateDamage` | `(attacker, defender, damage, damageType, gameFlags)` | `number` |
| `hooks.onBeforeCombat` | `(enemies[], playerState, gameFlags)` | `{ enemies, playerState }` |
| `hooks.onBeforeCraft` | `(player, recipe, recipeStats, gameFlags)` | `{ recipe?, recipeStats?, player? } \| undefined` |
| `hooks.onModifyRecipeIngredients` | `(recipe, gameFlags)` | `RecipeItem` |
| `hooks.onDeriveRecipeDifficulty` | `(recipe, recipeStats, gameFlags)` | `CraftingRecipeStats` |
| `hooks.onGenerateExploreEvents` | `(locationId, events[], gameFlags)` | `LocationEvent[]` |
| `hooks.onEventDropItem` | `(item, step, gameFlags)` | `ItemDesc` |

## Lifecycle Hooks — Equipment Upgrade & Reforge (0.6.54+)

These hooks intercept the equipment upgrade and reforge flows. Return `{ costItems?, resultItem? }` to override, or `undefined` to leave unchanged.

| Hook | Parameters | When |
|------|-----------|------|
| `hooks.onDeriveEquipmentUpgradeRequirement` | `(baseItem, costItems, resultItem, gameFlags)` | Before upgrade dialog is shown |
| `hooks.onCompleteEquipmentUpgrade` | `(baseItem, costItems, resultItem, gameFlags)` | Before upgrade completion dialog |
| `hooks.onDeriveEquipmentReforgeRequirement` | `(baseItem, costItems, resultItem, gameFlags)` | Before reforge dialog is shown |
| `hooks.onCompleteEquipmentReforge` | `(baseItem, costItems, resultItem, gameFlags)` | Before reforge completion dialog |

## Lifecycle Hooks — Completion (return additional event steps)

| Hook | Parameters | Returns |
|------|-----------|---------|
| `hooks.onCompleteCombat` | `(eventStep, victory, playerCombatState, foughtEnemies, droppedItems, gameFlags)` | `EventStep[]` |
| `hooks.onCompleteTournament` | `(eventStep, tournamentState, gameFlags)` | `EventStep[]` |
| `hooks.onCompleteDualCultivation` | `(eventStep, success, gameFlags)` | `EventStep[]` |
| `hooks.onCompleteCrafting` | `(eventStep, item \| undefined, gameFlags)` | `EventStep[]` |
| `hooks.onCompleteAuction` | `(eventStep, itemsBought[], gameFlags)` | `EventStep[]` |
| `hooks.onCompleteStoneCutting` | `(eventStep, gameFlags)` | `EventStep[]` |

## Lifecycle Hooks — Dangerous

| Hook | Parameters | Returns | Warning |
|------|-----------|---------|---------|
| `hooks.onReduxAction` | `(actionType, stateBefore, stateAfter, payload)` | `RootState` | Runs inside the reducer after action payload interception. Keep fast, deterministic, no side-effects. Prefer `subscribe()` when possible. |
| `hooks.onReduxActionPayload` | `(actionType, payload, stateBefore)` | `unknown \| null` | Runs before the reducer. Return a replacement payload, or `null` to drop the action. Keep fast, deterministic, no side-effects. `stateBefore` added in `0.6.54-3`. |

## Lifecycle Hooks — New Game (0.6.54-3+)

| Hook | Parameters | Returns |
|------|-----------|---------|
| `hooks.onNewGame` | `(intent: NewGameIntent)` | `NewGameIntent` |

Override all parameters of a new game: starting items, techniques, recipes, destinies, quests, money, favour, flags, player entity, and crafting actions.

```
interface NewGameIntent {
  items: ItemDesc[];
  techniques: string[];
  recipes: string[];
  destinies: string[];
  quests: string[];
  money: number;
  favour: number;
  flags: Record<string, number>;
  player: PlayerEntity;
  craftingActions: string[];
}
```

## Combat Buff Timing

AFNM `0.6.52+` replaced the legacy `onTechniqueEffects` + `afterTechnique`
pattern for new combat buffs. Prefer these fields when authoring buff data:

```
beforeTechniqueEffects
afterTechniqueEffects
onStackGainEffects
onRoundEffects
onRoundStartEffects
onCombatStartEffects
```

## Content Registration — Items

```
actions.addItem(item)
actions.addItemToShop(item, stacks, location, realm, valueModifier?, reputation?)
actions.addItemToGuild(item, stacks, guild, rank, valueModifier?, reputation?)
actions.addToSectShop(item, stacks, realm, valueModifier?, reputation?)
actions.addItemToAuction(item, chance, condition, countOverride?, countMultiplier?)
actions.addItemToFallenStar(item, realm)
```

## Content Registration — Characters & Backgrounds

```
actions.addCharacter(character)
actions.addBirthBackground(background)
actions.addChildBackground(background)
actions.addTeenBackground(background)
```

## Content Registration — Cultivation

```
actions.addBreakthrough(realm, breakthrough)
actions.addTechnique(technique)
actions.addManual(manual)
actions.addCraftingTechnique(technique)
actions.addDestiny(destiny)
actions.addDualCultivationTechnique(technique)
```

## Content Registration — World

```
actions.addLocation(location)
actions.linkLocations(existing, link)
actions.registerRootLocation(locationName, condition)
actions.addQuest(quest)
actions.addQuestToRequestBoard(quest, realm, rarity, condition, location)
actions.addCalendarEvent(event)
actions.addTriggeredEvent(event)
```

## Content Registration — Location Modification

```
actions.addBuildingsToLocation(location, buildings[])
actions.addEnemiesToLocation(location, enemies[])
actions.addEventsToLocation(location, events[])
actions.addExplorationEventsToLocation(location, events[])
actions.addMapEventsToLocation(location, mapEvents[])
actions.addMissionsToLocation(location, missions[])
actions.addCraftingMissionsToLocation(location, missions[])
```

## Content Registration — Specialized

```
actions.addCrop(realm, crop)
actions.addMineChamber(realm, progress, chamber)
actions.addGuild(guild)
actions.addEnchantment(enchantment)
actions.addFallenStar(fallenStar)
actions.addRoom(room)
actions.addMysticalRegionBlessing(blessing)
actions.addPuppetType(puppet)
actions.addAlternativeStart(start)
actions.addPlayerSprite(sprite)
```

## Content Registration — Crafting

```
actions.addRecipeToLibrary(item)
actions.addRecipeToResearch(baseItem, recipe)
actions.addResearchableRecipe(baseItem, recipe)
actions.addUncutStone(realm, uncutStone)
actions.addHarmonyType(harmonyType, config)
actions.overrideItemTypeToHarmonyType(mapping)
```

## Content Registration — Keybindings

```
actions.registerKeybinding({
  action: 'myMod.specialAction',
  category: 'general',
  displayName: 'Special Action',
  description: 'Performs a special action',
  defaultKey: 'F',
  allowRebind: true,
})
```

Registered keybindings appear in Controls settings under a "Mods" section.
Call during mod initialization. Permanent for the session once registered.

Note: As of `0.6.54-3`, `KeybindingDefinition.action` accepts plain strings — no cast needed for custom mod actions.

Use `api.useKeybinding(priority, bindings)` in screen/UI contexts to respond to keys.

## Content Registration — Audio

```
actions.addMusic(name, path[])
actions.addSfx(name, path)
```

Cast custom names: `'my_music' as MusicName`

## Utility Functions — Enemy Scaling

```
utils.alpha(enemy)              // Elite variant
utils.alphaPlus(enemy)          // Enhanced elite
utils.realmbreaker(enemy)       // Cross-realm variant
utils.corrupted(enemy)          // Corrupted variant
utils.scaleEnemy(base, realm, realmProgress)
utils.calculateEnemyHp(enemy)
utils.calculateEnemyPower(enemy)
```

## Utility Functions — Balance

```
utils.getExpectedHealth(realm, progress)
utils.getExpectedPower(realm, progress)
utils.getExpectedDefense(realm, progress)
utils.getExpectedBarrier(realm, progress)
utils.getExpectedToxicity(realm, progress)
utils.getExpectedPool(realm, progress)
utils.getExpectedIntensity(realm, progress)
utils.getExpectedControl(realm, progress)
utils.getExpectedPlayerPower(realm, progress)
utils.getExpectedArtefactPower(realm, progress)
utils.getRealmQi(realm, realmProgress)
utils.getBreakthroughQi(realm, realmProgress)
utils.getNumericReward(base, realm, progress)
utils.getPillRealmMultiplier(realm)
utils.getCraftingEquipmentStats(realm, progress, factors, type)
utils.getClothingDefense(realm, scale)
utils.getClothingCharisma(realm, mult)
utils.getBreakthroughCharisma(realm, mult)
utils.calculateDamage(attackPower, defenderDefense, defenderDr, defenderDefenseFactor, maxReduction, defenderVulnerability, realm, realmProgress, defenderProtection, cultivatorResistance)
```

## Utility Functions — Quest Templates

```
utils.createCombatEvent(enemy)
utils.createCullingMission(monster, location, description, favour)
utils.createCollectionMission(item, location, description, favour)
utils.createDeliveryMission(items, count, location, description, preSteps, postSteps, favour)
utils.createHuntQuest(monster, location, description, encounter, stones, rep, repName, maxRep, charEncounter?)
utils.createPackQuest(monster, location, description, encounter, stones, rep, repName, maxRep)
utils.createDeliveryQuest(location, description, predelivery, item, amount, postdelivery, stones, rep, repName, maxRep)
utils.createFetchQuest(title, description, srcLoc, srcHint, srcSteps, dstLoc, dstHint, dstSteps, stones, rep, repName, maxRep)
utils.createCraftingMission(recipe, cost, location, appraiser, description, introSteps, sublimeSteps, perfectSteps, basicSteps, failureSteps, favour)
```

## Utility Functions — Text Formatting

```
utils.col(text, color)    // Colored text
utils.loc(text)            // Purple — location names
utils.rlm(realm, progress?) // Styled realm name
utils.num(number)          // Styled number
utils.buf(buff)            // Pink — buff names
utils.itm(item)            // Pink — item names
utils.char(text)           // Green — character names
utils.elem(element)        // Styled technique element
utils.t(value, variables?, context?) // Translate immediately
utils.tPlural(count, one, other, variables?) // Translate pluralized copy
utils.tr(key, variables?, context?) // Deferred translation object for data definitions
```

## Utility Functions — Toast Notifications

Added in `0.6.53`. On `window.modAPI.utils`.

```
utils.showToast(message)                              // Default info toast, 3s timeout
utils.showToast(message, timeout)                     // Custom timeout in ms
utils.showToast(message, timeout, style)              // 'info' | 'success' | 'warning' | 'error'
utils.showToast(message, timeout, style, customStyle) // { bg?, border?, color? }
```

`message` accepts `React.ReactNode` (strings, JSX elements, etc.).

## Utility Functions — Tooltip (Screen/Options/InjectUI Context)

Available on `api.utils` inside screen components, options panels, and injectUI generators (on `ModReduxAPI`, not `window.modAPI.utils`).

```
api.utils.parseTooltipLine(tooltip)                         // Parse tooltip string -> styled ReactNode
api.utils.expandTooltipTemplate(template, templateValues, addPeriod?)  // Expand <N> placeholders
api.utils.expandTooltipTags(template)                       // Expand <tag> syntax to display text
```

Components for rendering tooltips (also on `api.components`):

```
api.components.GameTooltip      // Tooltip wrapper (provider, children, flipped?, disabled?, minimal?)
api.components.GameTooltipBox   // Tooltip content box (isSecondary?, isAux?, removeWidthLimit?)
api.components.TooltipLine      // Single tooltip line (children)
```

## Utility Functions — Save Management

On `window.modAPI.utils`.

```
utils.makeSave(filename)   // Create a character-scoped backup save file
utils.loadSave(filename)   // Load a character-scoped backup save file
utils.listSaves()          // List backup saves for the current character
```

## Utility Functions — Keybinding & Save State Query

```
utils.getRegisteredKeybindValue(action)  // Returns current bound key string or undefined
utils.getHasSaveLoaded()                 // Whether a save is currently loaded (0.6.54-3+)
```

## Utility Functions — Other

```
utils.createQuestionAnswerList(key, questions[], exit, showExitOnAllComplete?)
utils.flag(flag)           // Convert flag name to game flag format
utils.evalExp(exp, flags)  // Evaluate expression against flags (floors result > 3)
utils.evalExpNoFloor(exp, flags)
utils.evaluateScaling(scaling, variables, stanceLength, preMaxTransform?)
utils.generateSkipTutorialFlags(tutorials[], triggers[])
```

## Game Data Collections

Access via `window.modAPI.gameData`:

```
items                    Record<string, Item>
characters               Record<string, Character>
techniques               Record<string, Technique>
locations                Record<string, GameLocation>
quests                   Record<string, Quest>
manuals                  Record<string, ManualItem>
destinies                Record<string, Destiny>
calendarEvents           CalendarEvent[]
triggeredEvents          TriggeredEvent[]
auction                  Record<Realm, AuctionItemDef[]>
breakthroughs            Record<Realm, Breakthrough[]>
crops                    Record<Realm, Crop[]>
craftingTechniques       Record<string, CraftingTechnique>
monsters                 EnemyEntity[]
enchantments             Enchantment[]
fallenStars              FallenStar[]
rooms                    Room[]
guilds                   Record<string, Guild>
puppets                  PuppetType[]
alternativeStarts        AlternativeStart[]
backgrounds              { birth, child, teen }
techniqueBuffs           { blood, blossom, celestial, cloud, fist, weapon }
mysticalRegionBlessings  Blessing[]
dualCultivationTechniques IntimateTechnique[]
researchableMap          Record<string, RecipeItem[]>
recipeConditionEffects   RecipeConditionEffect[]
harmonyConfigs           Record<RecipeHarmonyType, HarmonyTypeConfig>
itemTypeToHarmonyType    Record<ItemKind, RecipeHarmonyType>
tutorials                { newGameTutorials, tutorialTriggers }
mineChambers             Record<Realm, Record<RealmProgress, MineChamber[]>>
uncutStones              Record<Realm, UncutStonePool | undefined>
```
