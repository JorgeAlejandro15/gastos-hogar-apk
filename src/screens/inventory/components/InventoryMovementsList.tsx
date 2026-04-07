import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { getApiErrorMessage } from "@/api/api";
import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  inventoryValueLabel,
  type InventoryMovementApi,
} from "@/types/inventory";
import { formatCurrency } from "@/utils/format";

type InventoryMovementsListProps = {
  items: InventoryMovementApi[];
  currency: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  bottomInset: number;
  onRefresh: () => void;
  onFetchNextPage: () => void;
};

export function InventoryMovementsList({
  items,
  currency,
  isLoading,
  isError,
  error,
  isRefetching,
  isFetchingNextPage,
  hasNextPage,
  bottomInset,
  onRefresh,
  onFetchNextPage,
}: InventoryMovementsListProps) {
  const { border, surface, primary } = useThemeColors();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: Math.max(28, bottomInset + 16) },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      removeClippedSubviews={false}
      onRefresh={onRefresh}
      refreshing={isRefetching}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) onFetchNextPage();
      }}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={String(primary)} />
            <ThemedText style={{ opacity: 0.7 }}>
              Cargando movimientos…
            </ThemedText>
          </View>
        ) : isError ? (
          <View style={styles.centerBox}>
            <ThemedText style={{ opacity: 0.75, textAlign: "center" }}>
              {getApiErrorMessage(error)}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.centerBox}>
            <ThemedText type="subtitle">Sin movimientos</ThemedText>
            <ThemedText style={{ opacity: 0.7 }}>
              Aquí aparecerá el historial de entradas/salidas.
            </ThemedText>
          </View>
        )
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator color={String(primary)} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.movementCard,
            {
              borderColor: String(border),
              backgroundColor: String(surface),
            },
          ]}
        >
          <View style={styles.movementHeader}>
            <ThemedText
              type="defaultSemiBold"
              numberOfLines={1}
              style={styles.productName}
            >
              {item.productName}
            </ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={{
                color: item.direction === "incremento" ? "#16a34a" : "#dc2626",
                fontVariant: ["tabular-nums"],
              }}
            >
              {item.direction === "incremento" ? "+" : "-"} {item.quantity}
            </ThemedText>
          </View>

          <ThemedText style={{ opacity: 0.84 }}>
            {inventoryValueLabel(item.movementType)} ·{" "}
            {new Date(item.occurredAt).toLocaleString("es-ES", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </ThemedText>

          <View style={styles.actorRow}>
            <ThemedText style={styles.actorChip}>
              Por: {item.recordedByUserDisplayName ?? "Usuario"}
            </ThemedText>
          </View>

          {typeof item.unitCost === "number" ? (
            <View style={styles.costRow}>
              <View
                style={[
                  styles.costChip,
                  {
                    borderColor: String(border),
                  },
                ]}
              >
                <ThemedText style={styles.costLabel}>Costo unitario</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.costValue}>
                  {formatCurrency(item.unitCost, currency)}
                </ThemedText>
              </View>

              <View
                style={[
                  styles.costChip,
                  {
                    borderColor: String(border),
                  },
                ]}
              >
                <ThemedText style={styles.costLabel}>
                  Total movimiento
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.costValue}>
                  {formatCurrency(item.unitCost * item.quantity, currency)}
                </ThemedText>
              </View>
            </View>
          ) : null}

          {item.reason ? (
            <ThemedText style={{ opacity: 0.7 }}>{item.reason}</ThemedText>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 28,
    gap: 10,
  },
  centerBox: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerLoading: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  movementCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginVertical: 6,
  },
  movementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  productName: {
    flex: 1,
    marginRight: 8,
  },
  actorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actorChip: {
    fontSize: 14.5,
    opacity: 0.85,
  },
  costRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  costChip: {
    flexGrow: 1,
    minWidth: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
  },
  costLabel: {
    fontSize: 11,
    opacity: 0.74,
  },
  costValue: {
    fontSize: 13,
    opacity: 0.9,
  },
});
