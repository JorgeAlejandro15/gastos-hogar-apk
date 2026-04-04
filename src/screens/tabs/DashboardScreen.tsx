// File: src/screens/tabs/DashboardScreen.tsx — Dashboard: resumen de gasto basado en DB + accesos rápidos.

import { Ionicons } from "@expo/vector-icons";
import * as Network from "expo-network";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  PeriodFilter,
  type PeriodValue,
} from "@/components/dashboard/PeriodFilter";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import {
  UserAvatarStatus,
  type UserAvatarPresenceStatus,
} from "@/components/navigation/UserAvatarStatus";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useMyPaidExpensesSummaryQuery,
  usePersonalExpensesSummaryQuery,
  useSharedExpensesSummaryQuery,
} from "@/query/expenses";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { formatCurrency } from "@/utils/format";

function getCurrentPeriodValue(): PeriodValue {
  const now = new Date();
  return {
    mode: "month",
    year: now.getFullYear(),
    month: now.getMonth(),
  };
}

function getPeriodLabel(period: PeriodValue): string {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  if (period.mode === "year") return String(period.year);
  const m = months[Math.min(11, Math.max(0, period.month))] ?? "";
  return `${m} ${period.year}`.trim();
}

function buildFromTo(period: PeriodValue): { from: string; to: string } {
  // Usamos hora local para que los límites coincidan con la zona horaria del usuario.
  if (period.mode === "year") {
    const from = new Date(period.year, 0, 1, 0, 0, 0, 0);
    const to = new Date(period.year, 11, 31, 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  const from = new Date(period.year, period.month, 1, 0, 0, 0, 0);
  // Día 0 del siguiente mes = último día del mes actual
  const to = new Date(period.year, period.month + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function DashboardScreen() {
  const { tint, border, primary, surface, yellow, green, red } =
    useThemeColors();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const household = useAuthStore((s) => s.household);

  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const enabled = !!household?.id && !!user?.id;

  const [period, setPeriod] = useState<PeriodValue>(() =>
    getCurrentPeriodValue()
  );
  const periodLabel = useMemo(() => getPeriodLabel(period), [period]);

  const { from, to } = useMemo(() => buildFromTo(period), [period]);
  const summaryQueryParams = useMemo(
    () => (enabled ? { from, to } : undefined),
    [enabled, from, to]
  );

  const sharedSummaryQuery = useSharedExpensesSummaryQuery(
    summaryQueryParams,
    enabled
  );
  const personalSummaryQuery = usePersonalExpensesSummaryQuery(
    summaryQueryParams,
    enabled
  );
  const myPaidSummaryQuery = useMyPaidExpensesSummaryQuery(
    summaryQueryParams,
    enabled
  );

  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    Network.getNetworkStateAsync()
      .then((state) => {
        if (!isMounted) return;
        setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
      })
      .catch(() => {
        if (!isMounted) return;
        setIsOnline(true);
      });

    const subscription = Network.addNetworkStateListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const currency = enabled
    ? (sharedSummaryQuery.data?.currency ?? household?.currency ?? "USD")
    : (household?.currency ?? "USD");

  // When enabled=false, React Query keeps cached data; don't render it.
  const sharedTotal = enabled ? (sharedSummaryQuery.data?.total ?? 0) : 0;
  const personalTotal = enabled ? (personalSummaryQuery.data?.total ?? 0) : 0;
  const myPaidTotal = enabled ? (myPaidSummaryQuery.data?.total ?? 0) : 0;
  const greeting = useMemo(() => {
    const name = user?.displayName?.trim();
    const firstName = name ? name.split(/\s+/)[0] : "";
    return firstName ? `Hola, ${firstName}` : "Hola";
  }, [user?.displayName]);
  const isSyncing =
    enabled &&
    (sharedSummaryQuery.isFetching ||
      personalSummaryQuery.isFetching ||
      myPaidSummaryQuery.isFetching);

  const avatarStatus: UserAvatarPresenceStatus = !isOnline
    ? "offline"
    : isSyncing
      ? "syncing"
      : "online";

  const hasError =
    sharedSummaryQuery.isError ||
    personalSummaryQuery.isError ||
    myPaidSummaryQuery.isError;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header con avatar, saludo y botón de notificaciones */}
          <View style={styles.headerRow}>
            <UserAvatarStatus
              displayName={user?.displayName}
              email={user?.email}
              status={avatarStatus}
              onPress={() => router.push("/profile" as any)}
              style={styles.avatarWrapper}
            />

            <View style={styles.greetingWrap}>
              <ThemedText
                type="title"
                accessibilityRole="header"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.greeting}
              >
                {greeting}
              </ThemedText>
            </View>

            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={styles.notificationButton}
              accessibilityRole="button"
              accessibilityLabel={`Ver notificaciones. ${unreadCount} sin leer`}
            >
              <Ionicons name="notifications-outline" size={26} color={tint} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          </View>

          <PeriodFilter
            value={period}
            onChange={setPeriod}
            onResetToCurrent={() => setPeriod(getCurrentPeriodValue())}
            helperText={
              enabled
                ? undefined
                : "Inicia sesión y selecciona un hogar para ver los totales."
            }
          />

          {hasError && (
            <View
              style={StyleSheet.flatten([
                styles.errorBox,
                {
                  borderColor: String(primary) + "22",
                  backgroundColor: String(primary) + "0D",
                },
              ])}
            >
              <Ionicons name="alert-circle-outline" size={18} color={primary} />
              <ThemedText style={styles.errorText}>
                No se pudo cargar el resumen. Revisa tu conexión e inténtalo de
                nuevo.
              </ThemedText>
            </View>
          )}

          <View style={styles.cardRow}>
            <Link
              href={{
                pathname: "/expenses/shared",
                params: { from, to, mode: period.mode },
              }}
              asChild
            >
              <SummaryCard
                title="Compartido"
                value={formatCurrency(sharedTotal, currency)}
                description="Compras de la lista compartida del hogar."
                icon="people-outline"
                accentColor={red}
                loading={enabled && sharedSummaryQuery.isFetching}
                periodLabel={periodLabel}
                accessibilityHint="Abre el historial de gastos compartidos"
              />
            </Link>

            <Link
              href={{
                pathname: "/expenses/personal",
                params: { from, to, mode: period.mode },
              }}
              asChild
            >
              <SummaryCard
                title="Personal"
                value={formatCurrency(personalTotal, currency)}
                description="Compras hechas en tus listas personales."
                icon="person-outline"
                accentColor={yellow}
                loading={enabled && personalSummaryQuery.isFetching}
                periodLabel={periodLabel}
                accessibilityHint="Abre el historial de gastos personales"
              />
            </Link>

            <Link
              href={{
                pathname: "/expenses/mine",
                params: { from, to, mode: period.mode },
              }}
              asChild
            >
              <SummaryCard
                title="Yo pagué"
                value={formatCurrency(myPaidTotal, currency)}
                description="Todos los gastos del hogar con mi pago."
                icon="wallet-outline"
                accentColor={green}
                loading={enabled && myPaidSummaryQuery.isFetching}
                periodLabel={periodLabel}
                accessibilityHint="Abre el historial de gastos pagados por mí"
              />
            </Link>
          </View>

          <View style={styles.actions}>
            <Link href={"/lists" as any} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ir a listas"
                style={StyleSheet.flatten([
                  styles.secondaryButton,
                  { borderColor: String(border) },
                  { backgroundColor: surface },
                ])}
              >
                <ThemedText type="defaultSemiBold">Ver listas</ThemedText>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
  },
  avatarWrapper: {
    marginTop: 12,
    flexShrink: 0,
  },
  greetingWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  greeting: {
    paddingTop: 15,
    paddingBottom: 5,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    marginTop: 12,
    flexShrink: 0,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  subtitle: { opacity: 0.8 },
  cardRow: {
    marginTop: 8,
    gap: 12,
  },
  muted: {
    opacity: 0.65,
    fontSize: 12,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    opacity: 0.85,
    lineHeight: 16,
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
});
