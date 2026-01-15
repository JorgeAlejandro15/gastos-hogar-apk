// File: src/screens/expenses/components/ExpensesListView.tsx — Vista reutilizable para listar gastos.

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import type { ExpenseItemApi } from "@/api/expenses-api";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency, formatDate } from "@/utils/format";

type Props = {
  title: string;
  subtitle?: string;
  totalLabel?: string;
  totalAmount: number;
  currency: string;
  items: ExpenseItemApi[];
  totalCount?: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  emptyText?: string;
  onEndReached?: () => void;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  noMoreText?: string;
};

function keyExtractor(item: ExpenseItemApi) {
  return item.id;
}

export function ExpensesListView({
  title,
  subtitle,
  totalLabel = "Total",
  totalAmount,
  currency,
  items,
  totalCount,
  isLoading,
  isRefreshing,
  onRefresh,
  emptyText = "Sin gastos todavía.",
  onEndReached,
  isFetchingMore,
  hasMore,
  noMoreText = "No hay más resultados",
}: Props) {
  const { text, primary, onPrimary, border } = useThemeColors();

  const listRef = React.useRef<FlatList<ExpenseItemApi> | null>(null);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  const headerRight = useMemo(() => {
    const count = typeof totalCount === "number" ? totalCount : items.length;
    return `${count} registro${count === 1 ? "" : "s"}`;
  }, [items.length, totalCount]);

  return (
    <View style={styles.safe}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" accessibilityRole="header">
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            ) : null}
          </View>
          <ThemedText style={styles.count}>{headerRight}</ThemedText>
        </View>

        <View
          style={[styles.summaryCard, { borderColor: String(text) + "22" }]}
        >
          <ThemedText type="subtitle">{totalLabel}</ThemedText>
          <ThemedText type="title" style={styles.bigNumber}>
            {formatCurrency(totalAmount, currency)}
          </ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <ThemedText style={styles.muted}>Cargando…</ThemedText>
          </View>
        ) : (
          <FlatList
            ref={(r) => {
              listRef.current = r;
            }}
            data={items}
            keyExtractor={keyExtractor}
            contentContainerStyle={
              items.length === 0 ? styles.listEmptyContainer : undefined
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              // Evita renders excesivos.
              if (y > 600 && !showScrollTop) setShowScrollTop(true);
              if (y <= 600 && showScrollTop) setShowScrollTop(false);
            }}
            scrollEventThrottle={16}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={String(text)}
                />
              ) : undefined
            }
            ListEmptyComponent={
              <ThemedText style={styles.muted}>{emptyText}</ThemedText>
            }
            ListFooterComponent={
              isFetchingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator />
                  <ThemedText style={styles.muted}>Cargando más…</ThemedText>
                </View>
              ) : hasMore === false && items.length > 0 ? (
                <View style={styles.footer}>
                  <ThemedText style={styles.muted}>{noMoreText}</ThemedText>
                </View>
              ) : (
                <View style={styles.footerSpacer} />
              )
            }
            renderItem={({ item }) => {
              const payerName = item.payer?.displayName?.trim();
              const payerLabel = payerName ? payerName : "Sin pagador";

              return (
                <View
                  style={[
                    styles.row,
                    { borderBottomColor: String(text) + "18" },
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                      {item.description}
                    </ThemedText>
                    <ThemedText style={styles.muted} numberOfLines={1}>
                      {payerLabel} • {formatDate(item.occurredAt)}
                    </ThemedText>
                  </View>
                  <View style={styles.rowRight}>
                    <ThemedText type="defaultSemiBold">
                      {formatCurrency(
                        item.total ?? item.amount ?? 0,
                        item.currency
                      )}
                    </ThemedText>
                  </View>
                </View>
              );
            }}
          />
        )}

        {showScrollTop && items.length > 0 && (
          <View pointerEvents="box-none" style={styles.fabWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio"
              accessibilityHint="Desplaza la lista al comienzo"
              onPress={() => {
                listRef.current?.scrollToOffset({ offset: 0, animated: true });
                setShowScrollTop(false);
              }}
              style={({ pressed }) => [
                styles.fab,
                {
                  backgroundColor: primary,
                  borderColor: String(border),
                },
                pressed && { opacity: 0.92 },
              ]}
            >
              <Ionicons name="arrow-up" size={18} color={onPrimary} />
              <ThemedText
                type="defaultSemiBold"
                style={{ color: onPrimary, fontSize: 13 }}
              >
                Arriba
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 13,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  subtitle: {
    opacity: 0.75,
    marginTop: 2,
  },
  count: {
    opacity: 0.65,
    fontSize: 12,
  },
  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  bigNumber: {
    marginTop: 4,
  },
  listEmptyContainer: {
    paddingTop: 20,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end" },
  muted: {
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 16,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    gap: 8,
  },
  footer: {
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
  },
  footerSpacer: {
    height: 12,
  },
  fabWrap: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    // Sombra sutil
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});
