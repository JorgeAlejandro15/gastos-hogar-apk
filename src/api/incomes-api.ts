// File: src/api/incomes-api.ts — Cliente REST para ingresos (backend NestJS /incomes).

import { api } from "@/api/api";

export type IncomeSourceApi = "salary" | "gift" | "refund" | "other";

export type IncomeItemApi = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category: string | null;
  source: IncomeSourceApi;
  occurredAt: string;
  createdAt: string;
};

export type IncomesListQuery = {
  from?: string;
  to?: string;
  source?: IncomeSourceApi;
  category?: string;
  offset?: number;
  limit?: number;
  order?: "ASC" | "DESC";
};

export type IncomesSummaryQuery = {
  from?: string;
  to?: string;
  source?: IncomeSourceApi;
  category?: string;
};

export type IncomesListApi = {
  total: number;
  items: IncomeItemApi[];
};

export type IncomesSummaryApi = {
  total: number;
  currency: string;
};

export type CreateIncomeDto = {
  amount: number;
  source: IncomeSourceApi;
  description: string;
  category?: string;
  occurredAt?: string;
};

export type UpdateIncomeDto = {
  amount?: number;
  source?: IncomeSourceApi;
  description?: string;
  category?: string;
  occurredAt?: string;
};

export const incomesApi = {
  async list(q?: IncomesListQuery): Promise<IncomesListApi> {
    const { data } = await api.get<IncomesListApi>("/incomes", { params: q });
    return data;
  },

  async getSummary(q?: IncomesSummaryQuery): Promise<IncomesSummaryApi> {
    const { data } = await api.get<IncomesSummaryApi>("/incomes/summary", {
      params: q,
    });
    return data;
  },

  async get(incomeId: string): Promise<IncomeItemApi> {
    const { data } = await api.get<IncomeItemApi>(`/incomes/${incomeId}`);
    return data;
  },

  async create(dto: CreateIncomeDto): Promise<IncomeItemApi> {
    const { data } = await api.post<IncomeItemApi>("/incomes", dto);
    return data;
  },

  async update(incomeId: string, dto: UpdateIncomeDto): Promise<IncomeItemApi> {
    const { data } = await api.patch<IncomeItemApi>(
      `/incomes/${incomeId}`,
      dto
    );
    return data;
  },

  async remove(incomeId: string): Promise<{ ok: true }> {
    const { data } = await api.delete<{ ok: true }>(`/incomes/${incomeId}`);
    return data;
  },
};
