// File: src/screens/reports/components/GiftedBarChartCard.tsx — Gráfico de barras (react-native-gifted-charts) + fallback textual.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { ThemedText } from "@/components/themed-text";

export type GiftedBarItem = {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
  color: string;
};

export function GiftedBarChartCard({
  title,
  subtitle,
  items,
  borderColor,
  textColor,
  emptyLabel = "Sin datos para este rango.",
}: {
  title: string;
  subtitle?: string;
  items: GiftedBarItem[];
  borderColor: string;
  textColor: string;
  emptyLabel?: string;
}) {
  const data = useMemo(
    () =>
      items.map((it) => ({
        value: Math.max(0, it.value),
        label: it.label.length > 10 ? `${it.label.slice(0, 10)}…` : it.label,
        frontColor: it.color,
        topLabelComponent: () => null,
      })),
    [items]
  );

  const max = useMemo(() => {
    const m = Math.max(0, ...items.map((x) => x.value));
    return Number.isFinite(m) ? m : 0;
  }, [items]);

  return (
    <View style={[styles.card, { borderColor }]}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      {subtitle ? (
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      ) : null}

      {items.length === 0 ? (
        <ThemedText style={styles.muted}>{emptyLabel}</ThemedText>
      ) : (
        <View style={{ gap: 12 }}>
          <BarChart
            data={data}
            height={220}
            barWidth={18}
            spacing={14}
            roundedTop
            xAxisThickness={StyleSheet.hairlineWidth}
            yAxisThickness={0}
            xAxisColor={borderColor}
            yAxisTextStyle={{ color: String(textColor) + "AA", fontSize: 12 }}
            xAxisLabelTextStyle={{
              color: String(textColor) + "AA",
              fontSize: 10,
            }}
            noOfSections={max > 0 ? 4 : 1}
            maxValue={max > 0 ? max : 1}
            disableScroll
          />

          {/* Accesibilidad/fallback: lista textual */}
          <View accessibilityRole="summary" style={{ gap: 6 }}>
            {items.map((it) => (
              <ThemedText
                key={it.key}
                style={{ color: String(textColor) + "CC" }}
              >
                {it.label}: {it.valueLabel}
              </ThemedText>
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
});
