// File: src/api/lists-api.ts — Cliente REST para listas y items (backend NestJS /lists).

import { api } from "@/api/api";
import type {
  CreateItemDto,
  CreateListDto,
  SetPurchasedDto,
  ShoppingHistoryPageApi,
  ShoppingItemApi,
  ShoppingListApi,
  ShoppingListDetailApi,
  ShoppingPendingPageApi,
  UpdateItemDto,
  UpdateListDto,
} from "@/types/lists";

export const listsApi = {
  async getLists(): Promise<ShoppingListApi[]> {
    const { data } = await api.get<ShoppingListApi[]>("/lists");
    return data;
  },

  async createList(dto: CreateListDto): Promise<ShoppingListApi> {
    const { data } = await api.post<ShoppingListApi>("/lists", dto);
    return data;
  },

  async getList(listId: string): Promise<ShoppingListDetailApi> {
    const { data } = await api.get<ShoppingListDetailApi>(`/lists/${listId}`);
    return data;
  },

  async updateList(
    listId: string,
    dto: UpdateListDto
  ): Promise<ShoppingListApi> {
    const { data } = await api.patch<ShoppingListApi>(`/lists/${listId}`, dto);
    return data;
  },

  async deleteList(listId: string): Promise<{ ok: true } | { ok: boolean }> {
    const { data } = await api.delete<{ ok: true } | { ok: boolean }>(
      `/lists/${listId}`
    );
    return data;
  },

  async getHistoryPage(
    listId: string,
    input?: {
      from?: string;
      to?: string;
      limit?: number;
      cursor?: string | null;
    }
  ): Promise<ShoppingHistoryPageApi> {
    const { data } = await api.get<ShoppingHistoryPageApi>(
      `/lists/${listId}/history`,
      {
        params: {
          from: input?.from,
          to: input?.to,
          limit: input?.limit,
          cursor: input?.cursor ?? undefined,
        },
      }
    );
    return data;
  },

  async getPendingPage(
    listId: string,
    input?: { limit?: number; cursor?: string | null }
  ): Promise<ShoppingPendingPageApi> {
    const { data } = await api.get<ShoppingPendingPageApi>(
      `/lists/${listId}/items`,
      {
        params: {
          limit: input?.limit,
          cursor: input?.cursor ?? undefined,
        },
      }
    );
    return data;
  },

  async addItem(listId: string, dto: CreateItemDto): Promise<ShoppingItemApi> {
    const { data } = await api.post<ShoppingItemApi>(
      `/lists/${listId}/items`,
      dto
    );
    return data;
  },

  async updateItem(
    listId: string,
    itemId: string,
    dto: UpdateItemDto
  ): Promise<ShoppingItemApi> {
    const { data } = await api.patch<ShoppingItemApi>(
      `/lists/${listId}/items/${itemId}`,
      dto
    );
    return data;
  },

  async deleteItem(
    listId: string,
    itemId: string
  ): Promise<{ ok: true } | { ok: boolean }> {
    const { data } = await api.delete<{ ok: true } | { ok: boolean }>(
      `/lists/${listId}/items/${itemId}`
    );
    return data;
  },

  async setPurchased(
    listId: string,
    itemId: string,
    dto: SetPurchasedDto
  ): Promise<ShoppingItemApi> {
    const { data } = await api.post<ShoppingItemApi>(
      `/lists/${listId}/items/${itemId}/purchase`,
      dto
    );
    return data;
  },
};
