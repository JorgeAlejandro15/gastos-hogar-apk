// File: src/screens/tabs/ReportsScreen.tsx — Reportes + división de gastos (Fase: Reportes y División).

import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/api";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMyHouseholdMembersQuery } from "@/query/households";
import {
  useBalanceReportQuery,
  useExpensesByCategoryReportQuery,
  useExpensesByPayerReportQuery,
  useExpensesReportInfiniteQuery,
  useExpensesReportSummaryQuery,
} from "@/query/reports";
import { useAuthStore } from "@/stores/authStore";
import { a11yButton } from "@/utils/accessibility";
import { formatCurrency } from "@/utils/format";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { GiftedBarChartCard } from "@/screens/reports/components/GiftedBarChartCard";
import { GiftedPieChartCard } from "@/screens/reports/components/GiftedPieChartCard";
import { ReportsFiltersCard } from "@/screens/reports/components/ReportsFiltersCard";
import { pickChartColor } from "@/screens/reports/utils/chart-colors";
import {
  computeEvenSplitPositions,
  computeSettlements,
  computeWeightedSplitPositionsFromHistory,
  computeWeightedSplitPositionsFromTotals,
  type SplitMember,
  type SplitWeights,
} from "@/utils/expense-splitting";

const BalanceCard = React.memo(function BalanceCard({
  isLoading,
  isError,
  error,
  data,
  currency,
  border,
  primary,
  onPrimary,
  muted,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: any;
  data: any;
  currency: string;
  border: string;
  primary: string;
  onPrimary: string;
  muted: string;
  onRetry: () => void;
}) {
  return (
    <View style={[styles.card, { borderColor: border }]}>
      <ThemedText type="subtitle">Balance personal</ThemedText>
      <ThemedText style={styles.muted}>
        Ingresos − Gastos (en el rango seleccionado)
      </ThemedText>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={primary} />
          <ThemedText style={{ color: muted }}>Cargando balance...</ThemedText>
        </View>
      ) : isError ? (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorText}>
            {getApiErrorMessage(error)}
          </ThemedText>
          <Pressable
            {...a11yButton("Reintentar balance", "Vuelve a cargar el balance")}
            onPress={onRetry}
            style={[styles.primaryButton, { backgroundColor: primary }]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
              Reintentar
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <ThemedText style={{ color: muted }}>
            Ingresos: {formatCurrency(data?.income ?? 0, currency)}
          </ThemedText>
          <ThemedText style={{ color: muted }}>
            Gastos: {formatCurrency(data?.expense ?? 0, currency)}
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            Balance: {formatCurrency(data?.balance ?? 0, currency)}
          </ThemedText>
        </View>
      )}
    </View>
  );
});

const PayerReportCard = React.memo(function PayerReportCard({
  isLoading,
  isError,
  error,
  items,
  border,
  primary,
  onPrimary,
  muted,
  text,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: any;
  items: any[];
  border: string;
  primary: string;
  onPrimary: string;
  muted: string;
  text: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <View style={[styles.card, { borderColor: border }]}>
        <ThemedText type="subtitle">Gastos por pagador</ThemedText>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={primary} />
          <ThemedText style={{ color: muted }}>Cargando...</ThemedText>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.card, { borderColor: border }]}>
        <ThemedText type="subtitle">Gastos por pagador</ThemedText>
        <ThemedText style={styles.errorText}>
          {getApiErrorMessage(error)}
        </ThemedText>
        <Pressable
          {...a11yButton(
            "Reintentar gastos por pagador",
            "Vuelve a cargar el reporte"
          )}
          onPress={onRetry}
          style={[styles.primaryButton, { backgroundColor: primary }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
            Reintentar
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <GiftedBarChartCard
      title="Gastos por pagador"
      subtitle="Lista compartida"
      items={items}
      borderColor={border}
      textColor={text}
    />
  );
});

