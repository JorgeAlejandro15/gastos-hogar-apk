// File: src/api/notifications-api.ts — API client para registrar tokens y obtener notificaciones del backend.

import type {
  RegisterPushTokenRequest,
  RegisterPushTokenResponse,
  SendNotificationRequest,
  SendNotificationResponse,
} from "@/types/notifications";

import { api } from "./api";

/**
 * Registra un token de notificación push en el backend.
 * @param data Token y metadatos del dispositivo
 */
export async function registerPushToken(
  data: RegisterPushTokenRequest
): Promise<RegisterPushTokenResponse> {
  const response = await api.post<RegisterPushTokenResponse>(
    "/notifications/register-token",
    data
  );
  return response.data;
}

/**
 * Elimina un token de notificación del backend (logout o desactivación).
 * @param token El token a eliminar
 */
export async function removePushToken(token: string): Promise<void> {
  await api.delete(`/notifications/token/${encodeURIComponent(token)}`);
}

/**
 * Obtiene el historial de notificaciones del usuario actual.
 * (Opcional: si el backend guarda historial de notificaciones enviadas)
 */
export async function getNotificationHistory(): Promise<any[]> {
  const response = await api.get<any[]>("/notifications/history");
  return response.data;
}

/**
 * Marca una notificación como leída en el backend.
 * @param notificationId ID de la notificación
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

/**
 * Envía una notificación a todos los miembros de un hogar (solo para testing o admin).
 * En producción, el backend debería enviar notificaciones automáticamente
 * cuando ocurran eventos relevantes.
 * @param data Datos de la notificación
 */
export async function sendNotificationToHousehold(
  data: SendNotificationRequest
): Promise<SendNotificationResponse> {
  const response = await api.post<SendNotificationResponse>(
    "/notifications/send",
    data
  );
  return response.data;
}

/**
 * Actualiza las preferencias de notificación del usuario.
 * @param preferences Preferencias de notificación
 */
export async function updateNotificationPreferences(preferences: {
  enablePush: boolean;
  enableEmail?: boolean;
  notifyOnListChanges?: boolean;
  notifyOnExpenses?: boolean;
  notifyOnIncome?: boolean;
}): Promise<void> {
  await api.patch("/notifications/preferences", preferences);
}

/**
 * Obtiene las preferencias de notificación del usuario.
 */
export async function getNotificationPreferences(): Promise<any> {
  const response = await api.get("/notifications/preferences");
  return response.data;
}
