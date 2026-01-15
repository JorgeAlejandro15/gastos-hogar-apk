// File: src/stores/gastosStore.ts — Store global de gastos/reportes (placeholder Fase 1).

import { create } from "zustand";

export type GastosState = {
  totalSpent: number;
  setTotalSpent: (value: number) => void;
  adjustTotalSpent: (delta: number) => void;
};

export const useGastosStore = create<GastosState>((set) => ({
  totalSpent: 0,
  setTotalSpent: (value) => set({ totalSpent: value }),
  adjustTotalSpent: (delta) =>
    set((s) => {
      const next = Number((s.totalSpent + delta).toFixed(2));
      return { totalSpent: Number.isFinite(next) ? next : s.totalSpent };
    }),
}));
