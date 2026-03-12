// File: src/providers/NotificationsProvider.tsx — Provider para inicializar el sistema de notificaciones.

import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useAuthStore } from "@/stores/authStore";
import { useNotificationsStore } from "@/stores/notificationsStore";

interface NotificationsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que inicializa el sistema de notificaciones cuando el usuario
 * está autenticado y pertenece a un hogar.
 *
 * Se debe envolver la aplicación con este provider en _layout.tsx
 */
export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);
  const isAuthenticated = !!user;

  const initialize = useNotificationsStore((s) => s.initialize);
  const registerForPushNotifications = useNotificationsStore(
    (s) => s.registerForPushNotifications
  );
  const cleanup = useNotificationsStore((s) => s.cleanup);
  const isRegistered = useNotificationsStore((s) => s.isRegistered);
  const syncMissed = useNotificationsStore((s) => s.syncMissed);

  useEffect(() => {
    // Inicializar listeners al montar el componente
    initialize();

    // Cleanup al desmontar
    return () => {
      cleanup();
    };
  }, []);

  // Re-sincronizar notificaciones perdidas al volver a foreground.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          syncMissed();
        }
        appStateRef.current = nextAppState;
      }
    );
    return () => subscription.remove();
  }, [syncMissed]);

  useEffect(() => {
    // Registrar token push cuando el usuario esté autenticado y tenga un hogar
    if (isAuthenticated && user && household && !isRegistered) {
      registerForPushNotifications()
        .then((success) => {
          if (success) {
            console.log("Token registrado exitosamente");
          } else {
            console.warn("No se pudo registrar el token");
          }
        })
        .catch((error) => {
          console.error("Error registrando token:", error);
        });
    }
  }, [isAuthenticated, user, household, isRegistered]);

  return <>{children}</>;
}
