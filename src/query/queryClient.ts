// File: src/query/queryClient.ts — Instancia central de React Query.

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Preferimos UX rápida y estable; se puede ajustar por feature.
      retry: 1,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
