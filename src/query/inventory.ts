// File: src/query/inventory.ts — Hooks React Query para inventario.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { inventoryApi } from "@/api/inventory-api";
import type {
  CreateInventoryProductDto,
  ListInventoryMovementsQuery,
  ListInventoryProductsQuery,
  RegisterInventoryMovementDto,
  UpdateInventoryProductDto,
} from "@/types/inventory";

export const inventoryKeys = {
  products: (q?: ListInventoryProductsQuery) =>
    [
      "inventory",
      "products",
      q?.search ?? null,
      q?.category ?? null,
      q?.location ?? null,
      q?.lowStock ?? null,
      q?.expired ?? null,
      q?.expiringSoon ?? null,
      q?.expiringWithinDays ?? null,
      q?.includeInactive ?? null,
      q?.offset ?? null,
      q?.limit ?? null,
      q?.sortBy ?? null,
      q?.order ?? null,
    ] as const,

  productsInfinite: (q?: Omit<ListInventoryProductsQuery, "offset">) =>
    [
      "inventory",
      "products",
      "infinite",
      q?.search ?? null,
      q?.category ?? null,
      q?.location ?? null,
      q?.lowStock ?? null,
      q?.expired ?? null,
      q?.expiringSoon ?? null,
      q?.expiringWithinDays ?? null,
      q?.includeInactive ?? null,
      q?.limit ?? null,
      q?.sortBy ?? null,
      q?.order ?? null,
    ] as const,

  product: (productId: string) => ["inventory", "product", productId] as const,

  movements: (q?: ListInventoryMovementsQuery) =>
    [
      "inventory",
      "movements",
      q?.productId ?? null,
      q?.movementType ?? null,
      q?.from ?? null,
      q?.to ?? null,
      q?.offset ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,

  movementsInfinite: (q?: Omit<ListInventoryMovementsQuery, "offset">) =>
    [
      "inventory",
      "movements",
      "infinite",
      q?.productId ?? null,
      q?.movementType ?? null,
      q?.from ?? null,
      q?.to ?? null,
      q?.limit ?? null,
      q?.order ?? null,
    ] as const,
};

function getNextOffset(pages: { total: number; items: unknown[] }[]) {
  const total = pages[0]?.total ?? 0;
  const loaded = pages.reduce((sum, p) => sum + (p.items?.length ?? 0), 0);
  return loaded < total ? loaded : undefined;
}

export function useInventoryProductsInfiniteQuery(
  q?: Omit<ListInventoryProductsQuery, "offset">,
  enabled: boolean = true
) {
  const limit = q?.limit ?? 30;

  return useInfiniteQuery({
    queryKey: inventoryKeys.productsInfinite(q),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      inventoryApi.listProducts({
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

export function useInventoryProductQuery(
  productId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: inventoryKeys.product(productId),
    queryFn: () => inventoryApi.getProduct(productId),
    enabled: !!productId && enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  });
}

export function useInventoryMovementsInfiniteQuery(
  q?: Omit<ListInventoryMovementsQuery, "offset">,
  enabled: boolean = true
) {
  const limit = q?.limit ?? 40;

  return useInfiniteQuery({
    queryKey: inventoryKeys.movementsInfinite(q),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      inventoryApi.listMovements({
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

export function useCreateInventoryProductMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInventoryProductDto) =>
      inventoryApi.createProduct(dto),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["inventory", "products"] }),
        qc.invalidateQueries({ queryKey: ["inventory", "movements"] }),
      ]);
    },
  });
}

export function useUpdateInventoryProductMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      dto,
    }: {
      productId: string;
      dto: UpdateInventoryProductDto;
    }) => inventoryApi.updateProduct(productId, dto),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["inventory", "products"] }),
        qc.invalidateQueries({
          queryKey: inventoryKeys.product(vars.productId),
        }),
      ]);
    },
  });
}

export function useDeleteInventoryProductMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => inventoryApi.deleteProduct(productId),
    onSuccess: async (_data, productId) => {
      qc.removeQueries({ queryKey: inventoryKeys.product(productId) });

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["inventory", "products"] }),
        qc.invalidateQueries({ queryKey: ["inventory", "movements"] }),
      ]);
    },
  });
}

export function useRegisterInventoryMovementMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      dto,
    }: {
      productId: string;
      dto: RegisterInventoryMovementDto;
    }) => inventoryApi.registerMovement(productId, dto),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["inventory", "products"] }),
        qc.invalidateQueries({
          queryKey: inventoryKeys.product(vars.productId),
        }),
        qc.invalidateQueries({ queryKey: ["inventory", "movements"] }),
      ]);
    },
  });
}
