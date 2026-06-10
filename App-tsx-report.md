# App.tsx Detailed Report

Source analyzed: [src/App.tsx](src/App.tsx)

## 1. Imports

- React hooks from [src/App.tsx](src/App.tsx#L1): useCallback, useEffect, useMemo, useRef, useState.
- React types from [src/App.tsx](src/App.tsx#L2): CSSProperties, FormEvent.
- UI components/icons from [src/App.tsx](src/App.tsx#L3): BarsIcon, Button, ChevronDownIcon, SearchIcon.

## 2. Type Aliases

### Engine
Defined in [src/App.tsx](src/App.tsx#L5).

- name: Display name of engine.
- action: URL used as form action.
- placeholder: Input placeholder text.
- icon: Short icon text shown in dropdown.

### Tile
Defined in [src/App.tsx](src/App.tsx#L12).

- name: Tile label.
- url: Tile destination URL.
- bgColor: Tile icon background color.

### Settings
Defined in [src/App.tsx](src/App.tsx#L18).

- pageTitle: Browser tab title.
- searchEngineName: Selected search engine by name.
- tiles: User shortcuts.

### MenuPosition
Defined in [src/App.tsx](src/App.tsx#L24).

- left: Menu left pixel position.
- top: Menu top pixel position.
- minWidth: Minimum menu width in pixels.

## 3. Top-Level Constants

### engines
Defined in [src/App.tsx](src/App.tsx#L30).

- Array of available search engines.
- Used for form action, placeholder, current selection, and menu items.

### defaultTiles
Defined in [src/App.tsx](src/App.tsx#L51).

- Fallback tiles shown when no valid saved tiles exist.

### fallbackTileColors
Defined in [src/App.tsx](src/App.tsx#L59).

- Palette used by color hash fallback.

### settingsStorageKey
Defined in [src/App.tsx](src/App.tsx#L60).

- Local storage key name: homepageSettings.

## 4. Helper Callbacks (Method by Method)

### isRecord
Defined in [src/App.tsx](src/App.tsx#L62).

- Purpose: Runtime guard for object-like values.
- Parameters: value (unknown).
- Local variables: none.
- Returns: true when value is non-null object.
- Used by: normalizeTile, readSettings.

### isHttpUrl
Defined in [src/App.tsx](src/App.tsx#L66).

- Purpose: Accept only http and https URLs.
- Parameters: value (string).
- Local variables:
- candidate: URL instance created from value.
- Returns: boolean validity.
- Used by: normalizeUrl.

### isHexColor
Defined in [src/App.tsx](src/App.tsx#L75).

- Purpose: Validate strict 6-digit hex color (#RRGGBB).
- Parameters: value (string).
- Local variables: none.
- Returns: boolean regex match.
- Used by: normalizeTile, handleSaveTile.

### normalizeUrl
Defined in [src/App.tsx](src/App.tsx#L79).

- Purpose: Normalize user URL input.
- Parameters: rawValue (string).
- Local variables:
- trimmed: rawValue without surrounding whitespace.
- withProtocol: prepended https URL candidate.
- Returns: normalized URL string or null.
- Used by: normalizeTile, handleSaveTile.

### hashColorByName
Defined in [src/App.tsx](src/App.tsx#L93).

- Purpose: Deterministic fallback tile color by tile name.
- Parameters: seedText (string).
- Local variables:
- sum: character-code sum of seedText.
- Returns: one color from fallbackTileColors.
- Used by: normalizeTile.

### getTextColorForBackground
Defined in [src/App.tsx](src/App.tsx#L98).

- Purpose: Select readable foreground text color for given background.
- Parameters: hexColor (string).
- Local variables:
- color: hex without leading #.
- r, g, b: parsed RGB channels.
- luminance: perceived brightness.
- Returns: dark text (#1f2937) for light bg, otherwise light text (#f8fafc).
- Used by: tile render mapping.

### normalizeTile
Defined in [src/App.tsx](src/App.tsx#L107).

- Purpose: Validate and normalize raw tile object from storage.
- Parameters: rawTile (unknown).
- Local variables:
- name: cleaned name string.
- rawUrl: original URL string.
- normalizedUrl: validated URL from normalizeUrl.
- bgColor: valid saved color or fallback hashed color.
- Returns: Tile or null.
- Used by: readSettings.

### getDefaultSettings
Defined in [src/App.tsx](src/App.tsx#L128).

- Purpose: Single source of default app settings.
- Parameters: none.
- Local variables: none.
- Returns: Settings object with Home title, first engine, default tiles.
- Used by: readSettings.

### readSettings
Defined in [src/App.tsx](src/App.tsx#L136).

- Purpose: Load, validate, and sanitize settings from localStorage.
- Parameters: none.
- Local variables:
- defaults: output of getDefaultSettings.
- parsed: JSON data from localStorage.
- pageTitle: sanitized title or fallback.
- searchEngineName: validated engine name or fallback.
- tiles: normalized tile list or fallback.
- Returns: fully valid Settings object.
- Used by: App initialization.

## 5. App Component Variables (Variable by Variable)

Component starts at [src/App.tsx](src/App.tsx#L170).

### Initialization locals

- initialSettings in [src/App.tsx](src/App.tsx#L171): value from readSettings.
- initialIndex in [src/App.tsx](src/App.tsx#L172): index of saved engine name in engines.

### State variables

- engineIndex in [src/App.tsx](src/App.tsx#L176): selected search engine index.
- setEngineIndex in [src/App.tsx](src/App.tsx#L176): setter for engineIndex.
- tiles in [src/App.tsx](src/App.tsx#L177): current tile list.
- setTiles in [src/App.tsx](src/App.tsx#L177): setter for tiles.
- pageTitle in [src/App.tsx](src/App.tsx#L178): current browser title text.
- setPageTitle in [src/App.tsx](src/App.tsx#L178): setter for pageTitle.
- isMenuOpen in [src/App.tsx](src/App.tsx#L179): search engine menu visibility.
- setIsMenuOpen in [src/App.tsx](src/App.tsx#L179): setter for isMenuOpen.
- menuPos in [src/App.tsx](src/App.tsx#L180): engine menu viewport coordinates.
- setMenuPos in [src/App.tsx](src/App.tsx#L180): setter for menuPos.
- isPanelOpen in [src/App.tsx](src/App.tsx#L182): side panel visibility.
- setIsPanelOpen in [src/App.tsx](src/App.tsx#L182): setter for isPanelOpen.
- isModalOpen in [src/App.tsx](src/App.tsx#L183): tile modal visibility.
- setIsModalOpen in [src/App.tsx](src/App.tsx#L183): setter for isModalOpen.
- editingTileIndex in [src/App.tsx](src/App.tsx#L184): null for add mode, index for edit mode.
- setEditingTileIndex in [src/App.tsx](src/App.tsx#L184): setter for editingTileIndex.
- tileNameInput in [src/App.tsx](src/App.tsx#L185): modal tile name input.
- setTileNameInput in [src/App.tsx](src/App.tsx#L185): setter for tileNameInput.
- tileUrlInput in [src/App.tsx](src/App.tsx#L186): modal tile URL input.
- setTileUrlInput in [src/App.tsx](src/App.tsx#L186): setter for tileUrlInput.
- tileColorInput in [src/App.tsx](src/App.tsx#L187): modal tile color input.
- setTileColorInput in [src/App.tsx](src/App.tsx#L187): setter for tileColorInput.
- tileError in [src/App.tsx](src/App.tsx#L188): modal validation message.
- setTileError in [src/App.tsx](src/App.tsx#L188): setter for tileError.

### Ref variables

- dropdownRef in [src/App.tsx](src/App.tsx#L190): container for outside-click detection.
- toggleRef in [src/App.tsx](src/App.tsx#L191): search engine button for position calc.
- modalNameInputRef in [src/App.tsx](src/App.tsx#L192): name input focus target.

### Derived variables

- currentEngine in [src/App.tsx](src/App.tsx#L194): engines[engineIndex].
- modalTitle in [src/App.tsx](src/App.tsx#L353): Add shortcut or Edit shortcut.
- menuStyle in [src/App.tsx](src/App.tsx#L355): inline style for floating engine menu.

## 6. Effects and Their Locals

### Effect: persist settings + update tab title
Defined in [src/App.tsx](src/App.tsx#L196).

- Dependencies: currentEngine.name, pageTitle, tiles.
- Local variables:
- normalizedTitle: trimmed pageTitle with Home fallback.
- Side effects:
- Sets document.title.
- Writes unified settings object to localStorage.

### Effect: menu position tracking when open
Defined in [src/App.tsx](src/App.tsx#L222).

- Dependencies: isMenuOpen, positionMenu.
- Local variables:
- updatePosition: small wrapper callback calling positionMenu.
- Side effects:
- Calls positionMenu immediately.
- Adds resize and scroll listeners.
- Cleans listeners on close/unmount.

### Effect: close menu when clicking outside
Defined in [src/App.tsx](src/App.tsx#L242).

- Dependencies: none.
- Local variables:
- handleClickOutside: mousedown handler.
- Side effects:
- Closes engine menu when click target is outside dropdownRef.

### Effect: Escape key closes overlays
Defined in [src/App.tsx](src/App.tsx#L259).

- Dependencies: none.
- Local variables:
- handleEscape: keydown handler.
- Side effects:
- On Escape, closes menu, modal, panel.

### Effect: autofocus modal name input
Defined in [src/App.tsx](src/App.tsx#L274).

- Dependencies: isModalOpen.
- Local variables: none.
- Side effects:
- Uses setTimeout 0 to focus modalNameInputRef after render.

## 7. Component Callbacks (Method by Method)

### positionMenu
Defined in [src/App.tsx](src/App.tsx#L209).

- Purpose: compute floating engine-menu placement from toggle button rectangle.
- Parameters: none.
- Local variables:
- rect: button bounding client rect.
- Updates: menuPos state.

### openAddModal
Defined in [src/App.tsx](src/App.tsx#L280).

- Purpose: prepare modal for creating a new tile.
- Parameters: none.
- Local variables: none.
- Updates: editingTileIndex, inputs, error, modal open, panel closed.

### openEditModal
Defined in [src/App.tsx](src/App.tsx#L290).

- Purpose: prepare modal with existing tile values.
- Parameters: index (number).
- Local variables:
- tile: tiles[index].
- Updates: editing index, inputs, error, modal open.

### closeModal
Defined in [src/App.tsx](src/App.tsx#L304).

- Purpose: reset modal to clean closed state.
- Parameters: none.
- Local variables: none.
- Updates: modal visibility and all modal fields.

### handleSaveTile
Defined in [src/App.tsx](src/App.tsx#L313).

- Purpose: validate modal inputs and either append or edit tile.
- Parameters: event (FormEvent<HTMLFormElement>).
- Local variables:
- normalizedUrl: validated URL output.
- fallbackName: hostname-derived default name.
- finalName: explicit name or fallbackName.
- Updates:
- tileError when validation fails.
- tiles list for add/edit.
- closes modal on success.

### removeTile
Defined in [src/App.tsx](src/App.tsx#L349).

- Purpose: delete one tile by index.
- Parameters: index (number).
- Local variables: none.
- Updates: filters tiles state.

## 8. Render Structure and Inline Variables

### Main structure
From [src/App.tsx](src/App.tsx#L364).

- Main page wrapper.
- Top row with burger button.
- Search form with engine dropdown and submit icon button.
- Tiles section.
- Floating engine menu.
- Panel overlay + side panel.
- Tile modal.

### Inline callback locals in JSX

- tiles.map callback in [src/App.tsx](src/App.tsx#L434):
- tile: current tile item.
- index: current tile index.
- iconBg: tile background color.
- iconFg: computed readable text color.
- event in edit/remove button handlers in [src/App.tsx](src/App.tsx#L448) and [src/App.tsx](src/App.tsx#L460): prevents link navigation and bubbling.
- engine and index in engine-menu map at [src/App.tsx](src/App.tsx#L483): build each menu option.
- previous in state updater callbacks at [src/App.tsx](src/App.tsx#L332), [src/App.tsx](src/App.tsx#L337), [src/App.tsx](src/App.tsx#L350), [src/App.tsx](src/App.tsx#L394): safe updates from prior state.

## 9. Data Flow Summary

- Startup:
- readSettings sanitizes storage and provides initial state.
- Interaction:
- User changes title, engine, and tiles through panel, dropdown, and modal.
- Persistence:
- Effect writes one settings object under homepageSettings.
- UI synchronization:
- currentEngine and menuStyle are derived from state.
- document.title mirrors pageTitle with fallback.

## 10. Quick Mental Model

- Helpers validate and normalize user data.
- App state stores UI and settings.
- Effects synchronize state with browser and storage.
- Render maps state to controls and sections.
- Handlers mutate state in response to user input.
