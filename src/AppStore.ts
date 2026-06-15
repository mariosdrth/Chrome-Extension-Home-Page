export type Engine = {
  name: string;
  action: string;
  placeholder: string;
  icon: string;
};

import { isImageRef } from "./ImageStore";

export type Tile = {
  name: string;
  url: string;
  bgColor: string;
  iconSrc?: string;
};

export type TileSize = "small" | "medium" | "large";
export type TileOpenBehavior = "same" | "new";
export type ClockFormat = "12h" | "24h";

export type Settings = {
  pageTitle: string;
  searchEngineName: string;
  backgroundImageSrc?: string;
  tiles: Tile[];
  tileSize: TileSize;
  rowsPerPage: number;
  tileOpenBehavior: TileOpenBehavior;
  showClock: boolean;
  clockFormat: ClockFormat;
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
  { name: "YouTube", url: "https://www.youtube.com", bgColor: "#fee2e2" },
  { name: "Gmail", url: "https://mail.google.com", bgColor: "#dcfce7" },
  { name: "Yahoo Mail", url: "https://mail.yahoo.com", bgColor: "#ede9fe" },
  { name: "Drive", url: "https://drive.google.com", bgColor: "#dbeafe" },
  { name: "Wikipedia", url: "https://www.wikipedia.org", bgColor: "#fef3c7" },
  { name: "eBay", url: "https://www.ebay.com", bgColor: "#fef3c7" },
  { name: "Amazon", url: "https://www.amazon.com", bgColor: "#fed7aa" },
  { name: "X", url: "https://www.x.com", bgColor: "#e0f2fe" },
  { name: "Facebook", url: "https://www.facebook.com", bgColor: "#dbeafe" },
];

const fallbackTileColors = ["#dbeafe", "#dcfce7", "#fee2e2", "#ede9fe", "#fef3c7", "#e0f2fe"];

export const settingsStorageKey = "homepageSettings";
export const defaultTileColor = "#dbeafe";
export const defaultTileSize: TileSize = "medium";
export const defaultTileOpenBehavior: TileOpenBehavior = "same";
export const defaultRowsPerPage = 4;
export const defaultFaviconSrc = "/favicon.png";

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
  return isHttpUrl(trimmed);
};

export const isStoredImageSource = (value: string): boolean => {
  const trimmed = value.trim();
  return isImageSource(trimmed) || isImageRef(trimmed);
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

  const iconSrc = isStoredImageSource(rawIconSource) ? rawIconSource : undefined;

  return { name, url: normalizedUrl, bgColor, iconSrc };
};

export const getDefaultSettings = (): Settings => {
  return {
    pageTitle: "Home",
    searchEngineName: engines[0].name,
    backgroundImageSrc: undefined,
    tiles: [...defaultTiles],
    tileSize: defaultTileSize,
    rowsPerPage: defaultRowsPerPage,
    tileOpenBehavior: defaultTileOpenBehavior,
    showClock: true,
    clockFormat: "24h",
    faviconSrc: defaultFaviconSrc,
  };
};

export const normalizeSettings = (value: unknown): Settings | null => {
  if (!isRecord(value)) {
    return null;
  }

  const defaults = getDefaultSettings();

  const pageTitle =
    typeof value.pageTitle === "string" && value.pageTitle.trim()
      ? value.pageTitle
      : defaults.pageTitle;

  const searchEngineName =
    typeof value.searchEngineName === "string" &&
    engines.some((engine) => engine.name === value.searchEngineName)
      ? value.searchEngineName
      : defaults.searchEngineName;

  const tiles = Array.isArray(value.tiles)
    ? value.tiles.map(normalizeTile).filter((tile): tile is Tile => tile !== null)
    : defaults.tiles;

  const tileSize: TileSize =
    value.tileSize === "small" || value.tileSize === "large" || value.tileSize === "medium"
      ? value.tileSize
      : defaults.tileSize;

  const tileOpenBehavior: TileOpenBehavior =
    value.tileOpenBehavior === "new" || value.tileOpenBehavior === "same"
      ? value.tileOpenBehavior
      : defaults.tileOpenBehavior;

  const rowsPerPage =
    typeof value.rowsPerPage === "number" &&
    Number.isInteger(value.rowsPerPage) &&
    value.rowsPerPage >= 1 &&
    value.rowsPerPage <= 20
      ? value.rowsPerPage
      : defaults.rowsPerPage;

  const showClock = typeof value.showClock === "boolean" ? value.showClock : defaults.showClock;

  const clockFormat: ClockFormat =
    value.clockFormat === "12h" || value.clockFormat === "24h"
      ? value.clockFormat
      : defaults.clockFormat;

  return {
    pageTitle,
    searchEngineName,
    backgroundImageSrc:
      typeof value.backgroundImageSrc === "string" && isStoredImageSource(value.backgroundImageSrc)
        ? value.backgroundImageSrc
        : undefined,
    tiles: Array.isArray(value.tiles) ? tiles : defaults.tiles,
    tileSize,
    rowsPerPage,
    tileOpenBehavior,
    showClock,
    clockFormat,
    faviconSrc:
      typeof value.faviconSrc === "string" && isStoredImageSource(value.faviconSrc)
        ? value.faviconSrc
        : defaults.faviconSrc,
  };
};

export const readSettings = (): Settings => {
  const defaults = getDefaultSettings();

  try {
    const parsed = JSON.parse(localStorage.getItem(settingsStorageKey) ?? "null") as unknown;
    return normalizeSettings(parsed) ?? defaults;
  } catch {
    return defaults;
  }
};

export const writeSettings = (settings: Settings): void => {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
};
