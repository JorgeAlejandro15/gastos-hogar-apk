// File: src/screens/reports/components/GiftedPieChartCard.tsx — Pie/Donut (react-native-gifted-charts) + leyenda accesible.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type GiftedPieItem = {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
  color: string;
};

export function GiftedPieChartCard({
  title,
  subtitle,
  items,
  borderColor,
  textColor,
  emptyLabel = "Sin datos para este rango.",
}: {
  title: string;
  subtitle?: string;
  items: GiftedPieItem[];
  borderColor: string;
  textColor: string;
  emptyLabel?: string;
}) {
  const { background } = useThemeColors();

  const data = useMemo(
    () =>
      items
        .filter((x) => x.value > 0)
        .map((it) => ({
          value: it.value,
          color: it.color,
          text: "",
        })),
    [items]
  );

  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number.isFinite(it.value) ? it.value : 0),
        0
      ),
    [items]
  );

  return (
    <View style={[styles.card, { borderColor }]}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      {subtitle ? (
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      ) : null}

      {items.length === 0 || total <= 0 ? (
        <ThemedText style={styles.muted}>{emptyLabel}</ThemedText>
      ) : (
        <View style={styles.body}>
          <View style={styles.chartCol}>
            <PieChart
              data={data}
              donut
              radius={90}
              innerRadius={55}
              // En modo oscuro, el centro del donut puede verse demasiado blanco si no se especifica.
              innerCircleColor={String(background)}
              centerLabelComponent={() => (
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: String(background),
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <ThemedText type="defaultSemiBold">Total</ThemedText>
                  <ThemedText style={{ opacity: 0.8 }}>
                    {total.toFixed(2)}
                  </ThemedText>
                </View>
              )}
              strokeWidth={1}
              strokeColor={borderColor}
            />
          </View>

          {/* Leyenda + accesibilidad */}
          <View style={styles.legendCol} accessibilityRole="summary">
            {items.map((it) => (
              <View key={it.key} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: it.color }]} />
                <View style={{ flex: 1 }}>
                  <ThemedText numberOfLines={1}>{it.label}</ThemedText>
                  <ThemedText style={{ color: String(textColor) + "AA" }}>
                    {it.valueLabel}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  subtitle: { opacity: 0.8 },
  muted: { opacity: 0.7 },
  body: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  legendCol: {
    flex: 1,
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});
