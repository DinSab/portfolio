import "@testing-library/jest-dom";

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-color-scheme: light"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    writable: true,
    value: jest.fn(),
  });
}

beforeEach(() => {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  }
  jest.clearAllMocks();
});
