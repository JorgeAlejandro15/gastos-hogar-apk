// File: src/navigation/navigationTheme.ts — Tema de React Navigation derivado de tokens de la app.

import type { Theme } from "@react-navigation/native";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";

import { Colors } from "@/constants/theme";
import type { AppColorScheme } from "@/hooks/use-app-color-scheme";

/**
 * Construye el theme de React Navigation usando los mismos tokens que la app.
 * Importante para evitar flashes blancos durante transiciones.
 */
export function createNavigationTheme(scheme: AppColorScheme): Theme {
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const tokens = Colors[scheme];

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: tokens.primary,
      background: tokens.background,
      card: tokens.background,
      text: tokens.text,
      border: tokens.border,
    },
  };
}
