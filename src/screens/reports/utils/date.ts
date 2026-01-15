// File: src/screens/reports/utils/date.ts — Helpers de rango de fechas para filtros.

export type DatePreset = "7d" | "30d" | "month" | "custom";

function startOfLocalDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfLocalDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function toIsoStartOfDay(d: Date): string {
  return startOfLocalDay(d).toISOString();
}

export function toIsoEndOfDay(d: Date): string {
  return endOfLocalDay(d).toISOString();
}

export function presetToRange(
  preset: DatePreset,
  now = new Date()
): {
  from: Date;
  to: Date;
} {
  const to = endOfLocalDay(now);

  if (preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: startOfLocalDay(from), to };
  }

  const days = preset === "7d" ? 7 : 30;
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));

  return { from: startOfLocalDay(from), to };
}

export function safeParseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
