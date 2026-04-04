// File: src/components/lists/ShoppingItemRow.tsx — Fila memoizada para item con toggle comprado.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { type ShoppingItemApi } from "@/types/lists";
import { a11yButton, defaultHitSlop } from "@/utils/accessibility";
import { formatCurrency, formatDate } from "@/utils/format";

export const ShoppingItemRow = React.memo(function ShoppingItemRow({
  item,
  currency,
  onTogglePurchased,
  onLongPress,
}: {
  item: ShoppingItemApi;
  currency: string;
  onTogglePurchased: (id: string) => void;
  onLongPress?: (id: string) => void;
}) {
  const { text, tint, primary } = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const toggleLabel = item.purchased
    ? `Restaurar ${item.name} a pendientes`
    : `Marcar ${item.name} como comprado`;
  const toggleHint = item.purchased
    ? "Vuelve el producto a la lista de pendientes"
    : "Mueve el producto al historial";

  const typeLabel = item.itemType === "service" ? "Servicio" : "Producto";
  const serviceBadgeBg = isDark ? String(primary) + "33" : String(tint) + "1A";
  const badgeBg =
    item.itemType === "service" ? serviceBadgeBg : String(text) + "12";
  const badgeFg = item.itemType === "service" ? String(tint) : String(text);
  const noInventoryBg = isDark ? "#86652c34" : "#f59e0b1f";
  const noInventoryFg = "#fa862e";

  return (
    <Pressable
      hitSlop={defaultHitSlop}
      accessibilityRole={onLongPress ? "button" : undefined}
      accessibilityLabel={onLongPress ? `${item.name}. Acciones` : item.name}
      accessibilityHint={
        onLongPress
          ? "Toca para ver opciones. Usa el botón de la derecha para cambiar el estado."
          : undefined
      }
      // UX: tocar la fila abre acciones; cambiar estado sólo desde el icono.
      onPress={onLongPress ? () => onLongPress(item.id) : undefined}
      onLongPress={onLongPress ? () => onLongPress(item.id) : undefined}
      style={StyleSheet.flatten([
        styles.row,
        { borderBottomColor: String(text) + "14" },
      ])}
    >
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <ThemedText
            type="defaultSemiBold"
            style={item.purchased ? styles.strike : undefined}
          >
            {item.name}
          </ThemedText>
          <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
            <ThemedText style={[styles.typeBadgeText, { color: badgeFg }]}>
              {typeLabel}
            </ThemedText>
          </View>
          {!item.syncToInventory ? (
            <View
              style={[styles.typeBadge, { backgroundColor: noInventoryBg }]}
            >
              <ThemedText
                style={[styles.typeBadgeText, { color: noInventoryFg }]}
              >
                Sin inventario
              </ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText style={styles.meta} numberOfLines={1}>
          {`Cant: ${item.amount} u. · ${formatCurrency(item.price, currency)}`}
          {item.category ? ` · ${item.category}` : ""}
        </ThemedText>
        <ThemedText style={styles.meta} numberOfLines={1}>
          {item.purchased
            ? formatDate(item.purchasedAt ?? item.updatedAt)
            : formatDate(item.createdAt)}
        </ThemedText>
      </View>

      <View style={styles.right}>
        <Pressable
          {...a11yButton(toggleLabel, toggleHint)}
          onPress={() => onTogglePurchased(item.id)}
          style={StyleSheet.flatten([
            styles.toggleButton,
            { borderColor: String(text) + "22" },
          ])}
        >
          <Ionicons
            name={item.purchased ? "arrow-undo" : "checkmark"}
            size={18}
            color={String(tint)}
          />
        </Pressable>
      </View>
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
    gap: 10,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    opacity: 0.9,
  },
  meta: {
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 18,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  strike: {
    textDecorationLine: "line-through",
    opacity: 0.65,
  },
});
