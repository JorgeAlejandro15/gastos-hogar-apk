// File: app/profile.tsx — Ruta de perfil accesible desde avatar en dashboard.

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useThemeTokens } from "@/providers/ThemeTokensProvider";
import { ProfileScreen } from "@/screens/tabs/ProfileScreen";
import { selectIsAuthenticated, useAuthStore } from "@/stores/authStore";

export default function ProfileRoute() {
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

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <ProfileScreen />;
}
