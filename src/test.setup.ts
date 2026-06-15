import "@testing-library/jest-dom/vitest";

class ResizeObserver {
  observe() {
    // no-op for tests
  }

  unobserve() {
    // no-op for tests
  }

  disconnect() {
    // no-op for tests
  }
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  writable: true,
  value: ResizeObserver,
});
