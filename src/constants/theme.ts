// File: src/constants/theme.ts — Tokens de color/fuentes de la app (modo claro/oscuro).

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

// UI tokens adicionales (evita colores hardcodeados en pantallas).
const primaryLight = "#0a7ea4";
const primaryDark = "#2F81F7";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    surface: "#F5F7FA",
    border: "#D0D7DE",
    primary: primaryLight,
    onPrimary: "#FFFFFF",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    yellow: "#B45309",
    green: "#15803D",
    red: "#DC2626",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    surface: "#1C1F22",
    border: "#30363D",
    primary: primaryDark,
    onPrimary: "#FFFFFF",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    yellow: "#FBBF24",
    green: "#22C55E",
    red: "#F87171",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
