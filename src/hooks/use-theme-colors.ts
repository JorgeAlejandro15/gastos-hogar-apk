// File: src/hooks/use-theme-colors.ts — Hooks para obtener tokens de color del tema.

import { useMemo } from "react";

import { Colors } from "@/constants/theme";
import { useThemeTokens } from "@/providers/ThemeTokensProvider";

type ColorKey = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Hook optimizado que retorna múltiples colores del tema en una sola llamada.
 * Esto reduce el número de llamadas a useAppColorScheme y mejora el rendimiento.
 *
 */
export function useThemeColors() {
  const { colors } = useThemeTokens();
  return colors;
}

/**
 * Hook para obtener colores específicos del tema con override opcional.
 * Similar a useThemeColor pero memoizado para múltiples colores.
 */
export function useThemedColors<T extends ColorKey>(
  keys: readonly T[]
): Record<T, string> {
  const { colors } = useThemeTokens();

  return useMemo(() => {
    const result = {} as Record<T, string>;
    for (const key of keys) {
      result[key] = colors[key];
    }
    return result;
  }, [colors, keys]);
}
