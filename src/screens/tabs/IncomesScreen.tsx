// File: src/screens/tabs/IncomesScreen.tsx — Gestión de ingresos personales (/incomes).

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/api";
import type { IncomeItemApi, IncomeSourceApi } from "@/api/incomes-api";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  useDeleteIncomeMutation,
  useIncomesInfiniteQuery,
  useIncomesSummaryQuery,
} from "@/query/incomes";
import { useAuthStore } from "@/stores/authStore";
import { a11yButton } from "@/utils/accessibility";

import { IncomeRow } from "@/screens/incomes/components/IncomeRow";
import { IncomesFiltersCard } from "@/screens/incomes/components/IncomesFiltersCard";
import { IncomeUpsertModal } from "@/screens/incomes/components/IncomeUpsertModal";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatMoney } from "@/screens/incomes/utils/money";

// Componentes memoizados para reducir re-renders en cambios de tema
const SummaryCard = React.memo(function SummaryCard({
  isLoading,
  isError,
  data,
  currency,
  filteredCount,
  totalCount,
  total,
  cardBg,
  border,
  muted,
}: {
  isLoading: boolean;
  isError: boolean;
  data: { total: number; currency: string } | undefined;
  currency: string;
  filteredCount: number;
  totalCount: number;
  total: number | null;
  cardBg: string;
  border: string;
  muted: string;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: cardBg, borderColor: border },
      ]}
    >
      <ThemedText type="defaultSemiBold">Resumen</ThemedText>
      {isLoading ? (
        <ThemedText style={{ color: muted }}>Cargando total...</ThemedText>
      ) : isError ? (
        <ThemedText style={{ color: muted }}>
          No se pudo cargar el total
        </ThemedText>
      ) : (
        <ThemedText style={{ color: muted }}>
          Total: {formatMoney(data?.total ?? 0, data?.currency ?? currency)}
        </ThemedText>
      )}
      <ThemedText style={{ color: muted }}>
        Mostrando {filteredCount} de {totalCount}
        {total ? ` (total de ingresos: ${total})` : ""}
      </ThemedText>
    </View>
  );
});

const EmptyState = React.memo(function EmptyState({
  isLoading,
  primary,
}: {
  isLoading: boolean;
  primary: string;
}) {
  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={primary} />
        <ThemedText style={styles.muted}>Cargando ingresos...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.emptyBox}>
      <ThemedText style={styles.muted}>
        No se encontraron ingresos con los filtros aplicados.
      </ThemedText>
    </View>
  );
});

