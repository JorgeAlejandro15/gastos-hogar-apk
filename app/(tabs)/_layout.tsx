// File: app/(tabs)/_layout.tsx — Bottom Tabs (ocultas si no hay sesión).

import { Redirect, Tabs, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeTokens } from "@/providers/ThemeTokensProvider";
import { selectIsAuthenticated, useAuthStore } from "@/stores/authStore";

export default function TabLayout() {
  const { colors } = useThemeTokens();
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const household = useAuthStore((s) => s.household);
  const router = useRouter();

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

  if (!isAuthenticated) {
    return <Redirect href="../(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        // Evita que la TabBar "suba" con el teclado (Android). En su lugar se oculta.
        // tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Listas",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Ingresos",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="banknote.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar" color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!household) {
              e.preventDefault();
              Alert.alert(
                "Primero crea un hogar",
                "Para ver reportes necesitas tener un hogar asociado.",
                [
                  {
                    text: "Ir a Listas",
                    onPress: () => router.push("/(tabs)/lists"),
                  },
                  { text: "Cancelar", style: "cancel" },
                ]
              );
            }
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
