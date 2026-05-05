import { act, renderHook } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

describe("useTheme", () => {
  it("uses stored theme from localStorage", () => {
    window.localStorage.setItem("theme", "light");

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("falls back to matchMedia when no stored theme exists", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("light");
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: light)");
  });

  it("toggleTheme persists and broadcasts the next theme", () => {
    window.localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
