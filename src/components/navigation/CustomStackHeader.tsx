// File: src/components/navigation/CustomStackHeader.tsx — Header personalizado para Stack Navigator

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens } from "@/providers/ThemeTokensProvider";
import { ThemedView } from "../themed-view";

interface CustomStackHeaderProps {
  title: string;
  canGoBack?: boolean;
  headerStyle?: ViewStyle;
  headerTitleStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?:
      | "light"
      | "normal"
      | "bold"
      | "100"
      | "200"
      | "300"
      | "400"
      | "500"
      | "600"
      | "700"
      | "800"
      | "900";
  };
  headerTintColor?: string;
}

export function CustomStackHeader({
  title,
  canGoBack = true,
  headerStyle,
  headerTitleStyle,
  headerTintColor,
}: CustomStackHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeTokens();

  // Color de tint por defecto según el tema
  const effectiveTintColor = headerTintColor || colors.primary;

  // Altura del header + padding superior del safe area
  const HEADER_HEIGHT = Platform.OS === "ios" ? 45 : 50;
  const topPadding = Math.max(insets.top, Platform.OS === "android" ? 8 : 0);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          height: HEADER_HEIGHT + topPadding,
          paddingTop: topPadding + 7,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        headerStyle,
      ]}
    >
      <View style={styles.content}>
        {/* Botón de retroceso */}
        {canGoBack && (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
              size={Platform.OS === "ios" ? 28 : 24}
              color={effectiveTintColor}
            />
            {Platform.OS === "ios" && (
              <Text style={[styles.backText, { color: effectiveTintColor }]}>
                Atrás
              </Text>
            )}
          </Pressable>
        )}

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              Platform.OS === "android" && styles.titleAndroid,
              { color: colors.text },
              headerTitleStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* Espaciador para balancear el layout */}
        {canGoBack && <View style={styles.rightSpacer} />}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      android: {
        elevation: 4,
        shadowColor: "#000",
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? 8 : 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? 8 : 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonPressed: {
    opacity: 0.5,
  },
  backText: {
    fontSize: 17,
    marginLeft: 4,
  },
  titleContainer: {
    flex: 1,
    alignItems: Platform.OS === "ios" ? "center" : "flex-start",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  titleAndroid: {
    fontSize: 20,
    fontWeight: "500",
  },
  rightSpacer: {
    width: Platform.OS === "ios" ? 80 : 60,
  },
});
