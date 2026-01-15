// File: src/components/dashboard/SummaryCard.tsx
// Tarjeta reutilizable para mostrar un resumen (monto + descripción) con estilo.
// Diseñada para funcionar dentro de <Link asChild> (expo-router).

import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type SummaryCardProps = Omit<PressableProps, "style"> & {
  title: string;
  value: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  loading?: boolean;
  periodLabel?: string;
};

export const SummaryCard = forwardRef<View, SummaryCardProps>(
  function SummaryCard(
    {
      title,
      value,
      description,
      icon,
      accentColor,
      loading,
      periodLabel,
      ...pressableProps
    },
    ref
  ) {
    const {
      surface,
      border,
      text,
      icon: iconColor,
      primary,
    } = useThemeColors();

    const accent = accentColor ?? primary;

    const a11yLabel = useMemo(() => {
      const base = `${title}. ${value}. ${description}`;
      return periodLabel ? `${base}. Periodo: ${periodLabel}.` : base;
    }, [title, value, description, periodLabel]);

    return (
      <Pressable
        ref={ref as any}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        {...pressableProps}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: surface,
            borderColor: border,
          },
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={StyleSheet.flatten([
              styles.iconWrap,
              {
                backgroundColor: String(accent) + "14",
                borderColor: String(accent) + "33",
              },
            ])}
          >
            <Ionicons name={icon} size={18} color={accent} />
          </View>

          <View style={styles.headerRight}>
            {!!periodLabel && (
              <View
                style={StyleSheet.flatten([
                  styles.periodBadge,
                  { borderColor: String(text) + "25" },
                ])}
              >
                <ThemedText style={styles.periodBadgeText}>
                  {periodLabel}
                </ThemedText>
              </View>
            )}

            {loading && (
              <ActivityIndicator
                accessibilityLabel="Cargando"
                size="small"
                color={iconColor}
              />
            )}
          </View>
        </View>

        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
        </ThemedText>

        <ThemedText
          type="title"
          style={StyleSheet.flatten([
            styles.value,
            { opacity: loading ? 0.6 : 1 },
          ])}
        >
          {value}
        </ThemedText>

        <ThemedText style={styles.description}>{description}</ThemedText>

        <View style={styles.footerRow}>
          <ThemedText type="link" style={styles.linkText}>
            Ver detalle
          </ThemedText>
          <Ionicons name="arrow-forward" size={16} color={accent} />
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
    gap: 8,

    // Sombra sutil (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // Elevation (Android)
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.98,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  periodBadge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  periodBadgeText: {
    fontSize: 12,
    opacity: 0.8,
  },

  title: {
    fontSize: 14,
    opacity: 0.85,
  },
  value: {
    fontSize: 28,
    lineHeight: 34,
  },
  description: {
    fontSize: 12,
    opacity: 0.65,
    lineHeight: 16,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  linkText: {
    fontSize: 14,
  },
});
