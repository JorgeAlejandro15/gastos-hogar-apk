// File: app/notifications.tsx — Ruta para la pantalla de notificaciones.

import React from "react";

import { NotificationsScreen } from "@/screens/NotificationsScreen";
import { ThemedView } from "@/components/themed-view";
import { CustomStackHeader } from "@/components/navigation/CustomStackHeader";

export default function NotificationsRoute() {
  return (
      <ThemedView style={{ flex: 1 }}>
        <CustomStackHeader title="Notificaciones" />
        <NotificationsScreen />
      </ThemedView>
  );
}
