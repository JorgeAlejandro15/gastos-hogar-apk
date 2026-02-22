// File: src/components/dashboard/PeriodFilter.tsx
// Selector de periodo (Mes/Año) para filtrar resúmenes.
// - Sin dependencias externas (solo RN + Expo).
// - Accesible: labels/hints claros, modal con controles grandes.

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type PeriodMode = "month" | "year";

export type PeriodValue = {
  mode: PeriodMode;
  /** Año calendario, ej: 2026 */
  year: number;
  /** 0-11 (Enero=0) solo aplica cuando mode === 'month' */
  month: number;
};

export type PeriodFilterProps = {
  value: PeriodValue;
  onChange: (next: PeriodValue) => void;
  onResetToCurrent?: () => void;
  /** Texto para mostrar bajo el selector (opcional). */
  helperText?: string;
};

const MONTHS_ES = [
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
] as const;

function clampMonth(m: number) {
  if (m < 0) return 0;
  if (m > 11) return 11;
  return m;
}

export function PeriodFilter({
  value,
  onChange,
  onResetToCurrent,
  helperText,
}: PeriodFilterProps) {
  const { text, surface, border, primary, onPrimary, icon } = useThemeColors();
  const insets = useSafeAreaInsets();

  const [pickerOpen, setPickerOpen] = useState(false);

  const label = useMemo(() => {
    return value.mode === "year"
      ? `${value.year}`
      : `${MONTHS_ES[clampMonth(value.month)]} ${value.year}`;
  }, [value.mode, value.month, value.year]);

  const a11yLabel = useMemo(() => {
    return value.mode === "year"
      ? `Periodo seleccionado: año ${value.year}`
      : `Periodo seleccionado: ${MONTHS_ES[clampMonth(value.month)]} de ${
          value.year
        }`;
  }, [value.mode, value.month, value.year]);

  const years = useMemo(() => {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    // Rango amigable para seleccionar rápidamente.
    const start = Math.min(currentYear - 5, value.year - 5);
    const end = Math.max(currentYear + 5, value.year + 5);

    const out: number[] = [];
    for (let y = start; y <= end; y += 1) out.push(y);
    return out;
  }, [value.year]);

  const goPrev = () => {
    if (value.mode === "year") {
      onChange({ ...value, year: value.year - 1 });
      return;
    }

    // Mes anterior (manejando cambio de año)
    if (value.month === 0) {
      onChange({ ...value, year: value.year - 1, month: 11 });
    } else {
      onChange({ ...value, month: value.month - 1 });
    }
  };

  const goNext = () => {
    if (value.mode === "year") {
      onChange({ ...value, year: value.year + 1 });
      return;
    }

    // Mes siguiente (manejando cambio de año)
    if (value.month === 11) {
      onChange({ ...value, year: value.year + 1, month: 0 });
    } else {
      onChange({ ...value, month: value.month + 1 });
    }
  };

  const setMode = (mode: PeriodMode) => {
    if (mode === value.mode) return;
    onChange({ ...value, mode });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: surface, borderColor: border },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}
    >
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Ionicons name="calendar-outline" size={18} color={icon} />
          <ThemedText type="defaultSemiBold">Filtro</ThemedText>
        </View>

        <View style={[styles.segment, { borderColor: border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar por mes"
            accessibilityState={{ selected: value.mode === "month" }}
            onPress={() => setMode("month")}
            style={StyleSheet.flatten([
              styles.segmentButton,
              value.mode === "month" && {
                backgroundColor: primary,
                borderColor: primary,
              },
            ])}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{
                color: value.mode === "month" ? onPrimary : text,
                fontSize: 13,
              }}
            >
              Mes
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar por año"
            accessibilityState={{ selected: value.mode === "year" }}
            onPress={() => setMode("year")}
            style={StyleSheet.flatten([
              styles.segmentButton,
              value.mode === "year" && {
                backgroundColor: primary,
                borderColor: primary,
              },
            ])}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{
                color: value.mode === "year" ? onPrimary : text,
                fontSize: 13,
              }}
            >
              Año
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.periodRow}>
        <Pressable
          onPress={goPrev}
          accessibilityRole="button"
          accessibilityLabel={
            value.mode === "year" ? "Año anterior" : "Mes anterior"
          }
          style={[styles.iconButton, { borderColor: border }]}
        >
          <Ionicons name="chevron-back" size={18} color={icon} />
        </Pressable>

        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Cambiar periodo. Actual: ${label}`}
          accessibilityHint="Abre un selector para elegir mes y año"
          style={[styles.periodPill, { borderColor: border }]}
        >
          <ThemedText type="defaultSemiBold" style={styles.periodLabel}>
            {label}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color={icon} />
        </Pressable>

        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={
            value.mode === "year" ? "Año siguiente" : "Mes siguiente"
          }
          style={[styles.iconButton, { borderColor: border }]}
        >
          <Ionicons name="chevron-forward" size={18} color={icon} />
        </Pressable>

        {onResetToCurrent && (
          <Pressable
            onPress={onResetToCurrent}
            accessibilityRole="button"
            accessibilityLabel="Volver al periodo actual"
            style={[
              styles.resetButton,
              { borderColor: border, backgroundColor: String(primary) + "10" },
            ]}
          >
            <Ionicons name="refresh" size={16} color={primary} />
            <ThemedText
              type="defaultSemiBold"
              style={{ color: primary, fontSize: 13 }}
            >
              Hoy
            </ThemedText>
          </Pressable>
        )}
      </View>

      {!!helperText && (
        <ThemedText style={styles.helper} accessibilityRole="text">
          {helperText}
        </ThemedText>
      )}

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View
          style={StyleSheet.flatten([
            styles.backdrop,
            {
              paddingHorizontal: 15,
              paddingBottom: Math.max(insets.bottom, 12) + 15,
            },
          ])}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: surface, borderColor: border },
            ]}
          >
            <View style={styles.sheetHeader}>
              <ThemedText type="subtitle">Seleccionar periodo</ThemedText>
              <Pressable
                onPress={() => setPickerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar selector"
                style={[styles.closeButton, { borderColor: border }]}
              >
                <Ionicons name="close" size={18} color={icon} />
              </Pressable>
            </View>

            <ThemedText style={styles.sheetHint}>
              {value.mode === "year" ? "Elige un año" : "Elige un mes y un año"}
            </ThemedText>

            {value.mode === "month" && (
              <View style={styles.monthGrid}>
                {MONTHS_ES.map((m, idx) => {
                  const selected = idx === value.month;
                  return (
                    <Pressable
                      key={m}
                      accessibilityRole="button"
                      accessibilityLabel={`Mes ${m}`}
                      accessibilityState={{ selected }}
                      onPress={() => onChange({ ...value, month: idx })}
                      style={StyleSheet.flatten([
                        styles.chip,
                        { borderColor: border },
                        selected && {
                          backgroundColor: primary,
                          borderColor: primary,
                        },
                      ])}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={{
                          fontSize: 13,
                          color: selected ? onPrimary : text,
                        }}
                      >
                        {m.slice(0, 3)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <ScrollView
              style={styles.yearsScroll}
              contentContainerStyle={styles.yearsContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.yearGrid}>
                {years.map((y) => {
                  const selected = y === value.year;
                  return (
                    <Pressable
                      key={String(y)}
                      accessibilityRole="button"
                      accessibilityLabel={`Año ${y}`}
                      accessibilityState={{ selected }}
                      onPress={() => onChange({ ...value, year: y })}
                      style={StyleSheet.flatten([
                        styles.chip,
                        styles.yearChip,
                        { borderColor: border },
                        selected && {
                          backgroundColor: primary,
                          borderColor: primary,
                        },
                      ])}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={{
                          fontSize: 13,
                          color: selected ? onPrimary : text,
                        }}
                      >
                        {y}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => setPickerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Listo"
                style={[styles.primaryAction, { backgroundColor: primary }]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                  Listo
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  segment: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    overflow: "hidden",
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0,
  },

  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  periodPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  periodLabel: { fontSize: 14 },

  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },

  helper: { fontSize: 12, opacity: 0.7 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHint: { fontSize: 12, opacity: 0.7, marginTop: 6 },

  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  yearsScroll: { marginTop: 12, maxHeight: 220 },
  yearsContent: { paddingBottom: 4 },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 64,
    alignItems: "center",
  },
  yearChip: { minWidth: 72 },

  sheetActions: { marginTop: 14 },
  primaryAction: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});
