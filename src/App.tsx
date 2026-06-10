import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { FormEvent } from "react";
import type { ChangeEvent } from "react";
import { BarsIcon, Button, CloseIcon, PencilIcon, SearchIcon } from "@polyutils/components";
import {
  defaultTileColor,
  defaultTileOpenBehavior,
  defaultTileSize,
  engines,
  getDefaultSettings,
  getTextColorForBackground,
  isHexColor,
  isImageSource,
  normalizeUrl,
  readSettings,
  Settings,
  Tile,
  TileOpenBehavior,
  TileSize,
  writeSettings,
} from "./AppStore";

const App = () => {
  const [initialSettings] = useState<Settings>(() => readSettings());
  const initialIndex = engines.findIndex(
    (engine) => engine.name === initialSettings.searchEngineName
  );

  const [engineIndex, setEngineIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [tiles, setTiles] = useState<Tile[]>(initialSettings.tiles);
  const [pageTitle, setPageTitle] = useState(initialSettings.pageTitle);
  const [tileSize, setTileSize] = useState<TileSize>(initialSettings.tileSize ?? defaultTileSize);
  const [tileOpenBehavior, setTileOpenBehavior] = useState<TileOpenBehavior>(
    initialSettings.tileOpenBehavior ?? defaultTileOpenBehavior
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
  const [editingTileIndex, setEditingTileIndex] = useState<number | null>(null);
  const [tileNameInput, setTileNameInput] = useState("");
  const [tileUrlInput, setTileUrlInput] = useState("");
  const [tileColorInput, setTileColorInput] = useState(defaultTileColor);
  const [tileIconInput, setTileIconInput] = useState("");
  const [tileError, setTileError] = useState("");

  const modalNameInputRef = useRef<HTMLInputElement | null>(null);
  const iconFileInputRef = useRef<HTMLInputElement | null>(null);

  const currentEngine = engines[engineIndex];

  useEffect(() => {
    const normalizedTitle = pageTitle.trim() || "Home";
    document.title = normalizedTitle;
    writeSettings({
      pageTitle: normalizedTitle,
      searchEngineName: currentEngine.name,
      tiles,
      tileSize,
      tileOpenBehavior,
    });
  }, [currentEngine.name, pageTitle, tileOpenBehavior, tileSize, tiles]);

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

  const handleSaveTile = (event: FormEvent<HTMLFormElement>) => {
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

  const askRemoveTile = (index: number) => {
    setDeleteTargetIndex(index);
    setIsDeleteConfirmOpen(true);
  };

  const cancelRemoveTile = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteTargetIndex(null);
  };

  const confirmRemoveTile = () => {
    if (deleteTargetIndex !== null) {
      removeTile(deleteTargetIndex);
    }
    cancelRemoveTile();
  };

  const restoreDefaults = () => {
    const defaults = getDefaultSettings();
    setPageTitle(defaults.pageTitle);
    setTiles(defaults.tiles);
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

  return (
    <>
      <Button
        appearance="transparent"
        icon={<BarsIcon />}
        iconOnly
        aria-label="Open side panel"
        styles={{ root: { position: "fixed", top: "1rem", left: "1rem" } }}
        onClick={openPanel}
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
            type="search"
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

          <Button
            id="search-submit"
            type="button"
            appearance="transparent"
            icon={<SearchIcon className="search-submit-icon" aria-hidden="true" />}
            iconOnly
            hideChevron
            aria-label="Search"
            className="search-submit-btn"
            onClick={runSearch}
          />
        </div>

        <section aria-label="Website shortcuts">
          <div id="tiles-grid" className={`tiles-grid tiles-size-${tileSize}`}>
            {(
              tiles.map((tile, index) => {
                const iconBg = tile.bgColor;
                const iconFg = getTextColorForBackground(iconBg);
                const iconSrc = tile.iconSrc?.trim();

                return (
                  <a
                    key={`${tile.name}-${index}`}
                    className="tile"
                    href={tile.url}
                    title={tile.name}
                    target={tileOpenBehavior === "new" ? "_blank" : "_self"}
                    rel={tileOpenBehavior === "new" ? "noopener noreferrer" : undefined}
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
                        <img src={iconSrc} alt="" loading="lazy" />
                      ) : (
                        tile.name.trim().slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="tile-label">{tile.name}</span>
                    <Button
                      type="button"
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
                      type="button"
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
      </main>

      <div className={`panel-overlay${isPanelOpen ? " open" : ""}`} onClick={closePanel}></div>
      <aside className={`side-panel${isPanelOpen ? " open" : ""}`} aria-label="Menu panel">
        <div className="side-panel-header">
          <h2>Menu</h2>
          <Button
            appearance="transparent"
            hideChevron
            onClick={closePanel}
          >
            Close
          </Button>
        </div>

        <Button
          appearance="primary"
          onClick={openAddModal}
          className="panel-add-tile-btn"
        >
          Add new tile
        </Button>

        <div className="panel-list-wrap">
          <h3>Settings</h3>
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
          <Button
            appearance="outline"
            className="restore-defaults-btn"
            onClick={restoreDefaults}
          >
            Restore defaults
          </Button>
          <ul className="panel-list">
            <li>
              Search engine: <strong>{currentEngine.name}</strong>
            </li>
            <li>
              Tiles: <strong>{tiles.length}</strong>
            </li>
          </ul>

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

          <h3>Background</h3>
          <ul className="panel-list">
            <li>
              Page color: <strong>#ffffff</strong>
            </li>
            <li>
              Tile color mode: <strong>Custom per tile</strong>
            </li>
          </ul>
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
            <label htmlFor="tile-name">Name</label>
            <input
              ref={modalNameInputRef}
              id="tile-name"
              name="name"
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
              required
            />

            <label htmlFor="tile-color">Tile color</label>
            <input
              id="tile-color"
              name="color"
              type="color"
              value={tileColorInput}
              onChange={(event) => setTileColorInput(event.target.value)}
              className="color-picker"
            />

            <label htmlFor="tile-icon">Icon URL (optional)</label>
            <input
              id="tile-icon"
              name="icon"
              type="text"
              value={tileIconInput.startsWith("data:image/") ? "" : tileIconInput}
              onChange={(event) => setTileIconInput(event.target.value)}
              placeholder="https://example.com/icon.png"
            />

            <div className="icon-picker-row">
              <Button type="button" appearance="outline" onClick={openIconFilePicker}>
                Choose icon from device
              </Button>
              <Button type="button" appearance="subtle" onClick={() => setTileIconInput("")}>
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
            {tileIconInput.startsWith("data:image/") ? (
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
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-remove-title">
          <h2 id="confirm-remove-title">Remove tile</h2>
          <p className="confirm-message">Are you sure you want to remove {deleteTargetName}?</p>
          <div className="modal-actions">
            <Button type="button" appearance="subtle" onClick={cancelRemoveTile}>
              Cancel
            </Button>
            <Button type="button" appearance="danger" onClick={confirmRemoveTile}>
              Remove
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default App;
