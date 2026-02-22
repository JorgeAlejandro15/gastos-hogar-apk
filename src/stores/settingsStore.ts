// File: src/stores/settingsStore.ts — Store de ajustes (tema/moneda/etc.).

import { create } from "zustand";

import * as settingsStorage from "@/api/settings-storage";

export type ThemePreference = "system" | "light" | "dark";

export type SettingsState = {
  themePreference: ThemePreference;

  isHydrating: boolean;
  hydratedOnce: boolean;

  hydrate: () => Promise<void>;
  setThemePreference: (value: ThemePreference) => void;
};

let hydrateInFlight: Promise<void> | null = null;

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  themePreference: "system",

  isHydrating: true,
  hydratedOnce: false,

  hydrate: async () => {
    if (get().hydratedOnce) return;
    if (hydrateInFlight) return hydrateInFlight;

    set({ isHydrating: true });

    hydrateInFlight = (async () => {
      try {
        const stored = await settingsStorage.loadThemePreference();
        if (stored) {
          set({ themePreference: stored });
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      } finally {
        set({ hydratedOnce: true, isHydrating: false });
        hydrateInFlight = null;
      }
    })();

    return hydrateInFlight;
  },

  setThemePreference: (themePreference) => {
    // Actualizar estado inmediatamente para UI responsiva
    set({ themePreference });

    // Persistir en background sin bloquear la UI
    settingsStorage.saveThemePreference(themePreference).catch((error) => {
      console.error("Error saving theme preference:", error);
    });
  },
}));

/**
 * Selector optimizado para obtener solo la preferencia de tema.
 * Usar esto en lugar de (state) => state.themePreference para mejor tree-shaking.
 */
export const selectThemePreference = (state: SettingsState) =>
  state.themePreference;

/**
 * Selector optimizado para obtener el setter de preferencia de tema.
 */
export const selectSetThemePreference = (state: SettingsState) =>
  state.setThemePreference;
