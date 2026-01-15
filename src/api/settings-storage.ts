// File: src/api/settings-storage.ts — Persistencia segura de ajustes (expo-secure-store) + fallback web.

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { ThemePreference } from "@/stores/settingsStore";

const KEY_THEME = "settings.themePreference";

function canUseLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (!canUseLocalStorage()) return null;
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string | null): Promise<void> {
  if (Platform.OS === "web") {
    if (!canUseLocalStorage()) return;
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return;
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function loadThemePreference(): Promise<ThemePreference | null> {
  const raw = await getItem(KEY_THEME);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return null;
}

export async function saveThemePreference(
  value: ThemePreference
): Promise<void> {
  await setItem(KEY_THEME, value);
}
