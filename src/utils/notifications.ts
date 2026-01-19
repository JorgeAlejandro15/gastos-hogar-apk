// File: src/utils/notifications.ts — Servicio central para gestionar notificaciones push y locales.

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type BackendPushTokenType = "fcm";

/**
 * Configura el comportamiento por defecto de las notificaciones
 * cuando la app está en primer plano.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos de notificaciones al usuario.
 * @returns {Promise<boolean>} true si se concedieron los permisos
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn(
      "Las notificaciones push solo funcionan en dispositivos físicos"
    );
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("No se concedieron permisos de notificación");
    return false;
  }

  return true;
}

/**
 * Obtiene el token nativo del proveedor de push del dispositivo.
 * - Android: token FCM
 * - iOS: token APNs (NO se usa en este proyecto por ahora)
 *
 * Nota: Para usar FCM puro necesitas un Development Build y Firebase bien configurado.
 */
export async function getFcmDevicePushToken(): Promise<string | null> {
  try {
    if (Platform.OS !== "android") return null;

    // Expo Go (Android) ya no soporta push remotas desde SDK 53.
    // En la práctica, para FCM también necesitarás un Development Build.
    if (Constants.appOwnership === "expo") {
      console.warn(
        "Push remotas no están soportadas en Expo Go (Android) desde SDK 53. " +
          "Usa un Development Build (expo-dev-client) para obtener token FCM."
      );
      return null;
    }

    if (!Device.isDevice) {
      console.warn("Las notificaciones push requieren un dispositivo físico");
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const token = await Notifications.getDevicePushTokenAsync();

    // Importante: en Expo, getDevicePushTokenAsync() devuelve type='android' (y data es el token FCM).
    // En algunos runtimes/versions puede aparecer como 'fcm'. Aceptamos ambos para compatibilidad.
    if (token.type !== "android" && token.type !== ("fcm" as any)) {
      console.warn(
        `Se esperaba token nativo Android (FCM) pero expo-notifications devolvió type='${token.type}'.`
      );
      // Aun así intentamos usar data si existe.
    }

    const value = String(token.data || "").trim();
    if (!value) return null;

    return value;
  } catch (error) {
    console.error("Error obteniendo DevicePushToken (FCM):", error);
    return null;
  }
}

/**
 * Devuelve el token que registraremos en el backend.
 * En este proyecto registramos SOLO tokens nativos via getDevicePushTokenAsync().
 * - Android: token FCM
 * - iOS: token APNs (no soportado por el backend todavía)
 */
export async function getBackendPushToken(): Promise<{
  token: string;
  tokenType: BackendPushTokenType;
} | null> {
  // Android: preferir FCM nativo
  if (Platform.OS === "android") {
    const fcm = await getFcmDevicePushToken();
    if (fcm) return { token: fcm, tokenType: "fcm" };

    // IMPORTANTE:
    // No hacemos fallback automático a ExpoPushToken en Android, porque:
    // - tu caso actual está fallando con 403 Forbidden
    // - el objetivo de esta estrategia es usar FCM puro
    return null;
  }

  // iOS/Web: sin ExpoPushToken (por requerimiento). Por ahora no registramos.
  return null;
}

/**
 * Configura el canal de notificaciones para Android.
 * En Android 8.0+ es necesario crear canales para las notificaciones.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Notificaciones de la app",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
    });
  }
}

/**
 * Programa una notificación local (útil para testing).
 * @param title Título de la notificación
 * @param body Cuerpo de la notificación
 * @param data Datos adicionales
 * @param seconds Segundos hasta que se muestre la notificación (0 = inmediato)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  seconds: number = 0
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger:
      seconds > 0
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
          }
        : null,
  });

  return notificationId;
}

/**
 * Cancela todas las notificaciones programadas.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Obtiene el tipo de dispositivo como string.
 */
export function getDeviceType(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

/**
 * Obtiene el nombre del dispositivo (puede requerir permisos adicionales).
 */
export async function getDeviceName(): Promise<string> {
  const modelName = Device.modelName || "Unknown Device";
  const osVersion = Device.osVersion || "";
  return `${modelName} (${Platform.OS} ${osVersion})`;
}

/**
 * Limpia el badge de notificaciones (el numerito rojo).
 */
export async function clearNotificationBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
