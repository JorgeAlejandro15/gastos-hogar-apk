// File: src/screens/lists/components/HistorySummaryBanner.tsx — Banner que muestra el total gastado en el historial.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formatCurrency } from "@/utils/format";

export type HistorySummaryBannerProps = {
  totalAmount: number;
  currency: string;
  tint: string;
  onTintText: string;
};

export const HistorySummaryBanner = React.memo(function HistorySummaryBanner({
  totalAmount,
  currency,
  tint,
  onTintText,
}: HistorySummaryBannerProps) {
  return (
    <View style={[styles.banner, { backgroundColor: tint }]}>
      <View style={styles.row}>
        <View
          style={[styles.iconCircle, { backgroundColor: onTintText + "22" }]}
        >
          <Ionicons name="cart" size={20} color={onTintText} />
        </View>

        <View style={styles.textBlock}>
          <ThemedText
            type="defaultSemiBold"
            style={[styles.label, { color: onTintText + "CC" }]}
          >
            Total gastado
          </ThemedText>
          <ThemedText
            type="subtitle"
            style={[styles.amount, { color: onTintText }]}
          >
            {formatCurrency(totalAmount, currency)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 20,
  },
});
