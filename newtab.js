(() => {
  const engines = [
    {
      name: "Google",
      action: "https://www.google.com/search",
      placeholder: "Search with Google",
      icon: "G",
    },
    {
      name: "DuckDuckGo",
      action: "https://duckduckgo.com/",
      placeholder: "Search with DuckDuckGo",
      icon: "DD",
    },
    {
      name: "Bing",
      action: "https://www.bing.com/search",
      placeholder: "Search with Bing",
      icon: "B",
    },
  ];

  const form = document.getElementById("search-form");
  const input = document.getElementById("search-query");
  const label = document.getElementById("search-label");
  const toggle = document.getElementById("engine-toggle");
  const engineIcon = document.getElementById("engine-icon");
  const engineDropdown = document.getElementById("engine-dropdown");
  const engineMenu = document.getElementById("engine-menu");
  const addTileButton = document.getElementById("add-tile");
  const tilesGrid = document.getElementById("tiles-grid");
  const tileModal = document.getElementById("tile-modal");
  const tileForm = document.getElementById("tile-form");
  const tileNameInput = document.getElementById("tile-name");
  const tileUrlInput = document.getElementById("tile-url");
  const tileModalTitle = document.getElementById("tile-modal-title");
  const tileFormError = document.getElementById("tile-form-error");
  const tileCancelButton = document.getElementById("tile-cancel");

  const storageKey = "homepageTiles";
  const defaultTiles = [
    { name: "YouTube", url: "https://www.youtube.com" },
    { name: "Gmail", url: "https://mail.google.com" },
    { name: "Drive", url: "https://drive.google.com" },
    { name: "GitHub", url: "https://github.com" },
    { name: "Wikipedia", url: "https://www.wikipedia.org" },
  ];

  if (
    !form ||
    !input ||
    !label ||
    !toggle ||
    !engineIcon ||
    !engineDropdown ||
    !engineMenu ||
    !addTileButton ||
    !tilesGrid ||
    !tileModal ||
    !tileForm ||
    !tileNameInput ||
    !tileUrlInput ||
    !tileModalTitle ||
    !tileFormError ||
    !tileCancelButton
  ) {
    return;
  }

  const engineStorageKey = "homepageSearchEngine";
  const storedEngineName = localStorage.getItem(engineStorageKey);
  let engineIndex = engines.findIndex((engine) => engine.name === storedEngineName);
  if (engineIndex < 0) {
    engineIndex = 0;
  }
  let editingTileIndex = null;

  function isHttpUrl(value) {
    try {
      const candidate = new URL(value);
      return candidate.protocol === "http:" || candidate.protocol === "https:";
    } catch {
      return false;
    }
  }

  function normalizeUrl(rawValue) {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return null;
    }

    if (isHttpUrl(trimmed)) {
      return trimmed;
    }

    const withProtocol = `https://${trimmed}`;
    return isHttpUrl(withProtocol) ? withProtocol : null;
  }

  function readTiles() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (!Array.isArray(parsed)) {
        return [...defaultTiles];
      }

      return parsed.filter((tile) => {
        return (
          tile &&
          typeof tile.name === "string" &&
          tile.name.trim() &&
          typeof tile.url === "string" &&
          normalizeUrl(tile.url)
        );
      });
    } catch {
      return [...defaultTiles];
    }
  }

  function saveTiles(tiles) {
    localStorage.setItem(storageKey, JSON.stringify(tiles));
  }

  function tileColors(seedText) {
    const palette = [
      ["#dbeafe", "#1e3a8a"],
      ["#dcfce7", "#166534"],
      ["#fee2e2", "#9f1239"],
      ["#ede9fe", "#5b21b6"],
      ["#fef3c7", "#92400e"],
      ["#e0f2fe", "#0c4a6e"],
    ];
    const sum = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
    return palette[sum % palette.length];
  }

  function createTileElement(tile, index, onEdit, onRemove) {
    const anchor = document.createElement("a");
    anchor.className = "tile";
    anchor.href = tile.url;
    anchor.title = tile.name;

    const icon = document.createElement("span");
    icon.className = "tile-icon";
    icon.textContent = tile.name.trim().slice(0, 1).toUpperCase();
    const [bgColor, textColor] = tileColors(tile.name);
    icon.style.background = bgColor;
    icon.style.color = textColor;

    const labelSpan = document.createElement("span");
    labelSpan.className = "tile-label";
    labelSpan.textContent = tile.name;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "tile-remove";
    removeButton.setAttribute("aria-label", `Remove ${tile.name}`);
    removeButton.textContent = "x";
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onRemove(index);
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "tile-edit";
    editButton.setAttribute("aria-label", `Edit ${tile.name}`);
    editButton.textContent = "E";
    editButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onEdit(index);
    });

    anchor.append(icon, labelSpan, editButton, removeButton);
    return anchor;
  }

  let tiles = readTiles();

  function renderTiles() {
    tilesGrid.innerHTML = "";

    if (tiles.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No shortcuts yet. Click Add link to create one.";
      tilesGrid.append(empty);
      return;
    }

    tiles.forEach((tile, index) => {
      const tileElement = createTileElement(
        tile,
        index,
        (tileIndex) => {
          openTileModal(tileIndex);
        },
        (tileIndex) => {
          tiles.splice(tileIndex, 1);
          saveTiles(tiles);
          renderTiles();
        }
      );
      tilesGrid.append(tileElement);
    });
  }

  function resetModalError() {
    tileFormError.textContent = "";
  }

  function closeTileModal() {
    tileModal.classList.remove("open");
    tileModal.setAttribute("aria-hidden", "true");
    resetModalError();
    tileForm.reset();
    editingTileIndex = null;
  }

  function openTileModal(indexToEdit = null) {
    editingTileIndex = indexToEdit;
    resetModalError();

    if (indexToEdit === null) {
      tileModalTitle.textContent = "Add shortcut";
      tileNameInput.value = "";
      tileUrlInput.value = "";
    } else {
      const existingTile = tiles[indexToEdit];
      tileModalTitle.textContent = "Edit shortcut";
      tileNameInput.value = existingTile.name;
      tileUrlInput.value = existingTile.url;
    }

    tileModal.classList.add("open");
    tileModal.setAttribute("aria-hidden", "false");
    tileNameInput.focus();
  }

  addTileButton.addEventListener("click", () => {
    openTileModal();
  });

  tileCancelButton.addEventListener("click", closeTileModal);

  tileModal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.closeModal === "true") {
      closeTileModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tileModal.classList.contains("open")) {
      closeTileModal();
    }
  });

  tileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    resetModalError();

    const normalizedUrl = normalizeUrl(tileUrlInput.value);
    if (!normalizedUrl) {
      tileFormError.textContent = "Please enter a valid URL.";
      tileUrlInput.focus();
      return;
    }

    const fallbackName = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    const finalName = tileNameInput.value.trim() || fallbackName;

    if (editingTileIndex === null) {
      tiles.push({ name: finalName, url: normalizedUrl });
    } else {
      tiles[editingTileIndex] = { name: finalName, url: normalizedUrl };
    }

    saveTiles(tiles);
    renderTiles();
    closeTileModal();
  });

  function applyEngine(engine) {
    form.action = engine.action;
    input.placeholder = engine.placeholder;
    label.textContent = `Search ${engine.name}`;
    engineIcon.textContent = engine.icon;
    toggle.setAttribute("aria-label", `Search engine: ${engine.name}`);
    toggle.title = `Search engine: ${engine.name}`;
    localStorage.setItem(engineStorageKey, engine.name);
  }

  function closeEngineMenu() {
    engineMenu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function positionEngineMenu() {
    const toggleRect = toggle.getBoundingClientRect();
    engineMenu.style.left = `${toggleRect.left}px`;
    engineMenu.style.top = `${toggleRect.bottom + 8}px`;
    engineMenu.style.minWidth = `${Math.max(toggleRect.width, 192)}px`;
  }

  function openEngineMenu() {
    positionEngineMenu();
    engineMenu.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }

  function renderEngineMenu() {
    engineMenu.innerHTML = "";

    engines.forEach((engine, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = `engine-option${index === engineIndex ? " active" : ""}`;
      option.setAttribute("role", "menuitemradio");
      option.setAttribute("aria-checked", String(index === engineIndex));

      const optionIcon = document.createElement("span");
      optionIcon.className = "engine-option-icon";
      optionIcon.textContent = engine.icon;

      const optionLabel = document.createElement("span");
      optionLabel.className = "engine-option-label";
      optionLabel.textContent = engine.name;

      option.append(optionIcon, optionLabel);

      option.addEventListener("click", () => {
        engineIndex = index;
        applyEngine(engines[engineIndex]);
        renderEngineMenu();
        closeEngineMenu();
        input.focus();
      });

      engineMenu.append(option);
    });
  }

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (engineMenu.classList.contains("open")) {
      closeEngineMenu();
    } else {
      openEngineMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!engineDropdown.contains(event.target)) {
      closeEngineMenu();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeEngineMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (engineMenu.classList.contains("open")) {
      positionEngineMenu();
    }
  });

  window.addEventListener("scroll", () => {
    if (engineMenu.classList.contains("open")) {
      positionEngineMenu();
    }
  }, true);

  applyEngine(engines[engineIndex]);
  renderEngineMenu();
  renderTiles();
})();
