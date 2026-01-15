// File: src/hooks/use-theme-colors.ts — Hooks para obtener tokens de color del tema.

import { useMemo } from "react";

import { Colors } from "@/constants/theme";
import { useThemeTokens } from "@/providers/ThemeTokensProvider";

type ColorKey = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Hook optimizado que retorna múltiples colores del tema en una sola llamada.
 * Esto reduce el número de llamadas a useAppColorScheme y mejora el rendimiento.
 *
 * @example
 * const { text, primary, border } = useThemeColors();
 */
export function useThemeColors() {
  const { colors } = useThemeTokens();
  return colors;
}

/**
 * Hook para obtener colores específicos del tema con override opcional.
 * Similar a useThemeColor pero memoizado para múltiples colores.
 *
 * @example
 * const colors = useThemedColors(['text', 'primary', 'border']);
 */
export function useThemedColors<T extends ColorKey>(
  keys: readonly T[]
): Record<T, string> {
  const { colors } = useThemeTokens();

  // Nota: si pasas un array literal (['text','border']) se crea en cada render.
  // Ideal: definirlo fuera del componente o memoizarlo en el caller.
  return useMemo(() => {
    const result = {} as Record<T, string>;
    for (const key of keys) {
      result[key] = colors[key];
    }
    return result;
  }, [colors, keys]);
}
