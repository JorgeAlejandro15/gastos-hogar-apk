// File: app/expenses/shared.tsx — Ruta para gastos compartidos.

import { Stack } from "expo-router";

import { CustomStackHeader } from "@/components/navigation/CustomStackHeader";
import { ThemedView } from "@/components/themed-view";
import { SharedExpensesScreen } from "@/screens/expenses/SharedExpensesScreen";

export default function SharedExpensesRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={{ flex: 1 }}>
        <CustomStackHeader title="Compartido" />
        <SharedExpensesScreen />
      </ThemedView>
    </>
  );
}
