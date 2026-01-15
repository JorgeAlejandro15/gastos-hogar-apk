// File: src/api/reports-api.ts — Cliente REST para reportes agregados (/reports).

import { api } from "@/api/api";

export type DateRangeQuery = {
  from?: string;
  to?: string;
};

export type ExpensesByPayerItemApi = {
  payerId: string;
  displayName: string;
  total: number;
};

export type ExpensesByPayerReportApi = {
  householdId: string;
  from: string | null;
  to: string | null;
  items: ExpensesByPayerItemApi[];
};

export type ExpensesByCategoryItemApi = {
  category: string;
  total: number;
};

export type ExpensesByCategoryReportApi = {
  householdId: string;
  from: string | null;
  to: string | null;
  items: ExpensesByCategoryItemApi[];
};

export type BalanceReportApi = {
  userId: string;
  householdId: string;
  currency: string;
  from: string | null;
  to: string | null;
  income: number;
  expense: number;
  balance: number;
};

export const reportsApi = {
  async expensesByPayer(q?: DateRangeQuery): Promise<ExpensesByPayerReportApi> {
    const { data } = await api.get<ExpensesByPayerReportApi>(
      "/reports/expenses/by-payer",
      { params: q }
    );
    return data;
  },

  async expensesByCategory(
    q?: DateRangeQuery
  ): Promise<ExpensesByCategoryReportApi> {
    const { data } = await api.get<ExpensesByCategoryReportApi>(
      "/reports/expenses/by-category",
      { params: q }
    );
    return data;
  },

  async balance(q?: DateRangeQuery): Promise<BalanceReportApi> {
    const { data } = await api.get<BalanceReportApi>("/reports/balance", {
      params: q,
    });
    return data;
  },
};
