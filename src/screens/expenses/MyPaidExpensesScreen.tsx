// File: src/screens/expenses/MyPaidExpensesScreen.tsx — Detalle de lo que yo pagué.

import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

import type { ExpenseItemApi } from "@/api/expenses-api";
import {
  useInfiniteExpensesListQuery,
  useMyPaidExpensesSummaryQuery,
} from "@/query/expenses";
import { ExpensesListView } from "@/screens/expenses/components/ExpensesListView";
import { useAuthStore } from "@/stores/authStore";
import { asStringParam, buildDateRangeFilter } from "@/utils/route-params";

export function MyPaidExpensesScreen() {
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
    () =>
      ({
        ...dateFilters,
        payerId: user?.id,
        limit: LIMIT,
        order: "DESC" as const,
      } as const),
    [dateFilters, user?.id]
  );

  const summaryQuery = useMyPaidExpensesSummaryQuery(dateFilters, enabled);
  const listQuery = useInfiniteExpensesListQuery(listQueryParams, enabled);

  const allItems: ExpenseItemApi[] = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data]
  );

  const currency = summaryQuery.data?.currency ?? household?.currency ?? "USD";

  const subtitle = useMemo(() => {
    const base = "Gastos del hogar donde tú figuras como pagador.";
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

  const totalCount = listQuery.data?.pages?.[0]?.total;
  const hasMore = listQuery.hasNextPage ?? false;

  const isInitialLoading =
    allItems.length === 0 && (summaryQuery.isLoading || listQuery.isLoading);

  const isFetchingMore = listQuery.isFetchingNextPage;

  const loadMore = () => {
    if (!enabled) return;
    if (!listQuery.hasNextPage) return;
    if (listQuery.isFetchingNextPage) return;
    void listQuery.fetchNextPage();
  };

  return (
    <ExpensesListView
      title="Yo pagué"
      subtitle={subtitle}
      totalLabel="Total pagado por mí"
      totalAmount={summaryQuery.data?.total ?? 0}
      currency={currency}
      items={allItems}
      totalCount={totalCount}
      isLoading={isInitialLoading}
      isRefreshing={summaryQuery.isFetching || listQuery.isRefetching}
      onEndReached={loadMore}
      isFetchingMore={isFetchingMore}
      hasMore={hasMore}
      onRefresh={() => {
        void summaryQuery.refetch();
        void listQuery.refetch();
      }}
      emptyText="Todavía no hay gastos pagados por ti."
    />
  );
}
