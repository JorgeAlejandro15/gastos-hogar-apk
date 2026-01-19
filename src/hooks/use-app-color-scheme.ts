// File: src/hooks/use-app-color-scheme.ts — Esquema de color efectivo (preferencia usuario > sistema).

import { useMemo } from "react";
import { useColorScheme } from "react-native";

import {
  selectThemePreference,
  useSettingsStore,
} from "@/stores/settingsStore";

export type AppColorScheme = "light" | "dark";

/**
 * Hook que retorna el esquema de color efectivo de la aplicación.
 * Considera la preferencia del usuario y el tema del sistema.
 *
 * Orden de prioridad:
 * 1. Si el usuario seleccionó "light" o "dark" explícitamente, usa eso
 * 2. Si está en "system", usa el tema del sistema operativo
 */
export function useAppColorScheme(): AppColorScheme {
  const systemScheme = useColorScheme();
  // Selector específico - Zustand automáticamente evita re-renders si el valor no cambia
  const pref = useSettingsStore(selectThemePreference);

  return useMemo(() => {
    if (pref === "light" || pref === "dark") return pref;
    return systemScheme === "dark" ? "dark" : "light";
  }, [pref, systemScheme]);
}
