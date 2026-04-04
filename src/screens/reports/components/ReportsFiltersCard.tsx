// File: src/screens/reports/components/ReportsFiltersCard.tsx — Filtros (rango de fechas) para Reportes.

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { a11yButton } from "@/utils/accessibility";

import { DateField } from "@/screens/incomes/components/DateField";
import { toIsoEndOfDay, toIsoStartOfDay } from "@/screens/incomes/utils/dates";

function presetLastDays(days: number): { fromIso: string; toIso: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  return {
    fromIso: toIsoStartOfDay(from),
    toIso: toIsoEndOfDay(now),
  };
}

function presetThisMonth(): { fromIso: string; toIso: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    fromIso: toIsoStartOfDay(from),
    toIso: toIsoEndOfDay(now),
  };
}

export function ReportsFiltersCard({
  cardBg,
  border,
  text,
  primary,
  fromIso,
  toIso,
  onFromIso,
  onToIso,
  onClear,
  expanded,
  onToggleExpanded,
}: {
  cardBg: string;
  border: string;
  text: string;
  primary: string;
  fromIso: string | null;
  toIso: string | null;
  onFromIso: (v: string | null) => void;
  onToIso: (v: string | null) => void;
  onClear: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const presets = useMemo(
    () => [
      { key: "7d", label: "7 días", value: presetLastDays(7) },
      { key: "30d", label: "30 días", value: presetLastDays(30) },
      { key: "month", label: "Este mes", value: presetThisMonth() },
    ],
    []
  );

  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
    >
      <View style={styles.titleRow}>
        <Pressable
          {...a11yButton(
            expanded ? "Colapsar filtros" : "Expandir filtros",
            "Muestra u oculta los filtros"
          )}
          onPress={onToggleExpanded}
          style={styles.toggleBtn}
        >
          <ThemedText type="defaultSemiBold">Filtros</ThemedText>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={text}
          />
        </Pressable>
        <Pressable
          {...a11yButton("Limpiar filtros", "Quita el rango de fechas")}
          onPress={onClear}
          style={[styles.clearBtn, { borderColor: border }]}
        >
          <ThemedText type="link">Limpiar</ThemedText>
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.filtersContent}>
          <View style={styles.presetsRow}>
            {presets.map((p) => (
              <Pressable
                key={p.key}
                {...a11yButton(
                  `Aplicar preset ${p.label}`,
                  "Configura un rango de fechas rápido"
                )}
                onPress={() => {
                  onFromIso(p.value.fromIso);
                  onToIso(p.value.toIso);
                }}
                style={[
                  styles.preset,
                  {
                    borderColor: border,
                    backgroundColor: String(primary) + "10",
                  },
                ]}
              >
                <ThemedText style={{ color: text }}>{p.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.datesRow}>
            <View style={{ flex: 1 }}>
              <DateField
                label="Desde"
                valueIso={fromIso}
                onChange={(iso) => {
                  if (!iso) return onFromIso(null);
                  onFromIso(toIsoStartOfDay(new Date(iso)));
                }}
                border={border}
                text={text}
                placeholder="Inicio"
              />
            </View>
            <View style={{ flex: 1 }}>
              <DateField
                label="Hasta"
                valueIso={toIso}
                onChange={(iso) => {
                  if (!iso) return onToIso(null);
                  onToIso(toIsoEndOfDay(new Date(iso)));
                }}
                border={border}
                text={text}
                placeholder="Fin"
              />
            </View>
          </View>

          <ThemedText style={styles.muted}>
            Nota: el rango aplica a los gráficos.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  filtersContent: {
    gap: 12,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  preset: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  datesRow: {
    flexDirection: "row",
    gap: 10,
  },
  muted: {
    opacity: 0.7,
  },
});
