// File: src/query/reports.ts — Hooks React Query para reportes (agregaciones basadas en historial).

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  expensesApi,
  type ExpensesListApi,
  type ExpensesListQuery,
  type ExpensesSummaryApi,
  type ExpensesSummaryQuery,
} from "@/api/expenses-api";

import {
  reportsApi,
  type BalanceReportApi,
  type DateRangeQuery,
  type ExpensesByCategoryReportApi,
  type ExpensesByPayerReportApi,
} from "@/api/reports-api";

export type ReportMode = "all" | "shared" | "personal" | "mine";

export type ExpensesReportFilters = {
  from?: string;
  to?: string;
  payerId?: string;
  category?: string;
  sourceType?: "shopping_item" | "manual";
};

const reportsKeys = {
  all: ["reports"] as const,

  expensesHistoryInfinite: (mode: ReportMode, q?: ExpensesListQuery) =>
    [
      "reports",
      "expenses",
      "history",
      "infinite",
      mode,
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  expensesSummary: (mode: ReportMode, q?: ExpensesSummaryQuery) =>
    [
      "reports",
      "expenses",
      "summary",
      mode,
      q?.from ?? null,
      q?.to ?? null,
      q?.payerId ?? null,
      q?.category ?? null,
      q?.sourceType ?? null,
    ] as const,

  // Reportes agregados en backend (/reports/*)
  expensesByPayer: (q?: DateRangeQuery) =>
    [
      "reports",
      "backend",
      "expenses",
      "by-payer",
      q?.from ?? null,
      q?.to ?? null,
    ] as const,
  expensesByCategory: (q?: DateRangeQuery) =>
    [
      "reports",
      "backend",
      "expenses",
      "by-category",
      q?.from ?? null,
      q?.to ?? null,
    ] as const,
  balance: (q?: DateRangeQuery) =>
    ["reports", "backend", "balance", q?.from ?? null, q?.to ?? null] as const,
};

function pickHistoryEndpoint(mode: ReportMode) {
  if (mode === "shared") return expensesApi.listSharedHistory;
  if (mode === "personal") return expensesApi.listPersonalHistory;
  // "mine" se resuelve con payerId en el mismo /expenses.
  return expensesApi.list;
}

function pickSummaryEndpoint(mode: ReportMode) {
  if (mode === "shared") return expensesApi.getSharedSummary;
  if (mode === "personal") return expensesApi.getPersonalSummary;
  if (mode === "mine") return expensesApi.getMyPaidSummary;
  return expensesApi.getSummary;
}

export function useExpensesReportInfiniteQuery(
  mode: ReportMode,
  q?: Omit<ExpensesListQuery, "offset">,
  enabled = true
) {
  const limit = q?.limit ?? 200;
  const historyFn = pickHistoryEndpoint(mode);

  return useInfiniteQuery({
    queryKey: reportsKeys.expensesHistoryInfinite(mode, q),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      historyFn({
        ...q,
        offset: typeof pageParam === "number" ? pageParam : 0,
        limit,
      }),
    getNextPageParam: (lastPage: ExpensesListApi, allPages) => {
      const loaded = allPages.reduce(
        (acc, p) => acc + (p.items?.length ?? 0),
        0
      );
      if (loaded >= lastPage.total) return undefined;
      return loaded;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useExpensesReportSummaryQuery(
  mode: ReportMode,
  q?: ExpensesSummaryQuery,
  enabled = true
) {
  const summaryFn = pickSummaryEndpoint(mode);

  return useQuery<ExpensesSummaryApi>({
    queryKey: reportsKeys.expensesSummary(mode, q),
    queryFn: () => {
      // Nota: shared/personal no aceptan sourceType en el backend.
      // Lo removemos para evitar queries "fantasma".
      if (mode === "shared" || mode === "personal") {
        const { sourceType: _ignored, ...rest } = q ?? {};
        return (summaryFn as any)(rest);
      }
      return (summaryFn as any)(q);
    },
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useExpensesByPayerReportQuery(
  q?: DateRangeQuery,
  enabled = true
) {
  return useQuery<ExpensesByPayerReportApi>({
    queryKey: reportsKeys.expensesByPayer(q),
    queryFn: () => reportsApi.expensesByPayer(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useExpensesByCategoryReportQuery(
  q?: DateRangeQuery,
  enabled = true
) {
  return useQuery<ExpensesByCategoryReportApi>({
    queryKey: reportsKeys.expensesByCategory(q),
    queryFn: () => reportsApi.expensesByCategory(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useBalanceReportQuery(q?: DateRangeQuery, enabled = true) {
  return useQuery<BalanceReportApi>({
    queryKey: reportsKeys.balance(q),
    queryFn: () => reportsApi.balance(q),
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}
