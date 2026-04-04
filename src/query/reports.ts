// File: src/query/reports.ts — Hooks React Query para reportes (agregaciones basadas en historial).

import { useQuery } from "@tanstack/react-query";

import {
  type ExpensesListQuery,
  type ExpensesSummaryQuery,
} from "@/api/expenses-api";

import {
  reportsApi,
  type BalanceReportApi,
  type DateRangeQuery,
  type ExpensesByCategoryReportApi,
  type ExpensesByPayerReportApi,
  type PersonalExpensesByCategoryReportApi,
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
  personalExpensesByCategory: (q?: DateRangeQuery) =>
    [
      "reports",
      "backend",
      "expenses",
      "personal",
      "by-category",
      q?.from ?? null,
      q?.to ?? null,
    ] as const,
  balance: (q?: DateRangeQuery) =>
    ["reports", "backend", "balance", q?.from ?? null, q?.to ?? null] as const,
};

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

export function usePersonalExpensesByCategoryReportQuery(
  q?: DateRangeQuery,
  enabled = true
) {
  return useQuery<PersonalExpensesByCategoryReportApi>({
    queryKey: reportsKeys.personalExpensesByCategory(q),
    queryFn: () => reportsApi.personalExpensesByCategory(q),
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
