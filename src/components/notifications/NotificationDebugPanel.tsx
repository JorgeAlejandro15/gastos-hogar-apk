// File: src/components/notifications/NotificationDebugPanel.tsx
// Panel simple para demostrar notificación local + ver token.

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { getApiErrorMessage } from "@/api/api";
import { sendNotificationToHousehold } from "@/api/notifications-api";
import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationsStore } from "@/stores/notificationsStore";
import type { SendNotificationResponse } from "@/types/notifications";
import { NotificationActionType } from "@/types/notifications";
import { scheduleLocalNotification } from "@/utils/notifications";

export function NotificationDebugPanel() {
  const { text, tint } = useThemeColors();
  const token = useNotificationsStore((s) => s.expoPushToken);
  const tokenType = useNotificationsStore((s) => s.pushTokenType);
  const isRegistered = useNotificationsStore((s) => s.isRegistered);
  const registerForPushNotifications = useNotificationsStore(
    (s) => s.registerForPushNotifications
  );

  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);

  const [devicePushToken, setDevicePushToken] = React.useState<{
    type: string;
    data: string;
  } | null>(null);
  const [devicePushTokenError, setDevicePushTokenError] = React.useState<
    string | null
  >(null);

  const [remoteSendLoading, setRemoteSendLoading] = React.useState(false);
  const [remoteSendResponse, setRemoteSendResponse] =
    React.useState<SendNotificationResponse | null>(null);
  const [remoteSendError, setRemoteSendError] = React.useState<string | null>(
    null
  );

  const refreshDevicePushToken = React.useCallback(async () => {
    try {
      setDevicePushTokenError(null);
      const t = await Notifications.getDevicePushTokenAsync();
      setDevicePushToken({ type: String(t.type), data: String(t.data) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setDevicePushToken(null);
      setDevicePushTokenError(msg);
    }
  }, []);

  React.useEffect(() => {
    // Best-effort: for diagnosis, fetch device token once when opening the panel.
    refreshDevicePushToken();
  }, [refreshDevicePushToken]);

  const onRegister = async () => {
    await registerForPushNotifications();
    // After registration attempt, refresh the raw device token values too.
    refreshDevicePushToken();
  };

  const onTestLocal = async () => {
    const who = user?.displayName || "Alguien";
    const home = household?.name || "tu hogar";

    await scheduleLocalNotification(
      "Actividad en lista compartida",
      `${who} agregó un ítem a la lista de ${home}`,
      {
        actionType: "list_item_added",
        householdId: household?.id,
        userId: user?.id,
        userName: who,
      },
      0
    );
  };

  const onTestRemote = async () => {
    try {
      setRemoteSendLoading(true);
      setRemoteSendError(null);

      if (!household?.id) {
        setRemoteSendError("No hay household.id en sesión");
        return;
      }

      const who = user?.displayName || "Alguien";
      const home = household?.name || "tu hogar";

      const payload = {
        householdId: String(household.id),
        title: "Push remota (test)",
        body: `${who} agregó un ítem a la lista de ${home}`,
        data: {
          actionType: NotificationActionType.LIST_ITEM_ADDED,
          listId: "debug",
          userName: who,
          itemName: "Ítem de prueba",
        },
      };

      const res = await sendNotificationToHousehold(payload);
      setRemoteSendResponse(res);

      // Esto debe verse en la consola (Metro / VS Code Debug Console según tu setup).
      console.log(
        "Respuesta /notifications/send (diagnóstico):\n" +
          JSON.stringify(res, null, 2)
      );
    } catch (e) {
      const msg = getApiErrorMessage(e);
      setRemoteSendError(msg);
      console.log("Error llamando /notifications/send:", msg);
    } finally {
      setRemoteSendLoading(false);
    }
  };

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        { borderColor: String(text) + "22" },
      ])}
      accessibilityRole="summary"
      accessibilityLabel="Panel de depuración de notificaciones"
    >
      <ThemedText type="defaultSemiBold">Notificaciones (Debug)</ThemedText>
      <ThemedText style={styles.muted}>
        Estado: {isRegistered ? "registrado" : "no registrado"}
      </ThemedText>

      <View style={styles.row}>
        <Pressable
          onPress={onRegister}
          style={StyleSheet.flatten([
            styles.button,
            { borderColor: String(tint) + "55" },
          ])}
          accessibilityRole="button"
          accessibilityLabel="Registrar token de notificación"
        >
          <ThemedText type="defaultSemiBold">Registrar token</ThemedText>
        </Pressable>

        <Pressable
          onPress={onTestLocal}
          style={StyleSheet.flatten([
            styles.button,
            { borderColor: String(tint) + "55" },
          ])}
          accessibilityRole="button"
          accessibilityLabel="Disparar notificación local de prueba"
        >
          <ThemedText type="defaultSemiBold">Probar local</ThemedText>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={onTestRemote}
          disabled={remoteSendLoading}
          style={StyleSheet.flatten([
            styles.button,
            {
              borderColor: String(tint) + "55",
              opacity: remoteSendLoading ? 0.6 : 1,
            },
          ])}
          accessibilityRole="button"
          accessibilityLabel="Enviar push remota via backend (testing)"
        >
          <ThemedText type="defaultSemiBold">
            {remoteSendLoading ? "Enviando…" : "Probar push remota"}
          </ThemedText>
        </Pressable>
      </View>

      {remoteSendError ? (
        <ThemedText style={styles.muted}>
          Remote send error: {remoteSendError}
        </ThemedText>
      ) : null}

      {remoteSendResponse ? (
        <>
          <ThemedText style={styles.tokenLabel}>
            /notifications/send result:
          </ThemedText>
          <ThemedText selectable style={styles.token}>
            {JSON.stringify(remoteSendResponse.result, null, 2)}
          </ThemedText>
        </>
      ) : null}

      <ThemedText style={styles.tokenLabel}>
        Push Token ({tokenType || "sin tipo"}):
      </ThemedText>
      <ThemedText selectable style={styles.token}>
        {token || "(sin token aún)"}
      </ThemedText>

      <View style={styles.row}>
        <Pressable
          onPress={refreshDevicePushToken}
          style={StyleSheet.flatten([
            styles.button,
            { borderColor: String(tint) + "55" },
          ])}
          accessibilityRole="button"
          accessibilityLabel="Refrescar token nativo del dispositivo"
        >
          <ThemedText type="defaultSemiBold">Ver token nativo</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={styles.tokenLabel}>DevicePushToken.type:</ThemedText>
      <ThemedText selectable style={styles.token}>
        {devicePushToken?.type || "(sin datos)"}
      </ThemedText>

      <ThemedText style={styles.tokenLabel}>DevicePushToken.data:</ThemedText>
      <ThemedText selectable style={styles.token}>
        {devicePushToken?.data || "(sin datos)"}
      </ThemedText>

      {devicePushTokenError ? (
        <ThemedText style={styles.muted}>
          Error leyendo token nativo: {devicePushTokenError}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.muted}>
        Entorno: {Platform.OS} • isDevice={String(Device.isDevice)} • ownership=
        {String(Constants.appOwnership || "unknown")}
      </ThemedText>

      <ThemedText style={styles.muted}>
        Nota: el token push real requiere dispositivo físico y (en Android) no
        funciona en Expo Go desde SDK 53; usa un Development Build.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 16,
  },
  tokenLabel: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
  },
  token: {
    fontSize: 12,
    lineHeight: 16,
  },
});
