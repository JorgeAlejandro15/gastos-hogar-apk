import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { a11yButton } from "@/utils/accessibility";

import {
  formatFilterDateRange,
  inventoryMovementOrderLabel,
  inventoryMovementTypeChipLabel,
  type InventoryMovementsFilterValue,
} from "@/screens/inventory/components/inventoryMovementsFilter.shared";

export const InventoryMovementsActiveFilters = React.memo(
  function InventoryMovementsActiveFilters({
    visible,
    filter,
    selectedProductName,
    onRemoveProduct,
    onRemoveMovementType,
    onRemoveDateRange,
    onRemoveOrder,
    onClearAll,
  }: {
    visible: boolean;
    filter: InventoryMovementsFilterValue;
    selectedProductName?: string;
    onRemoveProduct: () => void;
    onRemoveMovementType: () => void;
    onRemoveDateRange: () => void;
    onRemoveOrder: () => void;
    onClearAll: () => void;
  }) {
    const { border, primary, text } = useThemeColors();

    if (!visible) return null;

    const showDateChip = !!filter.from || !!filter.to;
    const showOrderChip = filter.order === "ASC";

    return (
      <View
        style={[
          styles.wrap,
          {
            borderColor: String(border),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Filtros activos
          </ThemedText>

          <Pressable
            {...a11yButton("Limpiar todos los filtros")}
            onPress={onClearAll}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: String(primary), fontSize: 12 }}
            >
              Limpiar todo
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.chipsRow}>
          {filter.productId ? (
            <FilterChip
              label={`Producto: ${selectedProductName ?? "Seleccionado"}`}
              onRemove={onRemoveProduct}
            />
          ) : null}

          {filter.movementType ? (
            <FilterChip
              label={`Tipo: ${inventoryMovementTypeChipLabel(filter.movementType)}`}
              onRemove={onRemoveMovementType}
            />
          ) : null}

          {showDateChip ? (
            <FilterChip
              label={`Fecha: ${formatFilterDateRange(filter.from, filter.to)}`}
              onRemove={onRemoveDateRange}
            />
          ) : null}

          {showOrderChip ? (
            <FilterChip
              label={`Orden: ${inventoryMovementOrderLabel("ASC")}`}
              onRemove={onRemoveOrder}
            />
          ) : null}
        </View>

        <ThemedText style={[styles.helper, { color: String(text) }]}>
          Toca ✕ en cualquier chip para quitar solo ese filtro.
        </ThemedText>
      </View>
    );
  }
);

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  const { border, surface, text } = useThemeColors();

  return (
    <View
      style={[
        styles.chip,
        {
          borderColor: String(border),
          backgroundColor: String(surface),
        },
      ]}
    >
      <ThemedText
        style={[styles.chipLabel, { color: String(text) }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>

      <Pressable
        {...a11yButton(`Quitar filtro ${label}`)}
        onPress={onRemove}
        hitSlop={6}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={14} color={String(text)} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 13,
    opacity: 0.85,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    maxWidth: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipLabel: {
    fontSize: 12,
    opacity: 0.9,
    maxWidth: 210,
  },
  removeButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  helper: {
    fontSize: 11,
    opacity: 0.68,
  },
});
