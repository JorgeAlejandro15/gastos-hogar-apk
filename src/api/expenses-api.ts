// File: src/api/expenses-api.ts — Cliente REST para gastos (backend NestJS /expenses).

import { api } from "@/api/api";

export type ExpensesSummaryApi = {
  total: number;
  currency: string;
};

export type ExpensePayerApi = {
  id: string;
  email: string;
  displayName: string;
};

export type ExpenseItemApi = {
  id: string;
  amount: number;
  total: number;
  price: number;
  currency: string;
  description: string;
  category: string | null;
  occurredAt: string;
  sourceType: "shopping_item" | "manual";
  sourceId: string | null;
  payer: ExpensePayerApi | null;
  createdAt: string;
};

export type ExpensesListQuery = {
  from?: string;
  to?: string;
  payerId?: string;
  category?: string;
  sourceType?: "shopping_item" | "manual";
  offset?: number;
  limit?: number;
  order?: "ASC" | "DESC";
};

export type ExpensesListApi = {
  total: number;
  items: ExpenseItemApi[];
};

export type ExpensesSummaryQuery = {
  from?: string;
  to?: string;
  payerId?: string;
  category?: string;
  sourceType?: "shopping_item" | "manual";
};

export const expensesApi = {
  async getSummary(q?: ExpensesSummaryQuery): Promise<ExpensesSummaryApi> {
    const { data } = await api.get<ExpensesSummaryApi>("/expenses/summary", {
      params: q,
    });
    return data;
  },

  async getSharedSummary(
    q?: Omit<ExpensesSummaryQuery, "sourceType">
  ): Promise<ExpensesSummaryApi> {
    const { data } = await api.get<ExpensesSummaryApi>(
      "/expenses/summary/shared",
      {
        params: q,
      }
    );
    return data;
  },

  async getPersonalSummary(
    q?: Omit<ExpensesSummaryQuery, "sourceType">
  ): Promise<ExpensesSummaryApi> {
    const { data } = await api.get<ExpensesSummaryApi>(
      "/expenses/summary/personal",
      {
        params: q,
      }
    );
    return data;
  },

  async getMyPaidSummary(
    q?: ExpensesSummaryQuery
  ): Promise<ExpensesSummaryApi> {
    const { data } = await api.get<ExpensesSummaryApi>(
      "/expenses/summary/mine",
      {
        params: q,
      }
    );
    return data;
  },

  async list(q?: ExpensesListQuery): Promise<ExpensesListApi> {
    const { data } = await api.get<ExpensesListApi>("/expenses", {
      params: q,
    });
    return data;
  },

  async listSharedHistory(q?: ExpensesListQuery): Promise<ExpensesListApi> {
    const { data } = await api.get<ExpensesListApi>(
      "/expenses/history/shared",
      {
        params: q,
      }
    );
    return data;
  },

  async listPersonalHistory(q?: ExpensesListQuery): Promise<ExpensesListApi> {
    const { data } = await api.get<ExpensesListApi>(
      "/expenses/history/personal",
      {
        params: q,
      }
    );
    return data;
  },
};
