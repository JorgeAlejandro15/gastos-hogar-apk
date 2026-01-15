// File: src/components/notifications/NotificationDebugPanel.tsx
// Panel simple para demostrar notificación local + ver token.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { scheduleLocalNotification } from "@/utils/notifications";

export function NotificationDebugPanel() {
  const { text, tint } = useThemeColors();
  const token = useNotificationsStore((s) => s.expoPushToken);
  const isRegistered = useNotificationsStore((s) => s.isRegistered);
  const registerForPushNotifications = useNotificationsStore(
    (s) => s.registerForPushNotifications
  );

  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);

  const onRegister = async () => {
    await registerForPushNotifications();
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

      <ThemedText style={styles.tokenLabel}>Expo Push Token:</ThemedText>
      <ThemedText selectable style={styles.token}>
        {token || "(sin token aún)"}
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
