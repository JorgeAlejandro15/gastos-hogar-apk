// File: src/utils/notifications.ts — Servicio central para gestionar notificaciones push y locales.

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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
 * Obtiene el token de Expo Push Notifications (ExpoPushToken).
 * Este token se debe registrar en el backend para poder enviar notificaciones.
 * @returns {Promise<string | null>} El token o null si falla
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Expo Go (Android) ya no soporta push remotas desde SDK 53.
    // En ese runtime, pedir ExpoPushToken fallará; hay que usar un Development Build.
    if (Platform.OS === "android" && Constants.appOwnership === "expo") {
      console.warn(
        "Push remotas no están soportadas en Expo Go (Android) desde SDK 53. " +
          "Usa un Development Build (expo-dev-client) para obtener Expo Push Token."
      );
      return null;
    }

    if (!Device.isDevice) {
      console.warn("Las notificaciones push requieren un dispositivo físico");
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    type ExpoExtra = { eas?: { projectId?: string } };
    const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;

    // Prefer easConfig when available, but fall back to app.json extra.
    const projectId =
      Constants.easConfig?.projectId ??
      extra?.eas?.projectId ??
      // Extra fallback for edge cases (dev build / manifest differences)
      (Constants as unknown as { manifest2?: { extra?: ExpoExtra } })?.manifest2
        ?.extra?.eas?.projectId;

    if (!projectId || projectId === "REPLACE_WITH_YOUR_EAS_PROJECT_ID") {
      console.warn(
        "No se encontró projectId. Para obtener Expo Push Token necesitas configurar expo.extra.eas.projectId (ver app.json) y rebuild con EAS."
      );
      return null;
    }

    try {
      // Obtener el token de Expo
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      return tokenData.data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);

      const isFirebaseNotInitialized =
        msg.includes("FirebaseApp is not initialized") ||
        msg.includes("Default FirebaseApp is not initialized");
      if (isFirebaseNotInitialized) {
        console.warn(
          "Firebase/FCM no está configurado en este build de Android. " +
            "Para obtener Expo Push Token necesitas: (1) crear una app Android en Firebase con el package 'com.expenseapk.app', " +
            "(2) descargar 'google-services.json' y colocarlo en la raíz de 'expense_apk/', " +
            "(3) asegurar que app.json tenga android.googleServicesFile='./google-services.json' (ya está), " +
            "(4) rebuild e instalar de nuevo el Development Build con EAS."
        );
        console.error("Error obteniendo Expo Push Token:", error);
        return null;
      }

      const isServiceNotAvailable = msg.includes("SERVICE_NOT_AVAILABLE");
      if (isServiceNotAvailable) {
        const delay = (ms: number) =>
          new Promise<void>((resolve) => setTimeout(resolve, ms));

        // Error típico de FCM en Android: suele ser temporal (red/Play Services).
        // Reintentamos un par de veces antes de rendirnos.
        const delays = [750, 1500, 3000];
        for (const ms of delays) {
          try {
            await delay(ms);
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId,
            });
            return tokenData.data;
          } catch {
            // seguimos reintentando
          }
        }

        console.warn(
          "No se pudo obtener el token porque FCM devolvió SERVICE_NOT_AVAILABLE. " +
            "Esto casi siempre es por Google Play Services o conectividad. Prueba: " +
            "(1) confirmar que el teléfono tiene Google Play Services/Play Store (no Huawei sin GMS), " +
            "(2) actualizar Google Play Services y reiniciar el móvil, " +
            "(3) activar fecha/hora automáticas, " +
            "(4) cambiar de Wi‑Fi a datos móviles (o desactivar VPN/Private DNS/adblock), " +
            "(5) desactivar ahorro de batería para la app."
        );

        console.error("Error obteniendo Expo Push Token:", error);
        return null;
      }

      // En Expo Go a veces el endpoint puede devolver 403 por bloqueo/red/portal cautivo,
      // o porque el proxy del dev server intercepta la ruta /--/api.
      // Hacemos un retry sin projectId (permitiendo inferencia del manifest) como workaround.
      const is403 =
        msg.includes(" 403") ||
        msg.includes("403") ||
        msg.includes("Forbidden");
      if (is403) {
        console.warn(
          "Expo Push Token devolvió 403 Forbidden. Suele ser por VPN/Private DNS/adblock/red corporativa o portal cautivo. " +
            "Prueba: (1) desactivar VPN/Private DNS/adblock, (2) cambiar a datos móviles u otra Wi‑Fi, (3) reiniciar Expo Go, " +
            "(4) iniciar el bundler en modo tunnel."
        );

        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          return tokenData.data;
        } catch (retryError) {
          console.error(
            "Error obteniendo Expo Push Token (retry sin projectId):",
            retryError
          );
          return null;
        }
      }

      console.error("Error obteniendo Expo Push Token:", error);
      return null;
    }
  } catch (error) {
    console.error("Error obteniendo Expo Push Token:", error);
    return null;
  }
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
