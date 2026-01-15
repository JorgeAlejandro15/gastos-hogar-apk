// File: src/api/auth-storage.ts — Persistencia segura de sesión (expo-secure-store) + fallback web.

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Claves estables (migraciones se pueden añadir más adelante)
const KEY_ACCESS = "auth.accessToken";
const KEY_REFRESH = "auth.refreshToken";
const KEY_USER = "auth.user";
const KEY_HOUSEHOLD = "auth.household";

export type PersistedAuth = {
  accessToken: string | null;
  refreshToken: string | null;
  userJson: string | null;
  householdJson: string | null;
};

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

export async function loadAuth(): Promise<PersistedAuth> {
  const [accessToken, refreshToken, userJson, householdJson] =
    await Promise.all([
      getItem(KEY_ACCESS),
      getItem(KEY_REFRESH),
      getItem(KEY_USER),
      getItem(KEY_HOUSEHOLD),
    ]);

  return {
    accessToken,
    refreshToken,
    userJson,
    householdJson,
  };
}

export async function saveAuth(input: {
  accessToken: string;
  refreshToken: string;
  userJson: string;
  householdJson: string | null;
}): Promise<void> {
  await Promise.all([
    setItem(KEY_ACCESS, input.accessToken),
    setItem(KEY_REFRESH, input.refreshToken),
    setItem(KEY_USER, input.userJson),
    setItem(KEY_HOUSEHOLD, input.householdJson),
  ]);
}

export async function updateTokens(input: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  await Promise.all([
    setItem(KEY_ACCESS, input.accessToken),
    setItem(KEY_REFRESH, input.refreshToken),
  ]);
}

export async function updateProfile(input: {
  userJson: string | null;
  householdJson: string | null;
}): Promise<void> {
  await Promise.all([
    setItem(KEY_USER, input.userJson),
    setItem(KEY_HOUSEHOLD, input.householdJson),
  ]);
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    setItem(KEY_ACCESS, null),
    setItem(KEY_REFRESH, null),
    setItem(KEY_USER, null),
    setItem(KEY_HOUSEHOLD, null),
  ]);
}
