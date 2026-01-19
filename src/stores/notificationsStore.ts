// File: src/stores/notificationsStore.ts — Zustand store para gestionar el estado de notificaciones.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { registerPushToken, removePushToken } from "@/api/notifications-api";
import type {
  AppNotification,
  NotificationActionType,
} from "@/types/notifications";
import {
  clearNotificationBadge,
  getBackendPushToken,
  getDeviceName,
  getDeviceType,
  setupNotificationChannel,
} from "@/utils/notifications";

interface NotificationsState {
  // Estado
  notifications: AppNotification[];
  expoPushToken: string | null;
  pushTokenType: "fcm" | null;
  isRegistered: boolean;
  unreadCount: number;

  // Listeners
  notificationListener: Notifications.Subscription | null;
  responseListener: Notifications.Subscription | null;

  // Acciones
  initialize: () => Promise<void>;
  cleanup: () => void;
  registerForPushNotifications: () => Promise<boolean>;
  unregisterPushToken: () => Promise<void>;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  getUnreadNotifications: () => AppNotification[];
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      notifications: [],
      expoPushToken: null,
      pushTokenType: null,
      isRegistered: false,
      unreadCount: 0,
      notificationListener: null,
      responseListener: null,

      /**
       * Inicializa el sistema de notificaciones.
       * Configura listeners y canal de Android.
       */
      initialize: async () => {
        try {
          // Configurar canal de Android
          await setupNotificationChannel();

          // Listener: cuando llega una notificación
          const notificationListener =
            Notifications.addNotificationReceivedListener((notification) => {
              const { title, body, data } = notification.request.content;

              const appNotification: AppNotification = {
                id: notification.request.identifier,
                title: title || "Nueva notificación",
                body: body || "",
                data: data as any,
                receivedAt: Date.now(),
                read: false,
                actionType: data?.actionType as NotificationActionType,
              };

              get().addNotification(appNotification);
            });

          // Listener: cuando el usuario toca una notificación
          const responseListener =
            Notifications.addNotificationResponseReceivedListener(
              (response) => {
                const notificationId = response.notification.request.identifier;

                // Marcar como leída
                get().markAsRead(notificationId);

                // Aquí puedes navegar a una pantalla específica según el tipo de notificación
                const data = response.notification.request.content.data;
                console.log("Usuario tocó notificación:", data);

                // TODO: Implementar navegación según actionType
              }
            );

          set({
            notificationListener,
            responseListener,
          });

          console.log("Sistema de notificaciones inicializado");
        } catch (error) {
          console.error("Error inicializando notificaciones:", error);
        }
      },

      /**
       * Limpia los listeners de notificaciones (logout).
       */
      cleanup: () => {
        const { notificationListener, responseListener } = get();

        if (notificationListener) {
          notificationListener.remove();
        }

        if (responseListener) {
          responseListener.remove();
        }

        set({
          notificationListener: null,
          responseListener: null,
        });

        console.log("Listeners de notificaciones eliminados");
      },

      /**
       * Registra el dispositivo para recibir notificaciones push.
       * Obtiene el token y lo envía al backend.
       */
      registerForPushNotifications: async () => {
        try {
          const result = await getBackendPushToken();
          if (!result?.token) {
            console.warn("No se pudo obtener el token de notificación");
            return false;
          }

          const token = result.token;
          const tokenType = result.tokenType;

          const deviceType = getDeviceType();
          const deviceName = await getDeviceName();

          // Registrar token en el backend
          const response = await registerPushToken({
            token,
            tokenType,
            deviceType,
            deviceName,
          });

          if (response.success) {
            set({
              expoPushToken: token,
              pushTokenType: tokenType,
              isRegistered: true,
            });

            console.log("Token registrado exitosamente:", token);
            return true;
          } else {
            console.error("Error registrando token:", response.message);
            return false;
          }
        } catch (error) {
          console.error("Error en registerForPushNotifications:", error);
          return false;
        }
      },

      /**
       * Elimina el token de notificación del backend (logout).
       */
      unregisterPushToken: async () => {
        const { expoPushToken } = get();
        if (!expoPushToken) return;

        try {
          await removePushToken(expoPushToken);
          set({
            expoPushToken: null,
            pushTokenType: null,
            isRegistered: false,
          });

          console.log("Token eliminado del backend");
        } catch (error) {
          console.error("Error eliminando token:", error);
        }
      },

