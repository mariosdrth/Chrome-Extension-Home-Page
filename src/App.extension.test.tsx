import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { getDefaultSettings } from "./AppStore";

const { mockReadSettings, mockWriteSettings } = vi.hoisted(() => ({
  mockReadSettings: vi.fn(),
  mockWriteSettings: vi.fn(),
}));

vi.mock("./AppStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./AppStore")>();
  return {
    ...actual,
    readSettings: mockReadSettings,
    writeSettings: mockWriteSettings,
  };
});

vi.mock("./ImageStore", () => ({
  deleteImage: vi.fn(async () => undefined),
  getAllStoredImages: vi.fn(async () => []),
  getImageBlob: vi.fn(async () => null),
  isImageRef: vi.fn((value: string) => value.startsWith("idb:")),
  saveImageBlobWithRefIfMissing: vi.fn(async () => undefined),
  saveImageFile: vi.fn(async () => "idb:test-image"),
}));

vi.mock("@polyutils/components", () => {
  const Button = ({
    children,
    icon,
    iconOnly,
    type = "button",
    menuItems,
    ...props
  }: {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    iconOnly?: boolean;
    type?: "button" | "submit" | "reset";
    menuItems?: React.ReactNode[];
    [key: string]: unknown;
  }) => {
    const content = iconOnly ? icon : (children ?? icon);

    return (
      <button type={type} {...props}>
        {content}
        {Array.isArray(menuItems) ? <span>{menuItems}</span> : null}
      </button>
    );
  };

  const ThemeToggle = (props: { [key: string]: unknown }) => <button type="button" {...props}>Theme</button>;
  const Scrollbars = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const icon = () => <span aria-hidden="true" />;

  return {
    BarsIcon: icon,
    Button,
    CircleFullIcon: icon,
    CloseIcon: icon,
    DownloadIcon: icon,
    PencilIcon: icon,
    PlusIcon: icon,
    RotateLeftIcon: icon,
    Scrollbars,
    SearchIcon: icon,
    ThemeToggle,
    UploadIcon: icon,
    useTheme: () => ({ theme: "light" }),
  };
});

describe("App extension behavior", () => {
  beforeEach(() => {
    mockReadSettings.mockReturnValue(getDefaultSettings());
    mockWriteSettings.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("opens search results with the selected engine and query", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText("Search with Google"), "vitest docs");
    await user.click(screen.getByLabelText("Search"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target, features] = openSpy.mock.calls[0];
    expect(url).toBe("https://www.google.com/search?q=vitest+docs");
    expect(target).toBe("_blank");
    expect(features).toBe("noopener,noreferrer");
  });

  it("adds a new shortcut tile from the modal", async () => {
    const user = userEvent.setup();
    const settings = getDefaultSettings();
    settings.rowsPerPage = 20;
    mockReadSettings.mockReturnValue(settings);

    render(<App />);

    await user.click(screen.getByLabelText("Add new tile"));
    await user.type(screen.getByLabelText("Tile Name"), "Docs");
    await user.type(screen.getByLabelText("URL"), "docs.example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByTitle("Docs")).toHaveAttribute("href", "https://docs.example.com");
  });

  it("removes a tile only after confirmation", async () => {
    const user = userEvent.setup();

    render(<App />);

    const youtubeTile = screen.getByTitle("YouTube");
    expect(youtubeTile).toBeInTheDocument();

    await user.click(screen.getByLabelText("Remove YouTube"));
    expect(screen.getByText("Are you sure you want to remove YouTube?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.queryByTitle("YouTube")).not.toBeInTheDocument();
    });
  });

  it("hides the clock when disabled in settings", async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(screen.getByLabelText("Current time")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Open side panel"));
    const clockCheckbox = screen.getByRole("checkbox");
    fireEvent.click(clockCheckbox);

    await waitFor(() => {
      expect(screen.queryByLabelText("Current time")).not.toBeInTheDocument();
    });
  });
});
