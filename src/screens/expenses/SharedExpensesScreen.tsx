// File: src/screens/expenses/SharedExpensesScreen.tsx — Detalle de gastos compartidos.

import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

import type { ExpenseItemApi } from "@/api/expenses-api";
import {
  useInfiniteSharedExpensesHistoryQuery,
  useSharedExpensesSummaryQuery,
} from "@/query/expenses";
import { ExpensesListView } from "@/screens/expenses/components/ExpensesListView";
import { useAuthStore } from "@/stores/authStore";
import { asStringParam, buildDateRangeFilter } from "@/utils/route-params";

export function SharedExpensesScreen() {
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    mode?: "month" | "year" | string;
  }>();

  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);

  const enabled = !!household?.id && !!user?.id;

  const from = asStringParam(params.from);
  const to = asStringParam(params.to);
  const mode = asStringParam(params.mode) as "month" | "year" | undefined;

  const dateFilters = useMemo(
    () => buildDateRangeFilter({ from, to }),
    [from, to]
  );

  const LIMIT = 20;
  const listQueryParams = useMemo(
    () => ({ ...dateFilters, limit: LIMIT, order: "DESC" as const }),
    [dateFilters]
  );

  const summaryQuery = useSharedExpensesSummaryQuery(dateFilters, enabled);
  const historyQuery = useInfiniteSharedExpensesHistoryQuery(
    listQueryParams,
    enabled
  );

  const allItems: ExpenseItemApi[] = useMemo(
    () => historyQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [historyQuery.data]
  );

  const currency = summaryQuery.data?.currency ?? household?.currency ?? "USD";

  const subtitle = useMemo(() => {
    const base = "Compras registradas desde la lista compartida del hogar.";
    if (!dateFilters?.from) return base;

    const d = new Date(dateFilters.from);
    const year = d.getUTCFullYear();
    const month = d.toLocaleString(undefined, {
      month: "long",
      timeZone: "UTC",
    });
    const label = mode === "year" ? `${year}` : `${month} ${year}`;
    return `${base} \n Periodo: ${label}`;
  }, [dateFilters?.from, mode]);

  const totalCount = historyQuery.data?.pages?.[0]?.total;
  const hasMore = historyQuery.hasNextPage ?? false;

  const isInitialLoading =
    allItems.length === 0 && (summaryQuery.isLoading || historyQuery.isLoading);

  const isFetchingMore = historyQuery.isFetchingNextPage;

  const loadMore = () => {
    if (!enabled) return;
    if (!historyQuery.hasNextPage) return;
    if (historyQuery.isFetchingNextPage) return;
    void historyQuery.fetchNextPage();
  };

  return (
    <ExpensesListView
      title="Compartido"
      subtitle={subtitle}
      totalLabel="Total compartido"
      totalAmount={summaryQuery.data?.total ?? 0}
      currency={currency}
      items={allItems}
      totalCount={totalCount}
      isLoading={isInitialLoading}
      isRefreshing={summaryQuery.isFetching || historyQuery.isRefetching}
      onEndReached={loadMore}
      isFetchingMore={isFetchingMore}
      hasMore={hasMore}
      onRefresh={() => {
        void summaryQuery.refetch();
        void historyQuery.refetch();
      }}
      emptyText="Todavía no hay compras en la lista compartida."
    />
  );
}