export function IncomesScreen() {
  const router = useRouter();

  const household = useAuthStore((s) => s.household);

  const currency = household?.currency ?? "USD";

  const [sourceFilter, setSourceFilter] = useState<IncomeSourceApi | "all">(
    "all"
  );
  const [search, setSearch] = useState<string>("");
  const [fromIso, setFromIso] = useState<string | null>(null);
  const [toIso, setToIso] = useState<string | null>(null);

  const sourceParam = sourceFilter === "all" ? undefined : sourceFilter;

  const listQuery = useIncomesInfiniteQuery(
    {
      limit: 20,
      order: "DESC",
      source: sourceParam,
      from: fromIso ?? undefined,
      to: toIso ?? undefined,
    },
    !!household
  );

  const summaryQuery = useIncomesSummaryQuery(
    {
      source: sourceParam,
      from: fromIso ?? undefined,
      to: toIso ?? undefined,
    },
    !!household
  );

  const deleteIncome = useDeleteIncomeMutation();

  const {
    text,
    border,
    surface: cardBg,
    primary,
    onPrimary,
  } = useThemeColors();
  const muted = String(text) + "AA";
  const danger = "#ef4444";

  const [addVisible, setAddVisible] = useState(false);
  const [editIncome, setEditIncome] = useState<IncomeItemApi | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const items = useMemo(() => {
    const pages = listQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.items ?? []);
  }, [listQuery.data?.pages]);

  const total = useMemo(() => {
    const first = listQuery.data?.pages?.[0];
    return first?.total ?? 0;
  }, [listQuery.data?.pages]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (sourceFilter !== "all" && i.source !== sourceFilter) return false;
      if (!q) return true;

      const haystack = [i.description, i.category ?? "", i.source]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search, sourceFilter]);

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" accessibilityRole="header">
            Ingresos
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Para gestionar ingresos primero necesitas crear un hogar.
          </ThemedText>

          <View style={styles.cardPlain}>
            <ThemedText type="subtitle">Hogar requerido</ThemedText>
            <ThemedText style={styles.mutedPlain}>
              Ve a la pestaña “Listas” y crea tu hogar (solo una vez).
            </ThemedText>

            <Pressable
              {...a11yButton("Ir a Listas", "Abre Listas para crear el hogar")}
              onPress={() => router.push("/(tabs)/lists")}
              style={[
                styles.primaryButton,
                { backgroundColor: String(primary) },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                Ir a Listas
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  async function confirmDelete(item: IncomeItemApi) {
    if (deleteIncome.isPending) return;

    Alert.alert("Eliminar ingreso", `¿Eliminar “${item.description}”?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteIncome.mutateAsync(item.id);
          } catch (e) {
            Alert.alert("Error", getApiErrorMessage(e));
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.container}>
        {/* Header fijo - no hace scroll */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" accessibilityRole="header">
              Ingresos
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Tus ingresos personales.
            </ThemedText>
          </View>

          <Pressable
            {...a11yButton(
              "Agregar ingreso",
              "Abre el formulario para crear un ingreso"
            )}
            onPress={() => setAddVisible(true)}
            style={[styles.addButton, { backgroundColor: String(primary) }]}
          >
            <Ionicons name="add" size={20} color={onPrimary} />
          </Pressable>
        </View>

        {/* Contenido principal */}
        <SummaryCard
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
          data={summaryQuery.data}
          currency={currency}
          filteredCount={filteredItems.length}
          totalCount={items.length}
          total={total}
          cardBg={String(cardBg)}
          border={String(border)}
          muted={muted}
        />

        {/* Filtros */}
        <IncomesFiltersCard
          cardBg={String(cardBg)}
          border={String(border)}
          text={String(text)}
          primary={String(primary)}
          source={sourceFilter}
          onSource={setSourceFilter}
          search={search}
          onSearch={setSearch}
          fromIso={fromIso}
          onFromIso={setFromIso}
          toIso={toIso}
          onToIso={setToIso}
          onClear={() => {
            setSourceFilter("all");
            setSearch("");
            setFromIso(null);
            setToIso(null);
          }}
          expanded={filtersExpanded}
          onToggleExpanded={() => setFiltersExpanded(!filtersExpanded)}
        />

        {/* Lista de ingresos */}
        {listQuery.isLoading ? (
          <EmptyState isLoading={true} primary={String(primary)} />
        ) : listQuery.isError ? (
          <View style={styles.loadingBox}>
            <ThemedText style={styles.error}>
              {getApiErrorMessage(listQuery.error)}
            </ThemedText>
            <Pressable
              {...a11yButton("Reintentar", "Vuelve a cargar los ingresos")}
              onPress={() => listQuery.refetch()}
              style={[
                styles.primaryButton,
                { backgroundColor: String(primary) },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                Reintentar
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                {items.length === 0 ? (
                  <>
                    <ThemedText type="subtitle">
                      Aún no tienes ingresos
                    </ThemedText>
                    <ThemedText style={{ color: muted }}>
                      Agrega tu primer ingreso para empezar a llevar el control.
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText type="subtitle">Sin resultados</ThemedText>
                    <ThemedText style={{ color: muted }}>
                      Prueba limpiando los filtros o cambiando el texto de
                      búsqueda.
                    </ThemedText>
                  </>
                )}
              </View>
            }
            onRefresh={() => listQuery.refetch()}
            refreshing={listQuery.isRefetching}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            onEndReached={() => {
              if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
                listQuery.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              listQuery.isFetchingNextPage ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={primary} />
                  <ThemedText style={{ color: muted }}>
                    Cargando más...
                  </ThemedText>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <IncomeRow
                item={item}
                currency={currency}
                border={String(border)}
                cardBg={String(cardBg)}
                text={String(text)}
                muted={muted}
                danger={danger}
                onEdit={() => setEditIncome(item)}
                onDelete={() => confirmDelete(item)}
              />
            )}
          />
        )}
      </ThemedView>

      <IncomeUpsertModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        currency={currency}
        mode={{ kind: "create" }}
      />

      {editIncome ? (
        <IncomeUpsertModal
          visible={true}
          onClose={() => setEditIncome(null)}
          currency={currency}
          mode={{ kind: "edit", income: editIncome }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  subtitle: { opacity: 0.8 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 8,
    gap: 4,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 10,
  },
  emptyBox: {
    paddingVertical: 24,
    gap: 8,
  },
  muted: {
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 45,
    paddingHorizontal: 8,
    gap: 10,
  },
  footer: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cardPlain: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#00000022",
    gap: 8,
  },
  mutedPlain: { opacity: 0.7 },
  primaryButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  error: { color: "#B00020" },
});