const CategoryReportCard = React.memo(function CategoryReportCard({
  isLoading,
  isError,
  error,
  items,
  border,
  primary,
  onPrimary,
  muted,
  text,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: any;
  items: any[];
  border: string;
  primary: string;
  onPrimary: string;
  muted: string;
  text: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <View style={[styles.card, { borderColor: border }]}>
        <ThemedText type="subtitle">Gastos por categoría</ThemedText>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={primary} />
          <ThemedText style={{ color: muted }}>Cargando...</ThemedText>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.card, { borderColor: border }]}>
        <ThemedText type="subtitle">Gastos por categoría</ThemedText>
        <ThemedText style={styles.errorText}>
          {getApiErrorMessage(error)}
        </ThemedText>
        <Pressable
          {...a11yButton(
            "Reintentar gastos por categoría",
            "Vuelve a cargar el reporte"
          )}
          onPress={onRetry}
          style={[styles.primaryButton, { backgroundColor: primary }]}
        >
          <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
            Reintentar
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <GiftedPieChartCard
      title="Gastos por categoría"
      subtitle="Lista compartida"
      items={items}
      borderColor={border}
      textColor={text}
    />
  );
});

export function ReportsScreen() {
  const router = useRouter();
  const household = useAuthStore((s) => s.household);
  const user = useAuthStore((s) => s.user);

  const { tint, text, border, surface, primary, onPrimary } = useThemeColors();
  const muted = String(text) + "AA";

  const [fromIso, setFromIso] = useState<string | null>(null);
  const [toIso, setToIso] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  // Mejoras futuras #1 y #2:
  // - splitMode "fast": usa agregados (sin descargar miles de items)
  // - splitMode "shared": usa historial compartido (más preciso para compras compartidas)
  const [splitMode, setSplitMode] = useState<"fast" | "shared">("fast");
  const [useWeighted, setUseWeighted] = useState<boolean>(false);
  const [weights, setWeights] = useState<SplitWeights>({});

  const enabled = !!household?.id && !!user?.id;

  // Reportes agregados del backend (rápidos y eficientes)
  const byPayerQuery = useExpensesByPayerReportQuery(
    {
      from: fromIso ?? undefined,
      to: toIso ?? undefined,
    },
    enabled
  );

  const byCategoryQuery = useExpensesByCategoryReportQuery(
    {
      from: fromIso ?? undefined,
      to: toIso ?? undefined,
    },
    enabled
  );

  const balanceQuery = useBalanceReportQuery(
    {
      from: fromIso ?? undefined,
      to: toIso ?? undefined,
    },
    enabled
  );

  // Para división: necesitamos miembros y el historial compartido (items reales).
  const membersQuery = useMyHouseholdMembersQuery(enabled);

  // Mejoras futuras #2: no cargamos historial si el usuario eligió modo rápido.
  const sharedHistoryQuery = useExpensesReportInfiniteQuery(
    "shared",
    {
      from: fromIso ?? undefined,
      to: toIso ?? undefined,
      limit: 200,
      order: "DESC",
    },
    enabled && splitMode === "shared"
  );

  const allExpensesSummaryQuery = useExpensesReportSummaryQuery(
    "shared",
    {
      from: fromIso ?? undefined,
      to: toIso ?? undefined,
    },
    enabled && splitMode === "fast"
  );

  // Carga automática de páginas hasta un máximo (protección). Esto evita que el usuario tenga que scrollear.
  useEffect(() => {
    if (!enabled) return;
    if (splitMode !== "shared") return;
    if (!sharedHistoryQuery.hasNextPage) return;
    if (sharedHistoryQuery.isFetchingNextPage) return;

    const loaded =
      sharedHistoryQuery.data?.pages?.reduce(
        (acc, p) => acc + (p.items?.length ?? 0),
        0
      ) ?? 0;

    // Límite de seguridad: procesamos como máximo 2,000 items por rango.
    if (loaded >= 2000) return;

    // Si hay más páginas, seguimos trayendo (en background) para tener un cálculo más completo.
    sharedHistoryQuery.fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    splitMode,
    sharedHistoryQuery.data?.pages?.length,
    sharedHistoryQuery.hasNextPage,
    sharedHistoryQuery.isFetchingNextPage,
  ]);

  const currency = balanceQuery.data?.currency ?? household?.currency ?? "USD";

  // Inicializa pesos cuando llegan miembros (default = 1).
  useEffect(() => {
    const members = membersQuery.data ?? [];
    if (members.length === 0) return;

    setWeights((prev) => {
      const next: SplitWeights = { ...prev };
      for (const m of members) {
        if (typeof next[m.userId] !== "number") next[m.userId] = 1;
      }
      // Limpia ids que ya no existen.
      const ids = new Set(members.map((m) => m.userId));
      for (const k of Object.keys(next)) {
        if (!ids.has(k)) delete next[k];
      }
      return next;
    });
  }, [membersQuery.data]);

  const payerChartItems = useMemo(() => {
    const items = byPayerQuery.data?.items ?? [];
    return items.map((x) => ({
      key: x.payerId,
      label: x.displayName || "(sin nombre)",
      value: x.total,
      valueLabel: formatCurrency(x.total, currency),
    }));
  }, [byPayerQuery.data?.items, currency]);

  const categoryChartItems = useMemo(() => {
    const items = byCategoryQuery.data?.items ?? [];
    return items.map((x) => ({
      key: x.category,
      label: x.category,
      value: x.total,
      valueLabel: formatCurrency(x.total, currency),
    }));
  }, [byCategoryQuery.data?.items, currency]);

  const payerBarItems = useMemo(() => {
    return payerChartItems.map((it, idx) => ({
      ...it,
      color: pickChartColor(idx),
    }));
  }, [payerChartItems]);

  const categoryPieItems = useMemo(() => {
    return categoryChartItems.map((it, idx) => ({
      ...it,
      color: pickChartColor(idx),
    }));
  }, [categoryChartItems]);

  const splitMembers = useMemo<SplitMember[]>(() => {
    const members = membersQuery.data ?? [];
    return members.map((m) => ({
      userId: m.userId,
      displayName: m.displayName || m.email,
    }));
  }, [membersQuery.data]);

  const splitResult = useMemo(() => {
    const members = splitMembers;

    if (splitMode === "fast") {
      // Modo rápido: usa agregados (sin descargar historial) de la lista compartida.
      const total = allExpensesSummaryQuery.data?.total ?? 0;
      const paidMap: Record<string, number> = {};
      for (const it of byPayerQuery.data?.items ?? []) {
        paidMap[it.payerId] = (paidMap[it.payerId] ?? 0) + (it.total ?? 0);
      }

      const { positions, totalWeights } =
        computeWeightedSplitPositionsFromTotals({
          members,
          paidByUserId: paidMap,
          totalAmount: total,
          weights: useWeighted ? weights : undefined,
        });

      const settlements = computeSettlements(positions);
      return {
        positions,
        settlements,
        processedItems: 0,
        skippedItems: 0,
        totalLoaded: 0,
        membersCount: members.length,
        totalWeights,
        sourceLabel: "agregado compartido",
      };
    }

    // Modo preciso: basado en historial compartido.
    const pages = sharedHistoryQuery.data?.pages ?? [];
    const expenses = pages.flatMap((p) => p.items ?? []);

    if (useWeighted) {
      const { positions, processedItems, skippedItems, totalWeights } =
        computeWeightedSplitPositionsFromHistory(
          expenses,
          {
            members,
            ignoreMissingPayer: true,
            maxItems: 2000,
          },
          weights
        );
      const settlements = computeSettlements(positions);
      return {
        positions,
        settlements,
        processedItems,
        skippedItems,
        totalLoaded: expenses.length,
        membersCount: members.length,
        totalWeights,
        sourceLabel: "historial compartido",
      };
    }

    const { positions, processedItems, skippedItems } =
      computeEvenSplitPositions(expenses, {
        members,
        ignoreMissingPayer: true,
        maxItems: 2000,
      });
    const settlements = computeSettlements(positions);
    return {
      positions,
      settlements,
      processedItems,
      skippedItems,
      totalLoaded: expenses.length,
      membersCount: members.length,
      totalWeights: members.length,
      sourceLabel: "historial compartido",
    };
  }, [
    splitMembers,
    splitMode,
    sharedHistoryQuery.data?.pages,
    allExpensesSummaryQuery.data?.total,
    byPayerQuery.data?.items,
    useWeighted,
    weights,
  ]);

  if (!household) {
    return (
      <SafeAreaView style={[styles.safe]} edges={["top"]}>
        <ThemedView style={styles.screen}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent]}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="title" accessibilityRole="header">
              Reportes
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Para ver reportes primero necesitas crear un hogar.
            </ThemedText>

            <View style={styles.card}>
              <ThemedText type="subtitle">Hogar requerido</ThemedText>
              <ThemedText style={styles.muted}>
                Ve a la pestaña “Listas” y crea tu hogar (solo una vez).
              </ThemedText>

              <Pressable
                {...a11yButton(
                  "Ir a Listas",
                  "Abre Listas para crear el hogar"
                )}
                onPress={() => router.push("/(tabs)/lists")}
                style={[
                  styles.primaryButton,
                  { backgroundColor: String(tint) },
                ]}
              >
                <ThemedText type="defaultSemiBold" style={styles.primaryText}>
                  Ir a Listas
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe]} edges={["top"]}>
      <ThemedView style={styles.screen}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" accessibilityRole="header">
            Reportes
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Gráficos y división del hogar.
          </ThemedText>

          <ReportsFiltersCard
            cardBg={String(surface)}
            border={String(border)}
            text={String(text)}
            primary={String(primary)}
            fromIso={fromIso}
            toIso={toIso}
            onFromIso={setFromIso}
            onToIso={setToIso}
            onClear={() => {
              setFromIso(null);
              setToIso(null);
            }}
            expanded={filtersExpanded}
            onToggleExpanded={() => setFiltersExpanded((prev) => !prev)}
          />

          {/* Balance personal */}
          <BalanceCard
            isLoading={balanceQuery.isLoading}
            isError={balanceQuery.isError}
            error={balanceQuery.error}
            data={balanceQuery.data}
            currency={currency}
            border={String(border)}
            primary={String(primary)}
            onPrimary={String(onPrimary)}
            muted={String(muted)}
            onRetry={() => balanceQuery.refetch()}
          />

          {/* Gráfico: por pagador */}
          <View style={{ gap: 10 }}>
            <PayerReportCard
              isLoading={byPayerQuery.isLoading}
              isError={byPayerQuery.isError}
              error={byPayerQuery.error}
              items={payerBarItems}
              border={String(border)}
              primary={String(primary)}
              onPrimary={String(onPrimary)}
              muted={String(muted)}
              text={String(text)}
              onRetry={() => byPayerQuery.refetch()}
            />
          </View>

          {/* Gráfico: por categoría */}
          <View style={{ gap: 10 }}>
            <CategoryReportCard
              isLoading={byCategoryQuery.isLoading}
              isError={byCategoryQuery.isError}
              error={byCategoryQuery.error}
              items={categoryPieItems}
              border={String(border)}
              primary={String(primary)}
              onPrimary={String(onPrimary)}
              muted={String(muted)}
              text={String(text)}
              onRetry={() => byCategoryQuery.refetch()}
            />
          </View>

          {/* División de gastos */}
          <View style={[styles.card, { borderColor: String(border) }]}>
            <ThemedText type="subtitle">División de gastos</ThemedText>
            <ThemedText style={styles.muted}>
              Fuente: {splitResult.sourceLabel}
            </ThemedText>

            {/* Selector de modo (mejora #2) */}
            <View style={styles.chipsRow}>
              <Pressable
                {...a11yButton(
                  "Modo rápido",
                  "Calcula con agregados sin descargar historial"
                )}
                onPress={() => setSplitMode("fast")}
                style={StyleSheet.flatten([
                  styles.chip,
                  {
                    borderColor: String(border),
                    backgroundColor:
                      splitMode === "fast"
                        ? String(primary) + "22"
                        : "transparent",
                  },
                ])}
              >
                <ThemedText type="defaultSemiBold">Total</ThemedText>
              </Pressable>

              <Pressable
                {...a11yButton(
                  "Modo preciso",
                  "Calcula con historial compartido (puede tardar)"
                )}
                onPress={() => setSplitMode("shared")}
                style={StyleSheet.flatten([
                  styles.chip,
                  {
                    borderColor: String(border),
                    backgroundColor:
                      splitMode === "shared"
                        ? String(primary) + "22"
                        : "transparent",
                  },
                ])}
              >
                <ThemedText type="defaultSemiBold">Compartido</ThemedText>
              </Pressable>
            </View>

            {/* Participación ponderada (mejora #1) */}
            <View style={styles.chipsRow}>
              <Pressable
                {...a11yButton("División igualitaria", "Todos deben lo mismo")}
                onPress={() => setUseWeighted(false)}
                style={StyleSheet.flatten([
                  styles.chip,
                  {
                    borderColor: String(border),
                    backgroundColor: !useWeighted
                      ? String(tint) + "22"
                      : "transparent",
                  },
                ])}
              >
                <ThemedText type="defaultSemiBold">Igualitaria</ThemedText>
              </Pressable>

              <Pressable
                {...a11yButton(
                  "División por participación",
                  "Permite ajustar el peso de cada miembro"
                )}
                onPress={() => setUseWeighted(true)}
                style={StyleSheet.flatten([
                  styles.chip,
                  {
                    borderColor: String(border),
                    backgroundColor: useWeighted
                      ? String(tint) + "22"
                      : "transparent",
                  },
                ])}
              >
                <ThemedText type="defaultSemiBold">Por pesos</ThemedText>
              </Pressable>

              {useWeighted ? (
                <Pressable
                  {...a11yButton(
                    "Restablecer pesos",
                    "Vuelve a participación 1 para todos"
                  )}
                  onPress={() => {
                    const next: SplitWeights = {};
                    for (const m of splitMembers) next[m.userId] = 1;
                    setWeights(next);
                  }}
                  style={StyleSheet.flatten([
                    styles.chip,
                    { borderColor: String(border) },
                  ])}
                >
                  <ThemedText type="link">Reset</ThemedText>
                </Pressable>
              ) : null}
            </View>

            {useWeighted ? (
              <View style={{ gap: 8 }}>
                <ThemedText style={{ color: muted }}>
                  Ajusta la participación (0 = excluido). Pesos totales:{" "}
                  {splitResult.totalWeights}
                </ThemedText>
                {splitMembers.map((m) => {
                  const w =
                    typeof weights[m.userId] === "number"
                      ? (weights[m.userId] as number)
                      : 1;
                  return (
                    <View key={m.userId} style={styles.weightRow}>
                      <ThemedText style={{ flex: 1 }} numberOfLines={1}>
                        {m.displayName}
                      </ThemedText>

                      <View style={styles.stepper}>
                        <Pressable
                          {...a11yButton(
                            `Disminuir participación de ${m.displayName}`,
                            "Reduce el peso"
                          )}
                          onPress={() =>
                            setWeights((prev) => ({
                              ...prev,
                              [m.userId]: Math.max(
                                0,
                                (prev[m.userId] ?? 1) - 1
                              ),
                            }))
                          }
                          style={[
                            styles.stepBtn,
                            { borderColor: String(border) },
                          ]}
                        >
                          <ThemedText type="defaultSemiBold">−</ThemedText>
                        </Pressable>

                        <ThemedText
                          style={{ minWidth: 26, textAlign: "center" }}
                        >
                          {w}
                        </ThemedText>

                        <Pressable
                          {...a11yButton(
                            `Aumentar participación de ${m.displayName}`,
                            "Incrementa el peso"
                          )}
                          onPress={() =>
                            setWeights((prev) => ({
                              ...prev,
                              [m.userId]: Math.min(
                                100,
                                (prev[m.userId] ?? 1) + 1
                              ),
                            }))
                          }
                          style={[
                            styles.stepBtn,
                            { borderColor: String(border) },
                          ]}
                        >
                          <ThemedText type="defaultSemiBold">+</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Estados de carga/errores según modo */}
            {membersQuery.isLoading ||
            (splitMode === "shared" && sharedHistoryQuery.isLoading) ||
            (splitMode === "fast" && allExpensesSummaryQuery.isLoading) ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={primary} />
                <ThemedText style={{ color: muted }}>Calculando...</ThemedText>
              </View>
            ) : membersQuery.isError ||
              (splitMode === "shared" && sharedHistoryQuery.isError) ||
              (splitMode === "fast" && allExpensesSummaryQuery.isError) ? (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>
                  {getApiErrorMessage(
                    membersQuery.error ??
                      (splitMode === "shared"
                        ? sharedHistoryQuery.error
                        : allExpensesSummaryQuery.error)
                  )}
                </ThemedText>
                <Pressable
                  {...a11yButton(
                    "Reintentar división",
                    "Vuelve a cargar miembros e historial"
                  )}
                  onPress={() => {
                    membersQuery.refetch();
                    if (splitMode === "shared") sharedHistoryQuery.refetch();
                    if (splitMode === "fast") allExpensesSummaryQuery.refetch();
                  }}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: String(primary) },
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: onPrimary }}
                  >
                    Reintentar
                  </ThemedText>
                </Pressable>
              </View>
            ) : splitResult.membersCount <= 1 ? (
              <ThemedText style={{ color: muted }}>
                Necesitas al menos 2 miembros para dividir gastos.
              </ThemedText>
            ) : (
              <View style={{ gap: 12 }}>
                <ThemedText style={{ color: muted }}>
                  Miembros: {splitResult.membersCount}
                  {splitMode === "shared"
                    ? ` · Procesados: ${splitResult.processedItems}`
                    : ""}
                  {splitMode === "shared" &&
                  splitResult.totalLoaded > splitResult.processedItems
                    ? ` (cargados: ${splitResult.totalLoaded})`
                    : ""}
                  {splitMode === "shared" && splitResult.skippedItems
                    ? ` · Omitidos: ${splitResult.skippedItems}`
                    : ""}
                </ThemedText>

                <View style={{ gap: 8 }}>
                  <ThemedText type="defaultSemiBold">
                    Posición por persona
                  </ThemedText>
                  {splitResult.positions.map((p) => (
                    <View key={p.userId} style={styles.splitRow}>
                      <ThemedText style={{ flex: 1 }} numberOfLines={1}>
                        {p.displayName}
                      </ThemedText>
                      <ThemedText style={{ color: muted }}>
                        Pagó {formatCurrency(p.paid, currency)} · Debe{" "}
                        {formatCurrency(p.owed, currency)}
                      </ThemedText>
                      <ThemedText type="defaultSemiBold">
                        {formatCurrency(p.net, currency)}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                <View style={{ gap: 8 }}>
                  <ThemedText type="defaultSemiBold">
                    Sugerencias para saldar
                  </ThemedText>
                  {splitResult.settlements.length === 0 ? (
                    <ThemedText style={{ color: muted }}>
                      Todo está balanceado (o muy cerca).
                    </ThemedText>
                  ) : (
                    splitResult.settlements.map((s, idx) => (
                      <ThemedText key={`${s.fromUserId}-${s.toUserId}-${idx}`}>
                        {s.fromName} → {s.toName}:{" "}
                        {formatCurrency(s.amount, currency)}
                      </ThemedText>
                    ))
                  )}
                </View>

                {sharedHistoryQuery.hasNextPage ? (
                  <ThemedText style={{ color: muted }}>
                    Nota: seguimos cargando más historial en segundo plano (máx.
                    2,000 items) para mejorar el cálculo.
                  </ThemedText>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  subtitle: { opacity: 0.8 },
  card: {
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#00000022",
    gap: 8,
  },
  muted: { opacity: 0.7 },
  primaryButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryText: { color: "white" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  errorBox: {
    gap: 10,
    paddingTop: 6,
  },
  errorText: {
    color: "#B00020",
  },
  splitRow: {
    gap: 4,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#00000022",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 6,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
