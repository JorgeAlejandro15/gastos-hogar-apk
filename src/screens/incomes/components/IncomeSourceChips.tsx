// File: src/screens/incomes/components/IncomeSourceChips.tsx — Selector horizontal de origen.

import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { IncomeSourceApi } from "@/api/incomes-api";
import { ThemedText } from "@/components/themed-text";

export const SOURCE_LABEL: Record<IncomeSourceApi, string> = {
  salary: "Salario",
  gift: "Regalo",
  refund: "Reembolso",
  other: "Otro",
};

export function IncomeSourceChips({
  value,
  onChange,
  border,
  activeBg,
  includeAll,
}: {
  value: IncomeSourceApi | "all";
  onChange: (v: IncomeSourceApi | "all") => void;
  border: string;
  activeBg: string;
  includeAll?: boolean;
}) {
  const items = includeAll
    ? ([
        ["all", "Todos"],
        ["salary", SOURCE_LABEL.salary],
        ["gift", SOURCE_LABEL.gift],
        ["refund", SOURCE_LABEL.refund],
        ["other", SOURCE_LABEL.other],
      ] as const)
    : ([
        ["salary", SOURCE_LABEL.salary],
        ["gift", SOURCE_LABEL.gift],
        ["refund", SOURCE_LABEL.refund],
        ["other", SOURCE_LABEL.other],
      ] as const);

  return (
    <View style={[styles.segmented, { borderColor: border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {items.map(([key, label]) => {
          const active = key === value;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`Origen: ${label}`}
              onPress={() => onChange(key as any)}
              style={[styles.chip, active && { backgroundColor: activeBg }]}
            >
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  chip: {
    paddingHorizontal: 12,
    minHeight: 44,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
