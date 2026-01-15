// File: src/hooks/use-theme-color.ts — Helper para obtener colores del tema según modo claro/oscuro.

import { Colors } from "@/constants/theme";
import { useThemeTokens } from "@/providers/ThemeTokensProvider";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { scheme } = useThemeTokens();
  const colorFromProps = props[scheme];

  if (colorFromProps) return colorFromProps;
  return Colors[scheme][colorName];
}
