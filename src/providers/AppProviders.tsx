// File: src/providers/AppProviders.tsx — Providers globales: Theme, React Query y bootstrap de auth.

import { ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useAppColorScheme } from "@/hooks/use-app-color-scheme";
import { createNavigationTheme } from "@/navigation/navigationTheme";
import { AuthBootstrap } from "@/providers/AuthBootstrap";
import { SettingsBootstrap } from "@/providers/SettingsBootstrap";
import { ThemeTokensProvider } from "@/providers/ThemeTokensProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { queryClient } from "@/query/queryClient";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const colorScheme = useAppColorScheme();

  const navigationTheme = React.useMemo(() => {
    return createNavigationTheme(colorScheme);
  }, [colorScheme]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <QueryClientProvider client={queryClient}>
          <ThemeTokensProvider scheme={colorScheme}>
            <ToastProvider>
              <SettingsBootstrap>
                <View
                  style={{
                    flex: 1,
                    // Fondo global para evitar flashes blancos en transiciones
                    // (frames donde el stack aún no pintó la pantalla).
                    backgroundColor: Colors[colorScheme].background,
                  }}
                >
                  <AuthBootstrap>{children}</AuthBootstrap>
                </View>
              </SettingsBootstrap>
            </ToastProvider>
          </ThemeTokensProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
