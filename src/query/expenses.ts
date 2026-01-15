// File: src/query/expenses.ts — Hooks React Query para gastos.

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  expensesApi,
  type ExpensesListQuery,
  type ExpensesSummaryQuery,
} from "@/api/expenses-api";

export const expensesKeys = {
  summary: (q?: ExpensesSummaryQuery) =>
    [
      "expenses",
      "summary",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
    ] as const,

  sharedSummary: (q?: Omit<ExpensesSummaryQuery, "sourceType">) =>
    [
      "expenses",
      "summary",
      "shared",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
    ] as const,

  personalSummary: (q?: Omit<ExpensesSummaryQuery, "sourceType">) =>
    [
      "expenses",
      "summary",
      "personal",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
    ] as const,

  myPaidSummary: (q?: ExpensesSummaryQuery) =>
    [
      "expenses",
      "summary",
      "mine",
      q?.from ?? null,
      q?.to ?? null,
      // payerId viene forzado por backend (= yo), pero lo dejamos en key por consistencia
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
    ] as const,

  list: (q?: ExpensesListQuery) =>
    [
      "expenses",
      "list",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
      q?.offset ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  sharedHistory: (q?: ExpensesListQuery) =>
    [
      "expenses",
      "history",
      "shared",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
      q?.offset ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  personalHistory: (q?: ExpensesListQuery) =>
    [
      "expenses",
      "history",
      "personal",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
      q?.offset ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  // Infinite-query keys (sin offset). El offset se maneja con pageParam.
  listInfinite: (q?: Omit<ExpensesListQuery, "offset">) =>
    [
      "expenses",
      "list",
      "infinite",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  sharedHistoryInfinite: (q?: Omit<ExpensesListQuery, "offset">) =>
    [
      "expenses",
      "history",
      "shared",
      "infinite",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  personalHistoryInfinite: (q?: Omit<ExpensesListQuery, "offset">) =>
    [
      "expenses",
      "history",
      "personal",
      "infinite",
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,
};

export function useExpensesSummaryQuery(
  q?: ExpensesSummaryQuery,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: expensesKeys.summary(q),
    queryFn: () => expensesApi.getSummary(q),
    enabled,
    // staleTime: 15_000,
    // refetchInterval: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useSharedExpensesSummaryQuery(
  q?: Omit<ExpensesSummaryQuery, "sourceType">,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: expensesKeys.sharedSummary(q),
    queryFn: () => expensesApi.getSharedSummary(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function usePersonalExpensesSummaryQuery(
  q?: Omit<ExpensesSummaryQuery, "sourceType">,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: expensesKeys.personalSummary(q),
    queryFn: () => expensesApi.getPersonalSummary(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useMyPaidExpensesSummaryQuery(
  q?: ExpensesSummaryQuery,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: expensesKeys.myPaidSummary(q),
    queryFn: () => expensesApi.getMyPaidSummary(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useExpensesListQuery(q?: ExpensesListQuery, enabled = true) {
  return useQuery({
    queryKey: expensesKeys.list(q),
    queryFn: () => expensesApi.list(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useSharedExpensesHistoryQuery(
  q?: ExpensesListQuery,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: expensesKeys.sharedHistory(q),
    queryFn: () => expensesApi.listSharedHistory(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function usePersonalExpensesHistoryQuery(
  q?: ExpensesListQuery,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: expensesKeys.personalHistory(q),
    queryFn: () => expensesApi.listPersonalHistory(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

function getNextOffset(pages: { total: number; items: unknown[] }[]) {
  const total = pages[0]?.total ?? 0;
  const loaded = pages.reduce((sum, p) => sum + (p.items?.length ?? 0), 0);
  return loaded < total ? loaded : undefined;
}

export function useInfiniteExpensesListQuery(
  q?: Omit<ExpensesListQuery, "offset">,
  enabled: boolean = true
) {
  const limit = q?.limit ?? 20;
  return useInfiniteQuery({
    queryKey: expensesKeys.listInfinite(q),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      expensesApi.list({ ...q, offset: Number(pageParam) || 0, limit }),
    getNextPageParam: (_lastPage, pages) => getNextOffset(pages),
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useInfiniteSharedExpensesHistoryQuery(
  q?: Omit<ExpensesListQuery, "offset">,
  enabled: boolean = true
) {
  const limit = q?.limit ?? 20;
  return useInfiniteQuery({
    queryKey: expensesKeys.sharedHistoryInfinite(q),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      expensesApi.listSharedHistory({
        ...q,
        offset: Number(pageParam) || 0,
        limit,
      }),
    getNextPageParam: (_lastPage, pages) => getNextOffset(pages),
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useInfinitePersonalExpensesHistoryQuery(
  q?: Omit<ExpensesListQuery, "offset">,
  enabled: boolean = true
) {
  const limit = q?.limit ?? 20;
  return useInfiniteQuery({
    queryKey: expensesKeys.personalHistoryInfinite(q),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      expensesApi.listPersonalHistory({
        ...q,
        offset: Number(pageParam) || 0,
        limit,
      }),
    getNextPageParam: (_lastPage, pages) => getNextOffset(pages),
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}
