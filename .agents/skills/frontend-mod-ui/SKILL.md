---
name: frontend-mod-ui
description: Design guidance for building mod UIs that integrate with AFNM's visual style using GameDialog, GameButton, BackgroundImage, and other game-provided components. Activate when creating mod settings panels, custom screens, injected UI, or persistent overlays.
---

# Skill: Frontend Mod UI Design

Design guidance for building mod UIs that integrate well with AFNM's visual style.

## When to activate

- When creating a mod settings panel with `registerOptionsUI`
- When building a custom screen with `addScreen`
- When injecting UI with `injectUI`
- When creating a persistent overlay

## Design Principles

### Match the game's visual language

AFNM provides styled components through the screen API. Use them:

- `GameDialog` for content containers (supports `sm`, `md`, `lg` widths)
- `GameButton` for actions (supports `keybinding` and `fancyBorder` props)
- `GameIconButton` for icon-only actions
- `BackgroundImage` for screen backgrounds with particle effects
- `PlayerComponent` to show the player character
- `GameTooltip` for hover tooltips (wraps children with a tooltip provider)
- `GameTooltipBox` for tooltip content containers
- `TooltipLine` for individual tooltip lines

### Use the game's React and MUI runtime

React, ReactDOM, MUI, and Emotion are provided by the game and externalized in webpack (see `typescript-afnm` skill). Use `window.React.createElement` in options panels where JSX may be unavailable; use normal imports in screen contexts.

### Settings panel patterns

For `registerOptionsUI` components:

- Use `window.React.createElement` directly (JSX may not be available in the options context)
- Use `api.components.GameButton` for buttons
- Store state in numeric global flags via `api.actions.setGlobalFlag`
- Keep the panel focused: title, description, controls, footer

### Screen layout structure

```typescript
<Box position="relative" flexGrow={1} display="flex" flexDirection="column">
  <BackgroundImage image="..." screenEffect="dust" />
  <GameDialog title="..." onClose={() => actions.setScreen('location')}>
    {/* Content */}
  </GameDialog>
  <Box position="absolute" width="100%" height="100%" display="flex" flexDirection="column">
    <Box flexGrow={1} />
    <Box display="flex"><PlayerComponent /></Box>
  </Box>
</Box>
```

### Persistent overlay positioning

- Use `position: fixed` with high `z-index`
- Set `pointer-events: auto` on the overlay container
- Keep overlays small and non-intrusive
- Provide a way to minimize or dismiss

### Tooltip patterns

Use the game's tooltip components for consistent styling:

```typescript
<GameTooltip provider={() => (
  <GameTooltipBox>
    <TooltipLine>Effect description here</TooltipLine>
  </GameTooltipBox>
)}>
  <span>Hover target</span>
</GameTooltip>
```

Use `api.utils.parseTooltipLine(tooltip)` to render tooltip strings with colour tags, element tags, buff/item references as styled React nodes.

### Toast notifications

Use `window.modAPI.utils.showToast()` for transient feedback:

```typescript
window.modAPI?.utils?.showToast?.('Settings saved', 2000, 'success');
```

### Keybinding integration

Register global keybindings with `actions.registerKeybinding()` during init.
Use `api.useKeybinding(priority, bindings)` in screen components for contextual shortcuts.

### UI injection sub-slots and positioning

Screen-specific injection points for targeted UI injection:

- `'combat-topBarPlayerInfo'` — player info area in combat
- `'crafting-craftingScreen'` — crafting screen container
- `'stoneCutting-jadeCuttingScreen'` — jade cutting screen container

The `inject` helper supports a `position` parameter (added in `0.6.54`):

```typescript
inject(selector, content, mode?, position?)
// position: 'inside' (default) | 'before' | 'after'
// 'before' inserts before the matched element
// 'after' inserts after the matched element
```

### Game settings access

Use `api.useGameSettings()` in screen components to read/write game settings:

```typescript
const settings = api.useGameSettings();
// settings.skipSeenDialogue, settings.setSkipSeenDialogue(true), etc.
```

### Save state checks

Use `window.modAPI?.utils?.getHasSaveLoaded?.()` to check if a save is loaded before accessing save-specific state.

### Force UI refresh

Use `window.modAPI?.actions?.triggerUIReset?.()` to force all UIRefreshWrapper components to unmount and remount.

## Rules

- Use GameDialog/GameButton instead of raw HTML elements in screen contexts.
- Use `window.React.createElement` in options panels where JSX is unavailable.
- Always include `PlayerComponent` in full screens unless custom-rendering the player.
- Always provide a close/back action in dialogs (`onClose={() => actions.setScreen('location')}`).
- Use `GameTooltip`/`GameTooltipBox`/`TooltipLine` for tooltips instead of custom tooltip implementations.
- Use `showToast()` for transient user feedback instead of custom notification systems.
- Test overlays across screen transitions (location, combat, crafting, events).
