"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "theme";

// ─── External store ───────────────────────────────────────────────────────────

function readClientTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

// Stable server snapshot — always "dark" so SSR output never mismatches.
function readServerTheme(): Theme {
  return "dark";
}

const themeListeners = new Set<() => void>();

function subscribeToTheme(callback: () => void): () => void {
  themeListeners.add(callback);
  return () => themeListeners.delete(callback);
}

function broadcastTheme(): void {
  themeListeners.forEach((fn) => fn());
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  // useSyncExternalStore: server render uses readServerTheme ("dark"),
  // client hydration matches that, then re-renders with the real value.
  // No setState inside an effect — no lint violation, no hydration mismatch.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readClientTheme,
    readServerTheme,
  );

  // Sync the DOM attribute whenever the resolved theme changes.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(THEME_KEY, next);
    // Apply eagerly to the DOM before React re-renders.
    document.documentElement.dataset.theme = next;
    broadcastTheme();
  }, [theme]);

  return { theme, toggleTheme };
}
