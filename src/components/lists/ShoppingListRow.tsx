// File: src/components/lists/ShoppingListRow.tsx — Fila memoizada para listas (pensada para FlatList).

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { defaultHitSlop } from "@/utils/accessibility";

export type ShoppingListRowModel = {
  id: string;
  name: string;
  scopeLabel?: string; // "Compartida" | "Personal"
  pendingCount?: number | null;
};

export const ShoppingListRow = React.memo(function ShoppingListRow({
  item,
  onPress,
  onLongPress,
}: {
  item: ShoppingListRowModel;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}) {
  const { text } = useThemeColors();

  const subtitle =
    typeof item.pendingCount === "number"
      ? `${item.pendingCount} pendientes`
      : item.scopeLabel ?? "";

  return (
    <Pressable
      hitSlop={defaultHitSlop}
      accessibilityRole="button"
      accessibilityLabel={`Abrir lista ${item.name}`}
      accessibilityHint="Abre el detalle para añadir productos y marcarlos como comprados"
      onPress={() => onPress(item.id)}
      onLongPress={onLongPress ? () => onLongPress(item.id) : undefined}
      style={StyleSheet.flatten([
        styles.row,
        { borderBottomColor: String(text) + "14" },
      ])}
    >
      <View style={styles.left}>
        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
        <ThemedText style={styles.meta}>{subtitle}</ThemedText>
      </View>
      <ThemedText style={styles.chevron}>{">"}</ThemedText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { gap: 4 },
  meta: { opacity: 0.7, fontSize: 13, lineHeight: 18 },
  chevron: { opacity: 0.6 },
});
