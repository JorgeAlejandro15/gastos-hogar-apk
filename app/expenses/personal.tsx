// File: app/expenses/personal.tsx — Ruta para gastos personales.

import { Stack } from "expo-router";

import { CustomStackHeader } from "@/components/navigation/CustomStackHeader";
import { ThemedView } from "@/components/themed-view";
import { PersonalExpensesScreen } from "@/screens/expenses/PersonalExpensesScreen";

export default function PersonalExpensesRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={{ flex: 1 }}>
        <CustomStackHeader title="Personal" />
        <PersonalExpensesScreen />
      </ThemedView>
    </>
  );
}
