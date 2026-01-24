// File: src/screens/NotificationsScreen.tsx — Pantalla para visualizar el historial de notificaciones.

import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useNotificationsStore } from "@/stores/notificationsStore";
import type { AppNotification } from "@/types/notifications";

export function NotificationsScreen() {
  const { background, text, tint } = useThemeColors();

  const notifications = useNotificationsStore((s) => s.notifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationsStore((s) => s.deleteNotification);
  const clearAllNotifications = useNotificationsStore(
    (s) => s.clearAllNotifications
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Aquí podrías hacer un fetch del backend para sincronizar notificaciones
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNotificationPress = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const iconName = getIconForActionType(item.actionType);
    const iconColor = item.read ? String(text) + "66" : tint;

    return (
      <Pressable
        style={StyleSheet.flatten([
          styles.notificationCard,
          {
            backgroundColor: item.read
              ? String(background)
              : String(tint) + "0A",
            borderColor: String(text) + "11",
          },
        ])}
        onPress={() => handleNotificationPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Notificación: ${item.title}`}
        accessibilityHint={item.read ? "Ya leída" : "Sin leer"}
      >
        <View style={styles.notificationContent}>
          <Ionicons
            name={iconName}
            size={24}
            color={iconColor}
            style={styles.notificationIcon}
          />

          <View style={styles.notificationText}>
            <View style={styles.headerRow}>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.title, !item.read && styles.unreadTitle]}
              >
                {item.title}
              </ThemedText>
              {!item.read && <View style={styles.unreadDot} />}
            </View>

            <ThemedText style={styles.body} numberOfLines={2}>
              {item.body}
            </ThemedText>

            <ThemedText style={styles.timestamp}>
              {format(item.receivedAt, "d 'de' MMMM, HH:mm", { locale: es })}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => handleDeleteNotification(item.id)}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Eliminar notificación"
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={String(text) + "44"}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={String(text) + "33"}
      />
      <ThemedText style={styles.emptyText}>No tienes notificaciones</ThemedText>
      <ThemedText style={styles.emptySubtext}>
        Recibirás notificaciones cuando haya actividad en tu hogar
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Notificaciones</ThemedText>

          {notifications.length > 0 && (
            <View style={styles.headerActions}>
              <Pressable
                onPress={markAllAsRead}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Marcar todas como leídas"
              >
                <ThemedText
                  style={styles.headerButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Marcar leídas
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={clearAllNotifications}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Limpiar todas las notificaciones"
              >
                <ThemedText
                  style={[styles.headerButtonText, styles.dangerText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Limpiar
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* Lista de notificaciones */}
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            notifications.length === 0
              ? styles.emptyContentContainer
              : styles.listContent
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

/**
 * Retorna el nombre del ícono según el tipo de acción.
 */
function getIconForActionType(
  actionType?: string
): keyof typeof Ionicons.glyphMap {
  switch (actionType) {
    case "list_item_added":
    case "list_created":
      return "list";
    case "list_item_completed":
      return "checkmark-circle";
    case "list_item_deleted":
    case "list_deleted":
      return "trash";
    case "expense_added":
    case "expense_updated":
      return "cash";
    case "income_added":
      return "wallet";
    case "member_joined":
      return "person-add";
    case "member_left":
      return "person-remove";
    case "household_updated":
      return "home";
    default:
      return "notifications";
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, marginTop: -10 },
  container: { flex: 1 },
  header: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000011",
    gap: 10,
  },
  headerActions: {
    flexDirection: "row",
    width: "100%",
    alignSelf: "stretch",
    justifyContent: "space-between",
    gap: 8,
  },
  headerButton: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 15,
    opacity: 0.7,
  },
  dangerText: {
    color: "#FF3B30",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  notificationCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  notificationIcon: {
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
  },
  unreadTitle: {
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  body: {
    fontSize: 14,
    opacity: 0.75,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
});
