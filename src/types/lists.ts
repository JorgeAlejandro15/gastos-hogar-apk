// File: src/types/lists.ts — Tipos para el módulo de listas (alineados con backend NestJS /lists).

export type ListScope = "shared" | "personal";

export interface ApiUserRef {
  id: string;
  email?: string;
  displayName?: string;
}

export interface ShoppingListApi {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  owner?: ApiUserRef | null;
  createdBy?: ApiUserRef;
}

export interface ShoppingItemApi {
  id: string;
  name: string;
  amount: number; // cantidad
  price: number; // precio unitario
  category?: string | null;
  purchased: boolean;
  purchasedAt?: string | null;
  purchasedBy?: ApiUserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingHistoryPageApi {
  items: ShoppingItemApi[];
  nextCursor: string | null;
  total: number;
  totalAmount?: number;
}

export interface ShoppingPendingPageApi {
  items: ShoppingItemApi[];
  nextCursor: string | null;
  total: number;
  totalAmount: number;
}

export interface ShoppingListDetailApi extends ShoppingListApi {
  // Nota: el backend filtra purchased=true en el detalle (lista “activa”).
  items: ShoppingItemApi[];
}

export interface CreateListDto {
  name: string;
  scope?: ListScope;
}

export interface UpdateListDto {
  name?: string;
}

export interface CreateItemDto {
  name: string;
  amount: number;
  price: number;
  category?: string;
}

export interface UpdateItemDto {
  name?: string;
  amount?: number;
  price?: number;
  category?: string;
}

export interface SetPurchasedDto {
  purchased: boolean;
}

export function getListScope(list: ShoppingListApi): ListScope {
  return list.owner ? "personal" : "shared";
}

export function itemTotal(
  item: Pick<ShoppingItemApi, "amount" | "price">
): number {
  const amount = Number(item.amount);
  const price = Number(item.price);
  if (!Number.isFinite(amount) || !Number.isFinite(price)) return 0;
  return Number((amount * price).toFixed(2));
}
