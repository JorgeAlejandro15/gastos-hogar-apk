// File: app/expenses/mine.tsx — Ruta para lo que yo pagué.

import { Stack } from "expo-router";

import { CustomStackHeader } from "@/components/navigation/CustomStackHeader";
import { ThemedView } from "@/components/themed-view";
import { MyPaidExpensesScreen } from "@/screens/expenses/MyPaidExpensesScreen";

export default function MyPaidExpensesRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ThemedView style={{ flex: 1 }}>
        <CustomStackHeader title="Yo pagué" />
        <MyPaidExpensesScreen />
      </ThemedView>
    </>
  );
}
