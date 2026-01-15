// File: src/screens/reports/utils/aggregate.ts — Agregaciones para gráficos de reportes.

import type { ExpenseItemApi } from "@/api/expenses-api";

export type SeriesPoint = {
  key: string;
  label: string;
  value: number;
};

export function getExpenseValue(item: ExpenseItemApi): number {
  // El backend a veces expone amount y/o total (items). Preferimos total.
  const v = item.total ?? item.amount ?? 0;
  return Number.isFinite(v) ? v : 0;
}

export function aggregateByPayer(items: ExpenseItemApi[]): SeriesPoint[] {
  const map = new Map<string, { label: string; value: number }>();

  for (const it of items) {
    const payerId = it.payer?.id ?? "unknown";
    const label =
      it.payer?.displayName?.trim() || it.payer?.email || "Sin pagador";

    const prev = map.get(payerId);
    const nextValue = (prev?.value ?? 0) + getExpenseValue(it);
    map.set(payerId, { label, value: nextValue });
  }

  return [...map.entries()]
    .map(([key, v]) => ({ key, label: v.label, value: v.value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateByCategory(items: ExpenseItemApi[]): SeriesPoint[] {
  const map = new Map<string, number>();

  for (const it of items) {
    const key = (it.category ?? "Sin categoría").trim() || "Sin categoría";
    map.set(key, (map.get(key) ?? 0) + getExpenseValue(it));
  }

  return [...map.entries()]
    .map(([key, value]) => ({ key, label: key, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateByDay(items: ExpenseItemApi[]): SeriesPoint[] {
  // Buckets por YYYY-MM-DD (basado en ISO). Para reportes está bien aunque exista desfase por TZ.
  const map = new Map<string, number>();

  for (const it of items) {
    const d = new Date(it.occurredAt);
    if (Number.isNaN(d.getTime())) continue;

    const day = d.toISOString().slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + getExpenseValue(it));
  }

  return [...map.entries()]
    .map(([key, value]) => ({ key, label: key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function clampTopWithOther(
  points: SeriesPoint[],
  topN: number
): { top: SeriesPoint[]; other: SeriesPoint | null } {
  if (points.length <= topN) return { top: points, other: null };

  const top = points.slice(0, topN);
  const rest = points.slice(topN);
  const otherValue = rest.reduce((acc, p) => acc + p.value, 0);

  return {
    top,
    other:
      otherValue > 0
        ? { key: "other", label: "Otros", value: otherValue }
        : null,
  };
}
