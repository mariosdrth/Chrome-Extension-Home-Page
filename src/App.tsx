import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { SubmitEvent } from "react";
import type { ChangeEvent } from "react";
import { BarsIcon, Button, CircleFullIcon, CloseIcon, RotateLeftIcon, PencilIcon, PlusIcon, SearchIcon, ThemeToggle } from "@polyutils/components";
import {
  defaultTileColor,
  defaultTileOpenBehavior,
  defaultRowsPerPage,
  defaultTileSize,
  engines,
  getDefaultSettings,
  getTextColorForBackground,
  isHexColor,
  isImageSource,
  normalizeUrl,
  normalizeSettings,
  readSettings,
  Settings,
  Tile,
  TileOpenBehavior,
  TileSize,
  writeSettings,
} from "./AppStore";

const App = () => {
  type ConfirmAction = "remove-tile" | "restore-defaults";

  const [initialSettings] = useState<Settings>(() => readSettings());
  const initialIndex = engines.findIndex(
    (engine) => engine.name === initialSettings.searchEngineName
  );

  const [engineIndex, setEngineIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [tiles, setTiles] = useState<Tile[]>(initialSettings.tiles);
  const [pageTitle, setPageTitle] = useState(initialSettings.pageTitle);
  const [tileSize, setTileSize] = useState<TileSize>(initialSettings.tileSize ?? defaultTileSize);
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    initialSettings.rowsPerPage ?? defaultRowsPerPage
  );
  const [tileOpenBehavior, setTileOpenBehavior] = useState<TileOpenBehavior>(
    initialSettings.tileOpenBehavior ?? defaultTileOpenBehavior
  );
  const [faviconSrc, setFaviconSrc] = useState(initialSettings.faviconSrc ?? "");
  const [searchQuery, setSearchQuery] = useState("");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
  const [editingTileIndex, setEditingTileIndex] = useState<number | null>(null);
  const [tileNameInput, setTileNameInput] = useState("");
  const [tileUrlInput, setTileUrlInput] = useState("");
  const [tileColorInput, setTileColorInput] = useState(defaultTileColor);
  const [tileIconInput, setTileIconInput] = useState("");
  const [tileError, setTileError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [gridColumns, setGridColumns] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);

  const modalNameInputRef = useRef<HTMLInputElement | null>(null);
  const iconFileInputRef = useRef<HTMLInputElement | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const tilesGridRef = useRef<HTMLDivElement | null>(null);

  const currentEngine = engines[engineIndex];

  const applySettings = (settings: Settings) => {
    setPageTitle(settings.pageTitle);
    setTiles(settings.tiles);
    setTileSize(settings.tileSize);
    setRowsPerPage(settings.rowsPerPage);
    setTileOpenBehavior(settings.tileOpenBehavior);
    setFaviconSrc(settings.faviconSrc ?? "");
    const nextEngineIndex = engines.findIndex((engine) => engine.name === settings.searchEngineName);
    setEngineIndex(nextEngineIndex >= 0 ? nextEngineIndex : 0);
  };

  useEffect(() => {
    const normalizedTitle = pageTitle.trim() || "Home";
    document.title = normalizedTitle;
    writeSettings(buildCurrentSettings());
  }, [currentEngine.name, faviconSrc, pageTitle, rowsPerPage, tileOpenBehavior, tileSize, tiles]);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconSrc || "";
  }, [faviconSrc]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setIsPanelOpen(false);
        setIsDeleteConfirmOpen(false);
        setDeleteTargetIndex(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => modalNameInputRef.current?.focus(), 0);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const calculateColumns = () => {
      if (!tilesGridRef.current) {
        return;
      }

      const gridWidth = tilesGridRef.current.clientWidth;
      const styles = window.getComputedStyle(tilesGridRef.current);
      const columnGap = Number.parseFloat(styles.columnGap || "0") || 0;
      const isMobile = window.innerWidth <= 640;
      const minTileWidth = isMobile
        ? tileSize === "small"
          ? 96
          : tileSize === "large"
            ? 126
            : 110
        : 132;

      const estimatedColumns = Math.floor((gridWidth + columnGap) / (minTileWidth + columnGap));
      setGridColumns(Math.max(1, estimatedColumns));
    };

    calculateColumns();

    const observer = new ResizeObserver(calculateColumns);
    if (tilesGridRef.current) {
      observer.observe(tilesGridRef.current);
    }
    window.addEventListener("resize", calculateColumns);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calculateColumns);
    };
  }, [tileSize]);

  const openAddModal = () => {
    resetModalFields();
    setIsModalOpen(true);
    setIsPanelOpen(false);
  };

  const openPanel = () => {
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const resetModalFields = () => {
    setEditingTileIndex(null);
    setTileNameInput("");
    setTileUrlInput("");
    setTileColorInput(defaultTileColor);
    setTileIconInput("");
    setTileError("");
  };

  const openEditModal = (index: number) => {
    const tile = tiles[index];
    if (!tile) {
      return;
    }

    setEditingTileIndex(index);
    setTileNameInput(tile.name);
    setTileUrlInput(tile.url);
    setTileColorInput(tile.bgColor);
    setTileIconInput(tile.iconSrc ?? "");
    setTileError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModalFields();
  };

  const handleSaveTile = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTileError("");

    const normalizedUrl = normalizeUrl(tileUrlInput);
    if (!normalizedUrl) {
      setTileError("Please enter a valid URL.");
      return;
    }

    if (!isHexColor(tileColorInput)) {
      setTileError("Please select a valid color.");
      return;
    }

    const fallbackName = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    const finalName = tileNameInput.trim() || fallbackName;
    const finalIconSrc = tileIconInput.trim();

    if (finalIconSrc && !isImageSource(finalIconSrc)) {
      setTileError("Icon must be an image URL or a selected local image.");
      return;
    }

    if (editingTileIndex === null) {
      setTiles((previous) => [
        ...previous,
        {
          name: finalName,
          url: normalizedUrl,
          bgColor: tileColorInput,
          ...(finalIconSrc ? { iconSrc: finalIconSrc } : {}),
        },
      ]);
    } else {
      setTiles((previous) =>
        previous.map((tile, index) =>
          index === editingTileIndex
            ? {
                name: finalName,
                url: normalizedUrl,
                bgColor: tileColorInput,
                ...(finalIconSrc ? { iconSrc: finalIconSrc } : {}),
              }
            : tile
        )
      );
    }

    closeModal();
  };

  const removeTile = (index: number) => {
    setTiles((previous) => previous.filter((_, tileIndex) => tileIndex !== index));
  };

  const reorderTiles = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    setTiles((previous) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= previous.length ||
        toIndex >= previous.length
      ) {
        return previous;
      }

      const next = [...previous];
      const [movedTile] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedTile);
      return next;
    });
  };

  const handleTileDragStart = (index: number, event: React.DragEvent<HTMLElement>) => {
    setDragSourceIndex(index);
    setDragTargetIndex(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleTileDragOver = (index: number, event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (dragSourceIndex === null || dragSourceIndex === index) {
      return;
    }

    reorderTiles(dragSourceIndex, index);
    setDragSourceIndex(index);
    setDragTargetIndex(index);
  };

  const handleTileDrop = (_index: number, event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setDragSourceIndex(null);
    setDragTargetIndex(null);
  };

  const handleTileDragEnd = () => {
    setDragSourceIndex(null);
    setDragTargetIndex(null);
  };

  const openConfirmDialog = (action: ConfirmAction, targetIndex: number | null = null) => {
    setConfirmAction(action);
    setDeleteTargetIndex(targetIndex);
    setIsDeleteConfirmOpen(true);
  };

  const askRemoveTile = (index: number) => {
    openConfirmDialog("remove-tile", index);
  };

  const askRestoreDefaults = () => {
    openConfirmDialog("restore-defaults");
  };

  const cancelRemoveTile = () => {
    setConfirmAction(null);
    setIsDeleteConfirmOpen(false);
    setDeleteTargetIndex(null);
  };

  const confirmRemoveTile = () => {
    if (confirmAction === "remove-tile" && deleteTargetIndex !== null) {
      removeTile(deleteTargetIndex);
    }
    if (confirmAction === "restore-defaults") {
      const defaults = getDefaultSettings();
      applySettings(defaults);
      setSettingsError("");
    }
    cancelRemoveTile();
  };

  const suggestIconFromUrl = (rawUrl: string) => {
    if (tileIconInput) {
      return;
    }
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) {
      return;
    }
    try {
      const { hostname } = new URL(normalized);
      setTileIconInput(`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`);
    } catch {
      // ignore invalid URL
    }
  };

  const openIconFilePicker = () => {
    iconFileInputRef.current?.click();
  };

  const handleIconFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setTileError("Please choose an image file for the icon.");
      event.target.value = "";
      return;
    }

    // Clear any typed URL immediately when switching to a local file icon.
    setTileIconInput("");

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result.startsWith("data:image/")) {
        setTileError("Failed to read selected icon file.");
        return;
      }

      setTileIconInput(result);
      setTileError("");
    };
    reader.onerror = () => {
      setTileError("Failed to read selected icon file.");
    };

    reader.readAsDataURL(selected);
    event.target.value = "";
  };

  const modalTitle = editingTileIndex === null ? "Add shortcut" : "Edit shortcut";

  const tilesPerPage = Math.max(1, rowsPerPage * gridColumns);
  const totalPages = Math.max(1, Math.ceil(tiles.length / tilesPerPage));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages - 1));
  }, [totalPages]);

  const pageStartIndex = currentPage * tilesPerPage;
  const visibleTiles = tiles.slice(pageStartIndex, pageStartIndex + tilesPerPage);

  const runSearch = () => {
    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    const url = new URL(currentEngine.action);
    url.searchParams.set("q", query);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const engineMenuItems: ReactNode[] = engines.map((engine, index) => (
    <Button
      key={engine.name}
      appearance="subtle"
      shape="square"
      pressEffect={false}
      styles={{ root: { justifyContent: "flex-start", width: "100%" } }}
      onClick={() => setEngineIndex(index)}
    >
      <span className="engine-option-icon">{engine.icon}</span>
      <span className="engine-option-label">{engine.name}</span>
    </Button>
  ));

  const deleteTargetName =
    deleteTargetIndex !== null && tiles[deleteTargetIndex]
      ? tiles[deleteTargetIndex].name
      : "this tile";

  const confirmTitle = confirmAction === "restore-defaults" ? "Restore defaults" : "Remove tile";
  const confirmMessage =
    confirmAction === "restore-defaults"
      ? "Are you sure you want to restore defaults? This will reset all your settings and shortcuts."
      : `Are you sure you want to remove ${deleteTargetName}?`;
  const confirmButtonLabel = confirmAction === "restore-defaults" ? "Restore" : "Remove";
  const isLocalIconSelected = tileIconInput.startsWith("data:image/");

  const buildCurrentSettings = (): Settings => {
    return {
      pageTitle: pageTitle.trim() || "Home",
      searchEngineName: currentEngine.name,
      tiles,
      tileSize,
      rowsPerPage,
      tileOpenBehavior,
      faviconSrc: faviconSrc || undefined,
    };
  };

  const exportSettings = () => {
    const settings = buildCurrentSettings();
    const blob = new Blob([`${JSON.stringify(settings, null, 2)}\n`], { type: "application/json" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "homepage-settings.json";
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const openImportSettingsPicker = () => {
    importFileInputRef.current?.click();
  };

  const handleImportSettingsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const contents = typeof reader.result === "string" ? reader.result : "";
      try {
        const importedSettings = normalizeSettings(JSON.parse(contents) as unknown);
        if (!importedSettings) {
          setSettingsError("The selected file does not contain valid settings.");
          return;
        }

        applySettings(importedSettings);
        setSettingsError("");
        setIsPanelOpen(false);
      } catch {
        setSettingsError("The selected file is not valid JSON.");
      }
    };
    reader.onerror = () => {
      setSettingsError("Unable to read the selected file.");
    };

    reader.readAsText(selected);
    event.target.value = "";
  };

  return (
    <>
      <Button
        appearance="transparent"
        icon={<BarsIcon />}
        iconOnly
        aria-label="Open side panel"
        styles={{ root: { fontSize: "25px", position: "fixed", top: "0.6rem", left: "0.2rem" } }}
        onClick={openPanel}
      />

      <ThemeToggle
        appearance="transparent"
        className="theme-toggle-fixed"
      />

      <main className="page" role="main">
        <div className="search-shell">
          <Button
            appearance="transparent"
            menuTrigger="click"
            pressEffect={false}
            menuItems={engineMenuItems}
            aria-label={`Search engine: ${currentEngine.name}`}
          >
            <span className="engine-icon" aria-hidden="true">
              {currentEngine.icon}
            </span>
          </Button>

          <input
            type="text"
            placeholder={currentEngine.placeholder}
            autoComplete="off"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                runSearch();
              }
            }}
            aria-label={currentEngine.placeholder}
            required
          />

          {searchQuery && (
            <Button
              appearance="transparent"
              icon={<CloseIcon aria-hidden="true" />}
              iconOnly
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
            />
          )}

          <Button
            id="search-submit"
            appearance="transparent"
            icon={<SearchIcon aria-hidden="true" />}
            iconOnly
            aria-label="Search"
            onClick={runSearch}
          />
        </div>

        <section className="tiles-grid-section" aria-label="Website shortcuts">
          <div ref={tilesGridRef} className={`tiles-grid tiles-size-${tileSize}`}>
            {(
              visibleTiles.map((tile, pageIndex) => {
                const index = pageStartIndex + pageIndex;
                const iconBg = tile.bgColor;
                const iconFg = getTextColorForBackground(iconBg);
                const iconSrc = tile.iconSrc?.trim();

                return (
                  <a
                    key={`${tile.name}-${index}`}
                    className={`tile${dragSourceIndex === index ? " tile-dragging" : ""}${dragTargetIndex === index ? " tile-drop-target" : ""}`}
                    href={tile.url}
                    title={tile.name}
                    target={tileOpenBehavior === "new" ? "_blank" : "_self"}
                    rel={tileOpenBehavior === "new" ? "noopener noreferrer" : undefined}
                    draggable
                    onDragStart={(event) => handleTileDragStart(index, event)}
                    onDragOver={(event) => handleTileDragOver(index, event)}
                    onDrop={(event) => handleTileDrop(index, event)}
                    onDragEnd={handleTileDragEnd}
                  >
                    <span
                      className={`tile-icon${iconSrc ? " tile-icon-image" : ""}`}
                      style={
                        iconSrc
                          ? undefined
                          : { background: iconBg, color: iconFg }
                      }
                    >
                      {iconSrc ? (
                        <img src={iconSrc} alt="" loading="lazy" draggable={false} />
                      ) : (
                        tile.name.trim().slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="tile-label">{tile.name}</span>
                    <Button
                      appearance="transparent"
                      size="small"
                      icon={<PencilIcon />}
                      iconOnly
                      className="tile-edit"
                      aria-label={`Edit ${tile.name}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openEditModal(index);
                      }}
                    />
                    <Button
                      appearance="transparent"
                      size="small"
                      icon={<CloseIcon />}
                      iconOnly
                      className="tile-remove"
                      aria-label={`Remove ${tile.name}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        askRemoveTile(index);
                      }}
                    />
                  </a>
                );
              })
            )}
          </div>
        </section>

        <div className="add-tile-strip">
          <Button
            title="Add Tile"
            appearance="transparent"
            icon={<PlusIcon />}
            iconOnly
            styles={{root: {fontSize: "50px"}}}
            pressEffect={false}
            aria-label="Add new tile"
            className="add-tile-btn"
            onClick={openAddModal}
          />
        </div>
      </main>

      {totalPages > 1 ? (
        <nav className="page-dots" aria-label="Shortcut pages">
          {Array.from({ length: totalPages }, (_, pageIndex) => (
            <Button
              key={`page-${pageIndex}`}
              type="button"
              appearance="transparent"
              shape="circular"
              size="small"
              icon={<CircleFullIcon />}
              iconOnly
              pressEffect={false}
              className="page-dot-btn"
              aria-label={`Go to page ${pageIndex + 1}`}
              aria-current={pageIndex === currentPage ? "page" : undefined}
              styles={{
                root: {
                  opacity: pageIndex === currentPage ? 1 : 0.5,
                },
              }}
              onClick={() => setCurrentPage(pageIndex)}
            />
          ))}
        </nav>
      ) : null}

      <div className={`panel-overlay${isPanelOpen ? " open" : ""}`} onClick={closePanel}></div>
      <aside className={`side-panel${isPanelOpen ? " open" : ""}`} aria-label="Menu panel">
        <Button
            appearance="transparent"
            icon={<CloseIcon />}
            iconOnly
            styles={{ root: { fontSize: "20px", padding: "0", position: "fixed", top: "0.2rem", right: "0.2rem" } }}
            onClick={closePanel}
          />
        <div className="side-panel-header">
          <h2>Settings</h2>
        </div>
        <div className="panel-list-wrap">
          <div className="settings-group">
            <label className="settings-label" htmlFor="page-title-input">
              Page title
            </label>
            <input
              id="page-title-input"
              className="settings-input"
              type="text"
              maxLength={60}
              value={pageTitle}
              onChange={(event) => setPageTitle(event.target.value)}
              placeholder="Home"
            />
          </div>
          <div className="settings-group">
            <label className="settings-label" htmlFor="favicon-input">
              Tab icon URL
            </label>
            <input
              id="favicon-input"
              className="settings-input"
              type="text"
              value={faviconSrc}
              onChange={(event) => setFaviconSrc(event.target.value)}
              placeholder="https://example.com/icon.png"
            />
          </div>
          <div className="settings-group">
            <label className="settings-label" htmlFor="tile-size-select">
              Tile size
            </label>
            <select
              id="tile-size-select"
              className="settings-input"
              value={tileSize}
              onChange={(event) => setTileSize(event.target.value as TileSize)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="settings-group">
            <label className="settings-label" htmlFor="tile-open-behavior-select">
              Open tile in
            </label>
            <select
              id="tile-open-behavior-select"
              className="settings-input"
              value={tileOpenBehavior}
              onChange={(event) => setTileOpenBehavior(event.target.value as TileOpenBehavior)}
            >
              <option value="same">Same tab</option>
              <option value="new">New tab</option>
            </select>
          </div>

          <div className="settings-group">
            <label className="settings-label" htmlFor="rows-per-page-input">
              Rows per page
            </label>
            <input
              id="rows-per-page-input"
              className="settings-input"
              type="number"
              min={1}
              max={20}
              value={rowsPerPage}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                if (Number.isNaN(parsed)) {
                  setRowsPerPage(defaultRowsPerPage);
                  return;
                }
                setRowsPerPage(Math.min(20, Math.max(1, parsed)));
              }}
            />
          </div>

          <div className="settings-group">
            <Button
              appearance="default"
              icon={<RotateLeftIcon />}
              styles={{ root: { marginTop: "1rem", width: "85%", justifySelf: "center" } }}
              onClick={askRestoreDefaults}
            >
              Restore defaults
            </Button>
            <Button
              appearance="default"
              styles={{ root: { width: "85%", justifySelf: "center" } }}
              onClick={exportSettings}
            >
              Export settings
            </Button>
            <Button
              appearance="default"
              styles={{ root: { width: "85%", justifySelf: "center" } }}
              onClick={openImportSettingsPicker}
            >
              Import settings
            </Button>
            <input
              ref={importFileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              onChange={handleImportSettingsChange}
            />
            {settingsError ? (
              <p className="form-error" role="alert">
                {settingsError}
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <div id="tile-modal" className={`modal${isModalOpen ? " open" : ""}`} aria-hidden={isModalOpen ? "false" : "true"}>
        <div className="modal-backdrop" onClick={closeModal}></div>
        <section
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tile-modal-title"
        >
          <h2 id="tile-modal-title">{modalTitle}</h2>
          <form className="tile-form" onSubmit={handleSaveTile}>
            <label htmlFor="tile-name">Tile Name</label>
            <input
              ref={modalNameInputRef}
              id="tile-name"
              type="text"
              maxLength={40}
              value={tileNameInput}
              onChange={(event) => setTileNameInput(event.target.value)}
              required
            />

            <label htmlFor="tile-url">URL</label>
            <input
              id="tile-url"
              name="url"
              type="text"
              placeholder="https://example.com"
              autoComplete="off"
              value={tileUrlInput}
              onChange={(event) => setTileUrlInput(event.target.value)}
              onBlur={(event) => suggestIconFromUrl(event.target.value)}
              required
            />

            <label htmlFor="tile-color">Tile Color</label>
            <input
              id="tile-color"
              name="color"
              type="color"
              value={tileColorInput}
              onChange={(event) => setTileColorInput(event.target.value)}
              className="color-picker"
            />

            <label htmlFor="tile-icon">Icon URL</label>
            <input
              id="tile-icon"
              name="icon"
              type="text"
              value={isLocalIconSelected ? "" : tileIconInput}
              onChange={(event) => setTileIconInput(event.target.value)}
              disabled={isLocalIconSelected}
              placeholder="https://example.com/icon.png"
            />

            <div className="icon-picker-row">
              <Button appearance="default" shape="square" onClick={openIconFilePicker}>
                Choose icon from device
              </Button>
              <Button appearance="outline" shape="square" disabled={!isLocalIconSelected} onClick={() => setTileIconInput("")}>
                Clear icon
              </Button>
              <input
                ref={iconFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={handleIconFileChange}
              />
            </div>
            {isLocalIconSelected ? (
              <p className="icon-hint">Using local image file icon.</p>
            ) : null}

            <p className="form-error" role="alert">
              {tileError}
            </p>

            <div className="modal-actions">
              <Button appearance="subtle" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" appearance="primary">
                Save
              </Button>
            </div>
          </form>
        </section>
      </div>

      <div
        className={`modal${isDeleteConfirmOpen ? " open" : ""}`}
        aria-hidden={isDeleteConfirmOpen ? "false" : "true"}
      >
        <div className="modal-backdrop" onClick={cancelRemoveTile}></div>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title">
          <h2 id="confirm-action-title">{confirmTitle}</h2>
          <p className="confirm-message">{confirmMessage}</p>
          <div className="modal-actions">
            <Button appearance="subtle" onClick={cancelRemoveTile}>
              Cancel
            </Button>
            <Button appearance="danger" onClick={confirmRemoveTile}>
              {confirmButtonLabel}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default App;
