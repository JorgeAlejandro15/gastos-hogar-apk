// File: src/utils/format.ts — Formateadores (moneda/fechas) simples para la UI.

export function formatCurrency(amount: number, currency: string): string {
  // En RN Hermes/Android a veces Intl puede variar; esto es un fallback simple.
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}
