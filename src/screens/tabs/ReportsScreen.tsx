// File: src/screens/tabs/ReportsScreen.tsx — Reportes (Fase: Reportes).

import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import {
  useBalanceReportQuery,
  useExpensesByCategoryReportQuery,
  useExpensesByPayerReportQuery,
  usePersonalExpensesByCategoryReportQuery,
} from "@/query/reports";
import { useAuthStore } from "@/stores/authStore";
import { a11yButton } from "@/utils/accessibility";
import { formatCurrency } from "@/utils/format";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { GiftedBarChartCard } from "@/screens/reports/components/GiftedBarChartCard";
import { GiftedPieChartCard } from "@/screens/reports/components/GiftedPieChartCard";
import { PersonalCategoryReportCard } from "@/screens/reports/components/PersonalCategoryReportCard";
import { ReportsFiltersCard } from "@/screens/reports/components/ReportsFiltersCard";
import { pickChartColor } from "@/screens/reports/utils/chart-colors";

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

  const personalByCategoryQuery = usePersonalExpensesByCategoryReportQuery(
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

  const currency = balanceQuery.data?.currency ?? household?.currency ?? "USD";

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

  const personalCategoryChartItems = useMemo(() => {
    const items = personalByCategoryQuery.data?.items ?? [];
    return items.map((x) => ({
      key: x.category,
      label: x.category,
      value: x.total,
      valueLabel: formatCurrency(x.total, currency),
    }));
  }, [personalByCategoryQuery.data?.items, currency]);

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

  const personalCategoryPieItems = useMemo(() => {
    return personalCategoryChartItems.map((it, idx) => ({
      ...it,
      color: pickChartColor(idx),
    }));
  }, [personalCategoryChartItems]);

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
            Gráficos del hogar y de tu lista personal.
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

          {/* Gráfico: categoría de lista personal */}
          <View style={{ gap: 10 }}>
            <PersonalCategoryReportCard
              isLoading={personalByCategoryQuery.isLoading}
              isError={personalByCategoryQuery.isError}
              error={personalByCategoryQuery.error}
              items={personalCategoryPieItems}
              border={String(border)}
              primary={String(primary)}
              onPrimary={String(onPrimary)}
              muted={String(muted)}
              text={String(text)}
              onRetry={() => personalByCategoryQuery.refetch()}
            />
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
});
