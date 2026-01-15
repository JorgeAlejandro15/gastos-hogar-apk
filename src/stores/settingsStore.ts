// File: src/stores/settingsStore.ts — Store de ajustes (tema/moneda/etc.).

import { create } from "zustand";

import * as settingsStorage from "@/api/settings-storage";

export type ThemePreference = "system" | "light" | "dark";

export type SettingsState = {
  themePreference: ThemePreference;

  isHydrating: boolean;
  hydratedOnce: boolean;

  hydrate: () => Promise<void>;
  setThemePreference: (value: ThemePreference) => Promise<void>;
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
        if (stored) set({ themePreference: stored });
        set({ hydratedOnce: true });
      } finally {
        set({ isHydrating: false });
        hydrateInFlight = null;
      }
    })();

    return hydrateInFlight;
  },

  setThemePreference: async (themePreference) => {
    set({ themePreference });
    // Persistir en background sin bloquear la UI
    settingsStorage.saveThemePreference(themePreference).catch((error) => {
      console.error("Error saving theme preference:", error);
    });
  },
}));
