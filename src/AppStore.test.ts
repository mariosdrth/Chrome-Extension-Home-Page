import { describe, expect, it } from "vitest";

import {
  defaultFaviconSrc,
  getDefaultSettings,
  getTextColorForBackground,
  normalizeSettings,
  normalizeUrl,
} from "./AppStore";

describe("AppStore", () => {
  it("returns expected default settings", () => {
    const defaults = getDefaultSettings();

    expect(defaults.pageTitle).toBe("Home");
    expect(defaults.rowsPerPage).toBe(4);
    expect(defaults.showClock).toBe(true);
    expect(defaults.clockFormat).toBe("24h");
    expect(defaults.faviconSrc).toBe(defaultFaviconSrc);
    expect(defaults.tiles.length).toBeGreaterThan(0);
  });

  it("normalizes URLs and adds https when missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
    expect(normalizeUrl(" https://example.com/path ")).toBe("https://example.com/path");
    expect(normalizeUrl("not a url")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
  });

  it("normalizes invalid settings to defaults", () => {
    const settings = normalizeSettings({
      pageTitle: "",
      searchEngineName: "Unknown",
      rowsPerPage: 999,
      tileSize: "huge",
      tileOpenBehavior: "popup",
      showClock: "yes",
      clockFormat: "military",
      faviconSrc: "not-an-image",
      tiles: [{ name: "Broken", url: "not-a-url", bgColor: "red" }],
    });

    expect(settings).not.toBeNull();
    expect(settings?.pageTitle).toBe("Home");
    expect(settings?.searchEngineName).toBe("Google");
    expect(settings?.rowsPerPage).toBe(4);
    expect(settings?.tileSize).toBe("medium");
    expect(settings?.tileOpenBehavior).toBe("same");
    expect(settings?.showClock).toBe(true);
    expect(settings?.clockFormat).toBe("24h");
    expect(settings?.faviconSrc).toBe(defaultFaviconSrc);
    expect(settings?.tiles.length).toBeGreaterThan(0);
  });

  it("preserves valid clock and favicon settings", () => {
    const settings = normalizeSettings({
      pageTitle: "Dashboard",
      searchEngineName: "DuckDuckGo",
      rowsPerPage: 6,
      tileSize: "small",
      tileOpenBehavior: "new",
      showClock: false,
      clockFormat: "12h",
      faviconSrc: "https://example.com/icon.png",
      tiles: [
        {
          name: "Docs",
          url: "docs.example.com",
          bgColor: "#dbeafe",
          iconSrc: "https://example.com/docs.png",
        },
      ],
    });

    expect(settings).not.toBeNull();
    expect(settings?.pageTitle).toBe("Dashboard");
    expect(settings?.searchEngineName).toBe("DuckDuckGo");
    expect(settings?.rowsPerPage).toBe(6);
    expect(settings?.tileSize).toBe("small");
    expect(settings?.tileOpenBehavior).toBe("new");
    expect(settings?.showClock).toBe(false);
    expect(settings?.clockFormat).toBe("12h");
    expect(settings?.faviconSrc).toBe("https://example.com/icon.png");
    expect(settings?.tiles).toEqual([
      {
        name: "Docs",
        url: "https://docs.example.com",
        bgColor: "#dbeafe",
        iconSrc: "https://example.com/docs.png",
      },
    ]);
  });

  it("derives readable text colors from background luminance", () => {
    expect(getTextColorForBackground("#ffffff")).toBe("#1f2937");
    expect(getTextColorForBackground("#111827")).toBe("#f8fafc");
  });
});