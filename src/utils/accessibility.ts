// File: src/utils/accessibility.ts — Helpers de accesibilidad (labels/hints/hitSlop).

import type { Insets } from "react-native";

/**
 * Recomendación general: targets táctiles ~44x44.
 * Esto añade área extra alrededor del componente.
 */
export const defaultHitSlop: Insets = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
};

export function a11yButton(label: string, hint?: string) {
  return {
    accessibilityRole: "button" as const,
    accessibilityLabel: label,
    accessibilityHint: hint,
    hitSlop: defaultHitSlop,
  };
}
