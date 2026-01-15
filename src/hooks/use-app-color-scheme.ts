// File: src/hooks/use-app-color-scheme.ts — Esquema de color efectivo (preferencia usuario > sistema).

import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { useSettingsStore } from "@/stores/settingsStore";

export type AppColorScheme = "light" | "dark";

export function useAppColorScheme(): AppColorScheme {
  const systemScheme = useColorScheme();
  // Selector específico - Zustand automáticamente evita re-renders si el valor no cambia
  const pref = useSettingsStore((state) => state.themePreference);

  return useMemo(() => {
    if (pref === "light" || pref === "dark") return pref;
    return systemScheme === "dark" ? "dark" : "light";
  }, [pref, systemScheme]);
}
