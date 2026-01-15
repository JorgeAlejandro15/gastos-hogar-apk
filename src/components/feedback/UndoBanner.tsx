// File: src/components/feedback/UndoBanner.tsx — Banner inferior con acción "Deshacer" (accesible).

import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { a11yButton } from "@/utils/accessibility";

export type UndoBannerProps = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
};

export function UndoBanner({
  visible,
  message,
  actionLabel = "Deshacer",
  onAction,
  onDismiss,
  style,
}: UndoBannerProps) {
  const { text, tint } = useThemeColors();

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [anim, visible]);

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        borderColor: String(text) + "22",
        backgroundColor: String(text) + "0D",
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      },
      style,
    ],
    [anim, style, text]
  );

  if (!visible) return null;

  return (
    <Animated.View style={containerStyle} accessibilityRole="alert">
      <ThemedText style={styles.message} numberOfLines={2}>
        {message}
      </ThemedText>

      <View style={styles.actions}>
        <Pressable
          {...a11yButton(actionLabel, "Revierte la última acción")}
          onPress={onAction}
          style={StyleSheet.flatten([
            styles.actionButton,
            { borderColor: String(tint) },
          ])}
        >
          <ThemedText type="defaultSemiBold" style={{ color: String(tint) }}>
            {actionLabel}
          </ThemedText>
        </Pressable>

        <Pressable
          {...a11yButton("Cerrar", "Oculta el mensaje")}
          onPress={onDismiss}
          style={styles.closeButton}
        >
          <ThemedText style={{ opacity: 0.75, fontSize: 20 }}>×</ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    opacity: 0.75,
    fontSize: 20,
    lineHeight: 20,
  },
});
