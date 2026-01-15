// File: src/utils/route-params.ts
// Helpers para normalizar parámetros de ruta (expo-router) manteniendo TS estricto.

export function asStringParam(
  v: string | string[] | undefined
): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/**
 * Valida un string ISO-8601 (date-time) de forma pragmática.
 * - El backend valida con IsISO8601, así que aquí solo prevenimos valores rotos.
 */
export function isValidISODateTime(value: string | undefined): value is string {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
}

export function buildDateRangeFilter(input: {
  from?: string;
  to?: string;
}): { from?: string; to?: string } | undefined {
  const q: { from?: string; to?: string } = {};

  if (isValidISODateTime(input.from)) q.from = input.from;
  if (isValidISODateTime(input.to)) q.to = input.to;

  return Object.keys(q).length ? q : undefined;
}
