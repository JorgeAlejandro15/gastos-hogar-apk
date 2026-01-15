// File: app/lists/[listId].tsx — Ruta (Expo Router) para el detalle de una lista.

import { Stack } from "expo-router";

import { ListDetailScreen } from "@/screens/lists/ListDetailScreen";

export default function ListDetailRoute() {
  return (
    <>
      {/* Usamos header propio dentro del screen */}
      <Stack.Screen options={{ headerShown: false }} />
      <ListDetailScreen />
    </>
  );
}
