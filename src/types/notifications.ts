// File: src/types/notifications.ts — Tipos TypeScript para el sistema de notificaciones.

/**
 * Tipos de acciones que generan notificaciones en la app
 */
export enum NotificationActionType {
  // Listas
  LIST_ITEM_ADDED = "list_item_added",
  LIST_ITEM_COMPLETED = "list_item_completed",
  LIST_ITEM_DELETED = "list_item_deleted",
  LIST_CREATED = "list_created",
  LIST_UPDATED = "list_updated",
  LIST_DELETED = "list_deleted",

  // Gastos
  EXPENSE_ADDED = "expense_added",
  EXPENSE_UPDATED = "expense_updated",
  EXPENSE_DELETED = "expense_deleted",

  // Hogar
  MEMBER_JOINED = "member_joined",
  MEMBER_LEFT = "member_left",
  HOUSEHOLD_UPDATED = "household_updated",

  // Ingresos
  INCOME_ADDED = "income_added",
  INCOME_UPDATED = "income_updated",
  INCOME_DELETED = "income_deleted",

  // Otros
  GENERIC = "generic",
}

/**
 * Estructura de datos de una notificación almacenada
 */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: NotificationData;
  receivedAt: number; // timestamp
  read: boolean;
  actionType?: NotificationActionType;

  /**
   * Agrupación/deduplicación (frontend):
   * cuando varias acciones similares ocurren sobre la misma lista y mismo actor,
   * las agrupamos en una sola notificación incrementando count.
   */
  groupKey?: string;
  count?: number;
  lastItemName?: string;
}

/**
 * Datos adicionales que puede contener una notificación
 */
export interface NotificationData {
  actionType?: NotificationActionType;
  // En backend (NestJS) los IDs son UUID string.
  householdId?: string | number;
  listId?: string | number;
  expenseId?: string | number;
  incomeId?: string | number;
  userId?: string | number;
  userName?: string;
  itemName?: string;
  [key: string]: any;
}

/**
 * Request para registrar un token de notificación push en el backend
 */
export interface RegisterPushTokenRequest {
  token: string;
  deviceType: "ios" | "android" | "web";
  deviceName?: string;
}

/**
 * Response del backend al registrar un token
 */
export interface RegisterPushTokenResponse {
  success: boolean;
  tokenId?: number;
  message?: string;
}

/**
 * Request para enviar una notificación desde el backend
 */
export interface SendNotificationRequest {
  householdId: number;
  title: string;
  body: string;
  data?: NotificationData;
  excludeUserId?: number; // Para no notificar al usuario que hizo la acción
}
