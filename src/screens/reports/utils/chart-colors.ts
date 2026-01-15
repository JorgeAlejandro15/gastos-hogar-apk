// File: src/screens/reports/utils/chart-colors.ts — Paleta simple para charts (evita dependencias).

/**
 * Paleta con buen contraste en light/dark.
 * Nota: si luego usamos temas dinámicos, podemos derivar colores desde tokens.
 */
const PALETTE = [
  "#0a7ea4",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#e11d48",
  "#14b8a6",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
] as const;

export function pickChartColor(index: number): string {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}
