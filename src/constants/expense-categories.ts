// File: src/constants/expense-categories.ts — Categorías de gastos (fuente única).

/**
 * Lista de categorías visibles para el usuario.
 *
 * - Para agregar una nueva categoría en el futuro, edita SOLO este archivo.
 * - Mantener como strings legibles evita mapear ids/labels por ahora.
 */
export const EXPENSE_CATEGORIES = [
  "Comida",
  "Transporte",
  "Luz",
  "Alquiler",
  "Regalo",
  "Electrodoméstico",
  "Ropa",
  "Zapato",
  "Bisutería",
  "Medicina",
  "Reparación",
  "Limpieza",
  "Aseo",
  "Otro",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