      /**
       * Añade una notificación al historial y actualiza el contador.
       */
      addNotification: (notification) => {
        const now = Date.now();
        const data = (notification.data ?? {}) as any;

        const actionType =
          (notification.actionType as any) ?? (data.actionType as any);
        const listId = data.listId;
        const userId = data.userId;
        const userName = data.userName;
        const itemName = data.itemName;

        const isListEvent =
          actionType === "list_item_added" ||
          actionType === "list_item_completed" ||
          actionType === "list_item_deleted";

        const canAggregate = Boolean(
          isListEvent && listId != null && userId != null
        );

        const groupKey = canAggregate
          ? `${String(actionType)}:${String(listId)}:${String(userId)}`
          : undefined;

        const AGG_WINDOW_MS = 2 * 60 * 1000; // 2 min

        set((state) => {
          if (groupKey) {
            const idx = state.notifications.findIndex((n) => {
              if (n.read) return false;
              if (n.groupKey !== groupKey) return false;
              return now - n.receivedAt <= AGG_WINDOW_MS;
            });

            if (idx >= 0) {
              const existing = state.notifications[idx];
              const nextCount = (existing.count ?? 1) + 1;
              const lastItem =
                (itemName as string | undefined) ?? existing.lastItemName;
              const mergedBody = buildAggregatedBody(
                String(actionType),
                String(userName ?? ""),
                nextCount,
                lastItem
              );

              const merged: AppNotification = {
                ...existing,
                title: existing.title || notification.title,
                body: mergedBody,
                data: {
                  ...(existing.data ?? {}),
                  ...(notification.data ?? {}),
                  itemName: lastItem,
                },
                receivedAt: now,
                read: false,
                actionType: actionType,
                groupKey,
                count: nextCount,
                lastItemName: lastItem,
              };

              const next = [...state.notifications];
              next.splice(idx, 1);
              next.unshift(merged);

              // No incrementamos unreadCount porque ya estaba sin leer
              return {
                notifications: next,
                unreadCount: state.unreadCount,
              };
            }
          }

          const initial: AppNotification = {
            ...notification,
            groupKey,
            count: groupKey ? 1 : notification.count,
            lastItemName: groupKey
              ? (itemName as any)
              : notification.lastItemName,
            receivedAt: now,
          };

          return {
            notifications: [initial, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          };
        });
      },

      /**
       * Marca una notificación como leída.
       */
      markAsRead: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          );

          const unreadCount = notifications.filter((n) => !n.read).length;

          // Limpiar badge si no hay no leídas
          if (unreadCount === 0) {
            clearNotificationBadge();
          }

          return { notifications, unreadCount };
        });
      },

      /**
       * Marca todas las notificaciones como leídas.
       */
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));

        clearNotificationBadge();
      },

      /**
       * Elimina una notificación del historial.
       */
      deleteNotification: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.filter(
            (n) => n.id !== notificationId
          );
          const unreadCount = notifications.filter((n) => !n.read).length;

          return { notifications, unreadCount };
        });
      },

      /**
       * Limpia todas las notificaciones del historial.
       */
      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });

        clearNotificationBadge();
      },

      /**
       * Obtiene solo las notificaciones no leídas.
       */
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },
    }),
    {
      name: "notifications-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // No persitir listeners
      partialize: (state) => ({
        notifications: state.notifications,
        expoPushToken: state.expoPushToken,
        pushTokenType: state.pushTokenType,
        isRegistered: state.isRegistered,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

function buildAggregatedBody(
  actionType: string,
  userName: string,
  count: number,
  itemName?: string
): string {
  const who = userName?.trim() || "Alguien";

  const itemPart = itemName ? `\"${itemName}\"` : "ítems";

  switch (actionType) {
    case "list_item_added":
      return count <= 1
        ? `${who} añadió ${itemPart}`
        : `${who} añadió ${count} ítems`;
    case "list_item_completed":
      return count <= 1
        ? `${who} marcó ${itemPart} como comprado`
        : `${who} marcó ${count} ítems como comprados`;
    case "list_item_deleted":
      return count <= 1
        ? `${who} eliminó ${itemPart}`
        : `${who} eliminó ${count} ítems`;
    default:
      return `${who} realizó ${count} acciones`;
  }
}
