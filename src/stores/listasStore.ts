// File: src/stores/listasStore.ts — Store global de listas (placeholder Fase 1).

import { create } from "zustand";

export type ListasState = {
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
};

export const useListasStore = create<ListasState>((set) => ({
  activeListId: null,
  setActiveListId: (id) => set({ activeListId: id }),
}));
