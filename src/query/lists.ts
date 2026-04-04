// File: src/query/lists.ts — Hooks React Query para listas/items con invalidación y UX rápida.

import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import { listsApi } from "@/api/lists-api";
import type {
  CreateItemDto,
  CreateListDto,
  ShoppingHistoryPageApi,
  ShoppingItemApi,
  ShoppingListDetailApi,
  ShoppingPendingPageApi,
  UpdateItemDto,
  UpdateListDto,
} from "@/types/lists";

export type ListHistoryFilter = {
  from?: string;
  to?: string;
};

export const listsKeys = {
  lists: () => ["lists"] as const,
  list: (listId: string) => ["lists", listId] as const,
  pendingInfiniteBase: (listId: string) =>
    ["lists", listId, "pending", "infinite"] as const,
  pendingInfinite: (listId: string) =>
    ["lists", listId, "pending", "infinite"] as const,
  historyMeta: (listId: string) =>
    ["lists", listId, "history", "meta"] as const,
  historyInfiniteBase: (listId: string) =>
    ["lists", listId, "history", "infinite"] as const,
  historyInfinite: (listId: string, filter?: ListHistoryFilter) =>
    [
      "lists",
      listId,
      "history",
      "infinite",
      filter?.from ?? null,
      filter?.to ?? null,
    ] as const,
} satisfies Record<string, (...args: any[]) => QueryKey>;

export function useListsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: listsKeys.lists(),
    queryFn: () => listsApi.getLists(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export function useListDetailQuery(listId: string) {
  return useQuery({
    queryKey: listsKeys.list(listId),
    queryFn: () => listsApi.getList(listId),
    enabled: !!listId,
    staleTime: 8_000,
    refetchInterval: 10_000,
  });
}

export function useListPendingInfiniteQuery(
  listId: string,
  enabled: boolean,
  limit: number = 10
) {
  return useInfiniteQuery({
    queryKey: listsKeys.pendingInfinite(listId),
    queryFn: ({ pageParam }) =>
      listsApi.getPendingPage(listId, {
        limit,
        cursor: (pageParam as string | null | undefined) ?? null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!listId && enabled,
    staleTime: 10_000,
    refetchInterval: enabled ? 10_000 : false,
  });
}

export function useListHistoryMetaQuery(
  listId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: listsKeys.historyMeta(listId),
    queryFn: () => listsApi.getHistoryPage(listId, { limit: 1, cursor: null }),
    enabled: !!listId && enabled,
    staleTime: 20_000,
    refetchInterval: enabled ? 20_000 : false,
  });
}

export function useListHistoryInfiniteQuery(
  listId: string,
  enabled: boolean,
  filter?: ListHistoryFilter,
  limit: number = 10
) {
  return useInfiniteQuery({
    queryKey: listsKeys.historyInfinite(listId, filter),
    queryFn: ({ pageParam }) =>
      listsApi.getHistoryPage(listId, {
        from: filter?.from,
        to: filter?.to,
        limit,
        cursor: (pageParam as string | null | undefined) ?? null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!listId && enabled,
    staleTime: 20_000,
    refetchInterval: enabled ? 20_000 : false,
  });
}

export function useCreateListMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateListDto) => listsApi.createList(dto),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: listsKeys.lists() });
    },
  });
}

export function useUpdateListMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, dto }: { listId: string; dto: UpdateListDto }) =>
      listsApi.updateList(listId, dto),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: listsKeys.lists() }),
        qc.invalidateQueries({ queryKey: listsKeys.list(vars.listId) }),
      ]);
    },
  });
}

export function useDeleteListMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => listsApi.deleteList(listId),
    onSuccess: async (_data, listId) => {
      qc.removeQueries({ queryKey: listsKeys.list(listId) });
      qc.removeQueries({ queryKey: listsKeys.pendingInfiniteBase(listId) });
      qc.removeQueries({ queryKey: listsKeys.historyMeta(listId) });
      qc.removeQueries({ queryKey: listsKeys.historyInfiniteBase(listId) });
      await qc.invalidateQueries({ queryKey: listsKeys.lists() });
    },
  });
}

export function useAddItemMutation(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateItemDto) => listsApi.addItem(listId, dto),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: listsKeys.list(listId) }),
        qc.invalidateQueries({
          queryKey: listsKeys.pendingInfiniteBase(listId),
        }),
        qc.invalidateQueries({ queryKey: listsKeys.lists() }),
      ]);
    },
  });
}

export function useUpdateItemMutation(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, dto }: { itemId: string; dto: UpdateItemDto }) =>
      listsApi.updateItem(listId, itemId, dto),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: listsKeys.list(listId) }),
        qc.invalidateQueries({
          queryKey: listsKeys.pendingInfiniteBase(listId),
        }),
        qc.invalidateQueries({
          queryKey: listsKeys.historyInfiniteBase(listId),
        }),
      ]);
    },
  });
}

