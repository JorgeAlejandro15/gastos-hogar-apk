// File: src/hooks/use-theme-toggle.ts — Hook de utilidad para toggle de tema.

import { useCallback } from "react";

import {
  selectSetThemePreference,
  selectThemePreference,
  useSettingsStore,
  type ThemePreference,
} from "@/stores/settingsStore";
import { useAppColorScheme } from "./use-app-color-scheme";

export type ThemeToggleResult = {
  /** Esquema de color efectivo actual ("light" | "dark") */
  effectiveScheme: "light" | "dark";

  /** Preferencia de tema del usuario ("system" | "light" | "dark") */
  themePreference: ThemePreference;

  /** Si el tema efectivo actual es oscuro */
  isDarkMode: boolean;

  /** Alterna entre light y dark (siempre establece preferencia explícita) */
  toggle: () => void;

  /** Establece una preferencia específica */
  setTheme: (theme: ThemePreference) => void;
};

export function useThemeToggle(): ThemeToggleResult {
  const effectiveScheme = useAppColorScheme();
  const themePreference = useSettingsStore(selectThemePreference);
  const setThemePreference = useSettingsStore(selectSetThemePreference);

  const isDarkMode = effectiveScheme === "dark";

  const toggle = useCallback(() => {
    const newTheme = isDarkMode ? "light" : "dark";
    if (__DEV__) {
      console.log(`[THEME] ${isDarkMode ? "dark" : "light"} → ${newTheme}`);
    }
    setThemePreference(newTheme);
  }, [isDarkMode, setThemePreference]);

  const setTheme = useCallback(
    (theme: ThemePreference) => {
      setThemePreference(theme);
    },
    [setThemePreference]
  );

  return {
    effectiveScheme,
    themePreference,
    isDarkMode,
    toggle,
    setTheme,
  };
}
