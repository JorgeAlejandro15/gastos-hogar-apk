// File: app/(auth)/_layout.tsx — Stack de auth (solo visible si NO hay sesión).

import { Redirect, Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useThemeTokens } from "@/providers/ThemeTokensProvider";
import { selectIsAuthenticated, useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const { colors } = useThemeTokens();
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (isHydrating) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
