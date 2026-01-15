import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { a11yButton } from "@/utils/accessibility";

import type { IsoRange } from "@/screens/lists/utils/dateRange";
import {
  isoRangeForExactLocalDay,
  isoRangeLastNDays,
  isoRangeThisMonth,
} from "@/screens/lists/utils/dateRange";

type Mode = "range" | "day";

export type HistoryDateFilterModalProps = {
  visible: boolean;
  text: string;
  tint: string;
  isCompact: boolean;

  value: IsoRange;
  onChange: (next: IsoRange) => void;
  onClose: () => void;
};

function formatLocalDate(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString();
}

function parseIso(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

function startOfLocalDay(d: Date) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function endOfLocalDay(d: Date) {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

export const HistoryDateFilterModal = React.memo(
  function HistoryDateFilterModal({
    visible,
    text,
    tint,
    isCompact,
    value,
    onChange,
    onClose,
  }: HistoryDateFilterModalProps) {
    const [mode, setMode] = useState<Mode>("range");

    const fromDate = useMemo(() => parseIso(value.from), [value.from]);
    const toDate = useMemo(() => parseIso(value.to), [value.to]);

    const [picker, setPicker] = useState<
      | null
      | { kind: "from"; date: Date }
      | { kind: "to"; date: Date }
      | { kind: "day"; date: Date }
    >(null);

    const quick = {
      clear: () => onChange({}),
      today: () => onChange(isoRangeForExactLocalDay(new Date())),
      last7: () => onChange(isoRangeLastNDays(7)),
      thisMonth: () => onChange(isoRangeThisMonth()),
    };

    const openPicker = (kind: "from" | "to" | "day") => {
      const fallback = new Date();
      const date =
        kind === "from"
          ? fromDate ?? fallback
          : kind === "to"
          ? toDate ?? fallback
          : fallback;
      setPicker({ kind, date });
    };

    const onPicked = (event: DateTimePickerEvent, selected?: Date) => {
      // Android: ignore cancel/dismiss. Some devices still pass a date even when dismissed.
      if (Platform.OS !== "ios") {
        if (event.type === "dismissed") {
          setPicker(null);
          return;
        }
        setPicker(null);
      }

      if (!picker) return;
      if (event.type === "dismissed") return;
      if (!selected) return;

      if (picker.kind === "day") {
        onChange(isoRangeForExactLocalDay(selected));
        return;
      }

      const next: IsoRange = {
        from: value.from,
        to: value.to,
      };

      if (picker.kind === "from")
        next.from = startOfLocalDay(selected).toISOString();
      if (picker.kind === "to") next.to = endOfLocalDay(selected).toISOString();

      onChange(next);

      // iOS keeps it open; leave it visible until user taps outside.
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalCard, { borderColor: text + "22" }]}>
            <ThemedText type="subtitle">Filtrar historial por fecha</ThemedText>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.segment, { borderColor: text + "22" }]}>
                <Pressable
                  {...a11yButton("Filtrar por rango")}
                  onPress={() => setMode("range")}
                  style={StyleSheet.flatten([
                    styles.segmentBtn,
                    mode === "range" && { backgroundColor: tint + "85" },
                  ])}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: mode === "range" ? text : text + "88" }}
                  >
                    Rango
                  </ThemedText>
                </Pressable>
                <Pressable
                  {...a11yButton("Filtrar por día exacto")}
                  onPress={() => setMode("day")}
                  style={StyleSheet.flatten([
                    styles.segmentBtn,
                    mode === "day" && { backgroundColor: tint + "85" },
                  ])}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: mode === "day" ? text : text + "88" }}
                  >
                    Día
                  </ThemedText>
                </Pressable>
              </View>

              {mode === "range" ? (
                <View style={styles.grid}>
                  <Pressable
                    {...a11yButton("Seleccionar fecha desde")}
                    onPress={() => openPicker("from")}
                    style={[styles.dateBtn, { borderColor: text + "22" }]}
                  >
                    <ThemedText style={{ opacity: 0.7, fontSize: 13 }}>
                      Desde
                    </ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {formatLocalDate(fromDate)}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    {...a11yButton("Seleccionar fecha hasta")}
                    onPress={() => openPicker("to")}
                    style={[styles.dateBtn, { borderColor: text + "22" }]}
                  >
                    <ThemedText style={{ opacity: 0.7, fontSize: 13 }}>
                      Hasta
                    </ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {formatLocalDate(toDate)}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  {...a11yButton("Seleccionar día")}
                  onPress={() => openPicker("day")}
                  style={[styles.dateBtn, { borderColor: text + "22" }]}
                >
                  <ThemedText style={{ opacity: 0.7, fontSize: 13 }}>
                    Día exacto
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {fromDate ? formatLocalDate(fromDate) : "Seleccionar"}
                  </ThemedText>
                </Pressable>
              )}

              <View style={styles.quickRow}>
                <Pressable
                  {...a11yButton("Hoy")}
                  onPress={quick.today}
                  style={[styles.quickBtn, { borderColor: text + "22" }]}
                >
                  <ThemedText type="defaultSemiBold">Hoy</ThemedText>
                </Pressable>
                <Pressable
                  {...a11yButton("Últimos 7 días")}
                  onPress={quick.last7}
                  style={[styles.quickBtn, { borderColor: text + "22" }]}
                >
                  <ThemedText type="defaultSemiBold">7 días</ThemedText>
                </Pressable>
                <Pressable
                  {...a11yButton("Este mes")}
                  onPress={quick.thisMonth}
                  style={[styles.quickBtn, { borderColor: text + "22" }]}
                >
                  <ThemedText type="defaultSemiBold">Este mes</ThemedText>
                </Pressable>
                <Pressable
                  {...a11yButton("Limpiar filtro")}
                  onPress={quick.clear}
                  style={[styles.quickBtn, { borderColor: text + "22" }]}
                >
                  <ThemedText type="defaultSemiBold">Limpiar</ThemedText>
                </Pressable>
              </View>

              {/* iOS inline picker takes space -> keep it INSIDE the scrollable area */}
              {picker && Platform.OS === "ios" ? (
                <View style={styles.iosPickerWrap}>
                  <DateTimePicker
                    value={picker.date}
                    mode="date"
                    display="inline"
                    onChange={onPicked}
                  />
                </View>
              ) : null}
            </ScrollView>

            <View
              style={StyleSheet.flatten([
                styles.modalActions,
                isCompact && styles.modalActionsCompact,
              ])}
            >
              <Pressable
                {...a11yButton("Cerrar")}
                onPress={onClose}
                style={StyleSheet.flatten([
                  styles.secondaryButton,
                  { borderColor: text + "22" },
                  isCompact && styles.modalButtonCompact,
                  !isCompact && styles.spacingRightOnly,
                  isCompact && styles.spacingBottomOnly,
                ])}
              >
                <ThemedText type="defaultSemiBold">Cerrar</ThemedText>
              </Pressable>

              <Pressable
                {...a11yButton("Aplicar")}
                onPress={onClose}
                style={StyleSheet.flatten([
                  styles.primaryButton,
                  { backgroundColor: tint },
                  isCompact && styles.modalButtonCompact,
                ])}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.primaryButtonText, { color: text }]}
                >
                  Aplicar
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>

        {/* Android uses native dialog; keep picker OUTSIDE layout so it doesn't push the modal */}
        {picker && Platform.OS !== "ios" ? (
          <DateTimePicker
            value={picker.date}
            mode="date"
            display="default"
            onChange={onPicked}
          />
        ) : null}
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  segment: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  grid: {
    flexDirection: "row",
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 56,
    justifyContent: "center",
    gap: 2,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  iosPickerWrap: {
    marginTop: 6,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalActionsCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  modalButtonCompact: {
    flex: 0,
    width: "100%",
  },
  spacingRightOnly: {
    marginRight: 10,
  },
  spacingBottomOnly: {
    marginBottom: 10,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  primaryButtonText: { color: "white" },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
});
