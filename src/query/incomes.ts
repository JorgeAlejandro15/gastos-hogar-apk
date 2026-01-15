// File: src/query/incomes.ts — Hooks React Query para ingresos.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  incomesApi,
  type CreateIncomeDto,
  type IncomeItemApi,
  type IncomesListQuery,
  type IncomesSummaryQuery,
  type UpdateIncomeDto,
} from "@/api/incomes-api";

export const incomesKeys = {
  all: ["incomes"] as const,
  infiniteList: (q?: Omit<IncomesListQuery, "offset">) =>
    [
      "incomes",
      "infinite",
      q?.from ?? null,
      q?.to ?? null,
      q?.source ?? null,
      q?.category ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  summary: (q?: IncomesSummaryQuery) =>
    [
      "incomes",
      "summary",
      q?.from ?? null,
      q?.to ?? null,
      q?.source ?? null,
      q?.category ?? null,
    ] as const,

  detail: (incomeId: string) => ["incomes", "detail", incomeId] as const,
};

export function useIncomesInfiniteQuery(
  q?: Omit<IncomesListQuery, "offset">,
  enabled = true
) {
  const limit = q?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: incomesKeys.infiniteList(q),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      incomesApi.list({
        ...q,
        offset: typeof pageParam === "number" ? pageParam : 0,
        limit,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (acc, p) => acc + (p.items?.length ?? 0),
        0
      );
      if (loaded >= lastPage.total) return undefined;
      // next offset
      return loaded;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useIncomesSummaryQuery(
  q?: IncomesSummaryQuery,
  enabled = true
) {
  return useQuery({
    queryKey: incomesKeys.summary(q),
    queryFn: () => incomesApi.getSummary(q),
    enabled,
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useIncomeDetailQuery(incomeId: string, enabled = true) {
  return useQuery({
    queryKey: incomesKeys.detail(incomeId),
    queryFn: () => incomesApi.get(incomeId),
    enabled: !!incomeId && enabled,
    staleTime: 30_000,
  });
}

export function useCreateIncomeMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateIncomeDto) => incomesApi.create(dto),
    onSuccess: async (created: IncomeItemApi) => {
      // Refresh lists; different filters may exist.
      await qc.invalidateQueries({ queryKey: incomesKeys.all });
      // Seed detail cache to avoid refetch if user opens it later.
      qc.setQueryData(incomesKeys.detail(created.id), created);
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateIncomeMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      incomeId,
      dto,
    }: {
      incomeId: string;
      dto: UpdateIncomeDto;
    }) => incomesApi.update(incomeId, dto),
    onSuccess: async (updated: IncomeItemApi) => {
      qc.setQueryData(incomesKeys.detail(updated.id), updated);
      await qc.invalidateQueries({ queryKey: incomesKeys.all });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteIncomeMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (incomeId: string) => incomesApi.remove(incomeId),
    onSuccess: async (_data, incomeId) => {
      qc.removeQueries({ queryKey: incomesKeys.detail(incomeId) });
      await qc.invalidateQueries({ queryKey: incomesKeys.all });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
