// File: src/utils/number.ts — Helpers numéricos (input).

/**
 * Parsea un input decimal (acepta coma o punto).
 * Retorna null si está vacío o no es válido.
 */
export function parseDecimalInput(input: string): number | null {
  const trimmed = String(input).trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
