// File: src/screens/incomes/components/IncomeRow.tsx — Item de lista.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { IncomeItemApi } from "@/api/incomes-api";
import { ThemedText } from "@/components/themed-text";
import { a11yButton } from "@/utils/accessibility";

import { formatShortDate } from "../utils/dates";
import { formatMoney } from "../utils/money";
import { SOURCE_LABEL } from "./IncomeSourceChips";

export function IncomeRow({
  item,
  currency,
  border,
  cardBg,
  text,
  muted,
  danger,
  onEdit,
  onDelete,
}: {
  item: IncomeItemApi;
  currency: string;
  border: string;
  cardBg: string;
  text: string;
  muted: string;
  danger: string;
  onEdit: () => void;
  onDelete: () => void;
}) {

  const warning = "#f0f32bd7";

  return (
    <View
      style={[styles.rowCard, { backgroundColor: cardBg, borderColor: border }]}
    >
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {item.description}
          </ThemedText>
          <ThemedText
            style={[styles.rowMeta, { color: muted }]}
            numberOfLines={1}
          >
            {SOURCE_LABEL[item.source]}
            {item.category ? ` · ${item.category}` : ""}
            {item.occurredAt ? ` · ${formatShortDate(item.occurredAt)}` : ""}
          </ThemedText>
        </View>

        <View style={styles.rowRight}>
          <ThemedText type="defaultSemiBold" style={{ color: text }}>
            {formatMoney(item.amount, currency)}
          </ThemedText>
          <View style={styles.actions}>
            <Pressable
              {...a11yButton(
                "Editar ingreso",
                `Edita el ingreso ${item.description}`
              )}
              onPress={onEdit}
              style={styles.iconBtn}
            >
              <Ionicons name="pencil-outline" size={22} color={warning} />
            </Pressable>

            <Pressable
              {...a11yButton(
                "Eliminar ingreso",
                `Elimina el ingreso ${item.description}`
              )}
              onPress={onDelete}
              style={styles.iconBtn}
            >
              <Ionicons name="trash-outline" size={22} color={danger} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  rowMeta: { fontSize: 12, marginTop: 4 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
});
