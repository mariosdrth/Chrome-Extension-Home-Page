export type Engine = {
  name: string;
  action: string;
  placeholder: string;
  icon: string;
};

export type Tile = {
  name: string;
  url: string;
  bgColor: string;
  iconSrc?: string;
};

export type TileSize = "small" | "medium" | "large";
export type TileOpenBehavior = "same" | "new";

export type Settings = {
  pageTitle: string;
  searchEngineName: string;
  tiles: Tile[];
  tileSize: TileSize;
  tileOpenBehavior: TileOpenBehavior;
  faviconSrc?: string;
};

export const engines: Engine[] = [
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

const defaultTiles: Tile[] = [
  { name: "YouTube", url: "https://www.youtube.com", bgColor: "#dbeafe" },
  { name: "Gmail", url: "https://mail.google.com", bgColor: "#dcfce7" },
  { name: "Drive", url: "https://drive.google.com", bgColor: "#fee2e2" },
  { name: "GitHub", url: "https://github.com", bgColor: "#ede9fe" },
  { name: "Wikipedia", url: "https://www.wikipedia.org", bgColor: "#fef3c7" },
];

const fallbackTileColors = ["#dbeafe", "#dcfce7", "#fee2e2", "#ede9fe", "#fef3c7", "#e0f2fe"];

export const settingsStorageKey = "homepageSettings";
export const defaultTileColor = "#dbeafe";
export const defaultTileSize: TileSize = "medium";
export const defaultTileOpenBehavior: TileOpenBehavior = "same";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const candidate = new URL(value);
    return candidate.protocol === "http:" || candidate.protocol === "https:";
  } catch {
    return false;
  }
};

export const isHexColor = (value: string): boolean => {
  return /^#[0-9a-fA-F]{6}$/.test(value);
};

export const isImageSource = (value: string): boolean => {
  const trimmed = value.trim();
  return isHttpUrl(trimmed) || trimmed.startsWith("data:image/");
};

export const normalizeUrl = (rawValue: string): string | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  if (isHttpUrl(trimmed)) {
    return trimmed;
  }

  const withProtocol = `https://${trimmed}`;
  return isHttpUrl(withProtocol) ? withProtocol : null;
};

const hashColorByName = (seedText: string): string => {
  const sum = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
  return fallbackTileColors[sum % fallbackTileColors.length];
};

export const getTextColorForBackground = (hexColor: string): string => {
  const color = hexColor.replace("#", "");
  const r = Number.parseInt(color.slice(0, 2), 16);
  const g = Number.parseInt(color.slice(2, 4), 16);
  const b = Number.parseInt(color.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#1f2937" : "#f8fafc";
};

const normalizeTile = (rawTile: unknown): Tile | null => {
  if (!isRecord(rawTile)) {
    return null;
  }

  const name = typeof rawTile.name === "string" ? rawTile.name.trim() : "";
  const rawUrl = typeof rawTile.url === "string" ? rawTile.url : "";
  const normalizedUrl = normalizeUrl(rawUrl);

  if (!name || !normalizedUrl) {
    return null;
  }

  const bgColor =
    typeof rawTile.bgColor === "string" && isHexColor(rawTile.bgColor)
      ? rawTile.bgColor
      : hashColorByName(name);

  const rawIconSource =
    typeof rawTile.iconSrc === "string"
      ? rawTile.iconSrc.trim()
      : typeof rawTile.icon === "string"
        ? rawTile.icon.trim()
        : "";

  const iconSrc = isImageSource(rawIconSource) ? rawIconSource : undefined;

  return { name, url: normalizedUrl, bgColor, iconSrc };
};

export const getDefaultSettings = (): Settings => {
  return {
    pageTitle: "Home",
    searchEngineName: engines[0].name,
    tiles: [...defaultTiles],
    tileSize: defaultTileSize,
    tileOpenBehavior: defaultTileOpenBehavior,
  };
};

export const readSettings = (): Settings => {
  const defaults = getDefaultSettings();

  try {
    const parsed = JSON.parse(localStorage.getItem(settingsStorageKey) ?? "null") as unknown;
    if (!isRecord(parsed)) {
      return defaults;
    }

    const pageTitle =
      typeof parsed.pageTitle === "string" && parsed.pageTitle.trim()
        ? parsed.pageTitle
        : defaults.pageTitle;

    const searchEngineName =
      typeof parsed.searchEngineName === "string" &&
      engines.some((engine) => engine.name === parsed.searchEngineName)
        ? parsed.searchEngineName
        : defaults.searchEngineName;

    const tiles = Array.isArray(parsed.tiles)
      ? parsed.tiles.map(normalizeTile).filter((tile): tile is Tile => tile !== null)
      : defaults.tiles;

    const tileSize: TileSize =
      parsed.tileSize === "small" || parsed.tileSize === "large" || parsed.tileSize === "medium"
        ? parsed.tileSize
        : defaults.tileSize;

    const tileOpenBehavior: TileOpenBehavior =
      parsed.tileOpenBehavior === "new" || parsed.tileOpenBehavior === "same"
        ? parsed.tileOpenBehavior
        : defaults.tileOpenBehavior;

    return {
      pageTitle,
      searchEngineName,
      tiles: Array.isArray(parsed.tiles) ? tiles : defaults.tiles,
      tileSize,
      tileOpenBehavior,
    };
  } catch {
    return defaults;
  }
};

export const writeSettings = (settings: Settings): void => {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
};
