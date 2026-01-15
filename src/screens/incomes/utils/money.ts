// File: src/screens/incomes/utils/money.ts — Formateo de montos.

export function formatMoney(amount: number, currency: string): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${n.toFixed(2)} ${currency}`;
}
