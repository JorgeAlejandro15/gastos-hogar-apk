// File: src/hooks/use-app-color-scheme.ts — Esquema de color efectivo (preferencia usuario > sistema).

import { useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";

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
  // Selector específico - Zustand automáticamente evita re-renders si el valor no cambia
  const pref = useSettingsStore(selectThemePreference);

  const [systemScheme, setSystemScheme] = useState(() =>
    Appearance.getColorScheme()
  );

  useEffect(() => {
    if (pref !== "system") return;

    // Mantener sincronizado con el sistema solo cuando el usuario usa "system".
    setSystemScheme(Appearance.getColorScheme());

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription.remove();
  }, [pref]);

  return useMemo(() => {
    if (pref === "light" || pref === "dark") return pref;
    return systemScheme === "dark" ? "dark" : "light";
  }, [pref, systemScheme]);
}