export function useDeleteItemMutation(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => listsApi.deleteItem(listId, itemId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: listsKeys.list(listId) }),
        qc.invalidateQueries({
          queryKey: listsKeys.pendingInfiniteBase(listId),
        }),
        qc.invalidateQueries({
          queryKey: listsKeys.historyInfiniteBase(listId),
        }),
        qc.invalidateQueries({ queryKey: listsKeys.lists() }),
      ]);
    },
  });
}

export function useSetPurchasedMutation(listId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      purchased,
    }: {
      itemId: string;
      purchased: boolean;
    }) => listsApi.setPurchased(listId, itemId, { purchased }),
    onMutate: async ({ itemId, purchased }) => {
      // Optimista: el backend saca los comprados del detalle.
      await Promise.all([
        qc.cancelQueries({ queryKey: listsKeys.list(listId) }),
        qc.cancelQueries({ queryKey: listsKeys.pendingInfiniteBase(listId) }),
        qc.cancelQueries({ queryKey: listsKeys.historyMeta(listId) }),
        qc.cancelQueries({ queryKey: listsKeys.historyInfiniteBase(listId) }),
      ]);

      const prevList = qc.getQueryData<ShoppingListDetailApi>(
        listsKeys.list(listId)
      );

      const prevPending = qc.getQueryData<InfiniteData<ShoppingPendingPageApi>>(
        listsKeys.pendingInfinite(listId)
      );

      const prevHistoryMeta = qc.getQueryData<ShoppingHistoryPageApi>(
        listsKeys.historyMeta(listId)
      );
      const prevHistory = qc.getQueryData<InfiniteData<ShoppingHistoryPageApi>>(
        listsKeys.historyInfinite(listId)
      );

      // Capturamos el item desde donde exista para poder moverlo entre caches.
      const itemFromPending = prevPending?.pages
        .flatMap((p) => p.items)
        .find((i) => i.id === itemId);
      const itemFromHistory = prevHistory?.pages
        .flatMap((p) => p.items)
        .find((i) => i.id === itemId);

      // Helper para evitar duplicados.
      const prependUnique = (arr: ShoppingItemApi[], item: ShoppingItemApi) => {
        if (arr.some((i) => i.id === item.id)) return arr;
        return [item, ...arr];
      };

      const updateHistoryTotal = (
        cur: InfiniteData<ShoppingHistoryPageApi> | undefined,
        delta: number
      ) => {
        if (!cur?.pages?.length) return cur;
        const first = cur.pages[0];
        const pages = cur.pages.slice();
        pages[0] = { ...first, total: Math.max(0, (first.total ?? 0) + delta) };
        return { ...cur, pages };
      };

      const adjustPendingTotals = (
        page: ShoppingPendingPageApi,
        deltaCount: number,
        deltaAmount: number
      ): ShoppingPendingPageApi => {
        return {
          ...page,
          total: Math.max(0, (page.total ?? 0) + deltaCount),
          totalAmount: Math.max(0, (page.totalAmount ?? 0) + deltaAmount),
        };
      };

      const removeFromPending = (
        cur: InfiniteData<ShoppingPendingPageApi> | undefined,
        id: string,
        deltaAmount: number
      ) => {
        if (!cur?.pages?.length) return cur;
        let removed = false;
        const pages = cur.pages.map((p, idx) => {
          const nextItems = (p.items ?? []).filter((i) => i.id !== id);
          if (nextItems.length !== (p.items ?? []).length) removed = true;
          if (!removed) return p;
          if (idx === 0) {
            return adjustPendingTotals(
              { ...p, items: nextItems },
              -1,
              -deltaAmount
            );
          }
          return p.items === nextItems ? p : { ...p, items: nextItems };
        });
        return removed ? { ...cur, pages } : cur;
      };

      const addToPendingFirstPage = (
        cur: InfiniteData<ShoppingPendingPageApi> | undefined,
        item: ShoppingItemApi,
        deltaAmount: number
      ) => {
        if (!cur?.pages?.length) return cur;
        const first = cur.pages[0];
        const pages = cur.pages.slice();
        pages[0] = adjustPendingTotals(
          {
            ...first,
            items: prependUnique(first.items ?? [], item),
          },
          +1,
          +deltaAmount
        );
        return { ...cur, pages };
      };

      if (purchased && itemFromPending) {
        const deltaAmount =
          Number(itemFromPending.amount) * Number(itemFromPending.price);

        qc.setQueryData<InfiniteData<ShoppingPendingPageApi>>(
          listsKeys.pendingInfinite(listId),
          (cur) => removeFromPending(cur, itemId, deltaAmount)
        );

        // Al comprar: meter inmediatamente en history para que suba el contador.
        qc.setQueryData<ShoppingHistoryPageApi>(
          listsKeys.historyMeta(listId),
          (cur) => (cur ? { ...cur, total: cur.total + 1 } : cur)
        );
        qc.setQueryData<InfiniteData<ShoppingHistoryPageApi>>(
          listsKeys.historyInfinite(listId),
          (cur) => {
            if (!cur?.pages?.length) return cur;
            const nowIso = new Date().toISOString();
            const newItem: ShoppingItemApi = {
              ...itemFromPending,
              purchased: true,
              purchasedAt: nowIso,
            };

            const first = cur.pages[0];
            const pages = cur.pages.slice();
            pages[0] = {
              ...first,
              items: prependUnique(first.items ?? [], newItem),
              total: (first.total ?? 0) + 1,
            };
            return { ...cur, pages };
          }
        );
      }

      if (prevHistory && !purchased) {
        qc.setQueryData<ShoppingHistoryPageApi>(
          listsKeys.historyMeta(listId),
          (cur) => (cur ? { ...cur, total: Math.max(0, cur.total - 1) } : cur)
        );
        qc.setQueryData<InfiniteData<ShoppingHistoryPageApi>>(
          listsKeys.historyInfinite(listId),
          (cur) => {
            if (!cur?.pages?.length) return cur;

            let removed = false;
            const pages = cur.pages.map((p) => {
              const items = (p.items ?? []).filter((i) => i.id !== itemId);
              if (items.length !== (p.items ?? []).length) removed = true;
              return items === p.items ? p : { ...p, items };
            });

            if (!removed) return cur;
            const next = { ...cur, pages };
            return updateHistoryTotal(next, -1);
          }
        );
      }

      if (!purchased && itemFromHistory) {
        const deltaAmount =
          Number(itemFromHistory.amount) * Number(itemFromHistory.price);

        qc.setQueryData<InfiniteData<ShoppingPendingPageApi>>(
          listsKeys.pendingInfinite(listId),
          (cur) => addToPendingFirstPage(cur, itemFromHistory, deltaAmount)
        );

        // Al restaurar: meter inmediatamente en pending para que suba el contador.
        // (la lista detalle ya no carga items; usamos el cache infinite de pendientes)
      }

      return { prevList, prevPending, prevHistory, prevHistoryMeta };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(listsKeys.list(listId), ctx.prevList);
      if (ctx?.prevPending)
        qc.setQueryData(listsKeys.pendingInfinite(listId), ctx.prevPending);
      if (ctx?.prevHistoryMeta)
        qc.setQueryData(listsKeys.historyMeta(listId), ctx.prevHistoryMeta);
      if (ctx?.prevHistory)
        qc.setQueryData(listsKeys.historyInfinite(listId), ctx.prevHistory);
    },
    onSuccess: async (data, vars) => {
      // Si se marcó como comprado, el item entra en history.
      // Si se deshace (purchased=false), el backend lo vuelve a incluir en el detalle.
      if (vars.purchased) {
        await qc.invalidateQueries({
          queryKey: listsKeys.historyInfiniteBase(listId),
        });
        await qc.invalidateQueries({
          queryKey: listsKeys.pendingInfiniteBase(listId),
        });
        await qc.invalidateQueries({ queryKey: ["inventory", "products"] });
        await qc.invalidateQueries({ queryKey: ["inventory", "movements"] });
      } else {
        // pending list comes from infinite query now
        await qc.invalidateQueries({
          queryKey: listsKeys.pendingInfiniteBase(listId),
        });
      }
    },
    onSettled: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: listsKeys.list(listId) }),
        qc.invalidateQueries({ queryKey: listsKeys.lists() }),
        qc.invalidateQueries({
          queryKey: listsKeys.pendingInfiniteBase(listId),
        }),
        qc.invalidateQueries({ queryKey: listsKeys.historyMeta(listId) }),
        qc.invalidateQueries({
          queryKey: listsKeys.historyInfiniteBase(listId),
        }),
        // El backend crea/elimina Expense al comprar/restaurar items.
        // Invalidamos el resumen para que el Dashboard muestre el total actualizado.
        qc.invalidateQueries({ queryKey: ["expenses", "summary"] }),
        // Y también el detalle/historial de gastos.
        qc.invalidateQueries({ queryKey: ["expenses", "history"] }),
        qc.invalidateQueries({ queryKey: ["expenses", "list"] }),
        qc.invalidateQueries({ queryKey: ["reports"] }),
      ]);
    },
  });
}

export function upsertItemInListDetail(
  detail: ShoppingListDetailApi,
  item: ShoppingItemApi
): ShoppingListDetailApi {
  const idx = detail.items.findIndex((i) => i.id === item.id);
  if (idx < 0) return { ...detail, items: [item, ...detail.items] };
  const items = detail.items.slice();
  items[idx] = item;
  return { ...detail, items };
}

export function removeItemFromListDetail(
  detail: ShoppingListDetailApi,
  itemId: string
): ShoppingListDetailApi {
  return { ...detail, items: detail.items.filter((i) => i.id !== itemId) };
}
