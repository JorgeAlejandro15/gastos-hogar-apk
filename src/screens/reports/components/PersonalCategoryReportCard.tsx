// File: src/screens/reports/components/PersonalCategoryReportCard.tsx
// Card desacoplada para el gráfico personal por categoría (sin fuga de datos).

import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { getApiErrorMessage } from "@/api/api";
import { ThemedText } from "@/components/themed-text";
import { a11yButton } from "@/utils/accessibility";

import {
  GiftedPieChartCard,
  type GiftedPieItem,
} from "@/screens/reports/components/GiftedPieChartCard";

export function PersonalCategoryReportCard({
  isLoading,
  isError,
  error,
  items,
  border,
  primary,
  onPrimary,
  muted,
  text,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  items: GiftedPieItem[];
  border: string;
  primary: string;
  onPrimary: string;
  muted: string;
  text: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <View style={[styles.card, { borderColor: border }]}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle">Tu lista personal</ThemedText>
          <View style={[styles.privacyBadge, { borderColor: border }]}>
            <ThemedText style={{ color: text }}>Privado</ThemedText>
          </View>
        </View>

        <ThemedText style={{ color: muted }}>
          Categorías de gastos solo de tu lista personal.
        </ThemedText>

        <View style={styles.loadingRow}>
          <ActivityIndicator color={primary} />
          <ThemedText style={{ color: muted }}>
            Cargando tu gráfico...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.card, { borderColor: border }]}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle">Tu lista personal</ThemedText>
          <View style={[styles.privacyBadge, { borderColor: border }]}>
            <ThemedText style={{ color: text }}>Privado</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.errorText}>
          {getApiErrorMessage(error)}
        </ThemedText>

        <Pressable
          {...a11yButton(
            "Reintentar gastos personales por categoría",
            "Vuelve a cargar tu reporte personal"
          )}
          onPress={onRetry}
          style={[styles.primaryButton, { backgroundColor: primary }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
            Reintentar
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <GiftedPieChartCard
      title="Gastos por categoría"
      subtitle="Lista personal"
      items={items}
      borderColor={border}
      textColor={text}
      emptyLabel="Aún no hay gastos en tu lista personal para este rango."
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  privacyBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  errorText: {
    color: "#B00020",
  },
});
