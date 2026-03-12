// File: app/_layout.tsx — Layout raíz (Stack) y providers globales.

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AppProviders } from "@/providers/AppProviders";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { useThemeTokens } from "@/providers/ThemeTokensProvider";
import { UpdatesProvider } from "@/providers/UpdatesProvider";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AppProviders>
      <UpdatesProvider>
        <NotificationsProvider>
          <RootNavigator />
        </NotificationsProvider>
      </UpdatesProvider>
    </AppProviders>
  );
}

function RootNavigator() {
  const { colors, scheme } = useThemeTokens();

  return (
    <>
      <Stack
        screenOptions={{
          // Asegura el fondo correcto durante la transición entre pantallas.
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </>
  );
}
