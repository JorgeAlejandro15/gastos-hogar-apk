// File: src/types/domain.ts — Tipos de dominio compartidos (User, Household, listas, productos, gastos, notificaciones).

export type Id = string;

export interface User {
  id: Id;
  email: string;
  displayName: string;
}

export interface Household {
  id: Id;
  name: string;
  currency: string; // Ej: "USD", "EUR"
}

export type ShoppingListVisibility = "shared" | "personal";

export interface ShoppingList {
  id: Id;
  householdId: Id;
  name: string;
  visibility: ShoppingListVisibility;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Product {
  id: Id;
  listId: Id;
  name: string;
  quantity?: string; // Ej: "2", "1kg" (texto libre)
  unitPrice?: number; // opcional
  isBought: boolean;
  boughtAt?: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type ExpenseCategory =
  | "groceries"
  | "utilities"
  | "rent"
  | "transport"
  | "health"
  | "other";

export interface Expense {
  id: Id;
  householdId: Id;
  createdByUserId: Id;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  occurredAt: string; // ISO
  createdAt: string; // ISO
}

export interface ExpenseSplit {
  userId: Id;
  amount: number;
}

export type AppNotificationType =
  | "expense_added"
  | "product_bought"
  | "list_shared"
  | "household_invite";

export interface AppNotification {
  id: Id;
  type: AppNotificationType;
  title: string;
  body: string;
  createdAt: string; // ISO
  readAt?: string | null;
}
