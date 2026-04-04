import { Ionicons } from "@expo/vector-icons";
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
import { useThemeColors } from "@/hooks/use-theme-colors";
import { InventoryMovementsProductPickerField } from "@/screens/inventory/components/InventoryMovementsProductPickerField";
import {
  DEFAULT_INVENTORY_MOVEMENTS_ORDER,
  normalizeInventoryMovementsFilter,
  sanitizeInventoryMovementsDateRange,
  type InventoryMovementsFilterValue,
} from "@/screens/inventory/components/inventoryMovementsFilter.shared";
import {
  INVENTORY_MOVEMENT_TYPES,
  inventoryValueLabel,
  type InventoryMovementType,
} from "@/types/inventory";
import { a11yButton } from "@/utils/accessibility";

type SelectOption = {
  value: string;
  label: string;
};

function parseIso(iso?: string) {
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function formatLocalDate(date?: Date) {
  if (!date) return "—";
  return date.toLocaleDateString();
}

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isoRangeToday() {
  const now = new Date();
  return {
    from: startOfLocalDay(now).toISOString(),
    to: endOfLocalDay(now).toISOString(),
  };
}

function isoRangeLastNDays(n: number) {
  const safeN = Math.max(1, Math.floor(n));
  const end = endOfLocalDay(new Date());
  const start = startOfLocalDay(end);
  start.setDate(start.getDate() - (safeN - 1));
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

function isoRangeThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return {
    from: start.toISOString(),
    to: endOfLocalDay(now).toISOString(),
  };
}

export const InventoryMovementsFilterModal = React.memo(
  function InventoryMovementsFilterModal({
    visible,
    value,
    selectedProductName,
    onApply,
    onClose,
  }: {
    visible: boolean;
    value: InventoryMovementsFilterValue;
    selectedProductName?: string;
    onApply: (
      next: InventoryMovementsFilterValue,
      meta?: { selectedProductName?: string }
    ) => void;
    onClose: () => void;
  }) {
    const { border, primary, onPrimary, icon } = useThemeColors();
    const [draft, setDraft] = useState<InventoryMovementsFilterValue>(() =>
      normalizeInventoryMovementsFilter(value)
    );
    const [selectedProductLabel, setSelectedProductLabel] = useState<
      string | undefined
    >(selectedProductName);
    const [picker, setPicker] = useState<null | {
      kind: "from" | "to";
      date: Date;
    }>(null);

    React.useEffect(() => {
      if (!visible) return;
      setDraft(normalizeInventoryMovementsFilter(value));
      setSelectedProductLabel(selectedProductName);
      setPicker(null);
    }, [visible, value, selectedProductName]);

    const fromDate = useMemo(() => parseIso(draft.from), [draft.from]);
    const toDate = useMemo(() => parseIso(draft.to), [draft.to]);

    const movementTypeOptions: SelectOption[] = useMemo(
      () => [
        { value: "", label: "Todos los tipos" },
        ...INVENTORY_MOVEMENT_TYPES.map((type) => ({
          value: type,
          label: inventoryValueLabel(type),
        })),
      ],
      []
    );

    const orderOptions: SelectOption[] = useMemo(
      () => [
        { value: "DESC", label: "Más recientes primero" },
        { value: "ASC", label: "Más antiguos primero" },
      ],
      []
    );

    const openDatePicker = (kind: "from" | "to") => {
      const fallback = new Date();
      const date =
        kind === "from" ? (fromDate ?? fallback) : (toDate ?? fallback);
      setPicker({ kind, date });
    };

    const onPicked = (event: DateTimePickerEvent, selected?: Date) => {
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

      setDraft((prev) =>
        picker.kind === "from"
          ? {
              ...prev,
              from: startOfLocalDay(selected).toISOString(),
            }
          : {
              ...prev,
              to: endOfLocalDay(selected).toISOString(),
            }
      );
    };

    const applyFilter = () => {
      const clean = sanitizeInventoryMovementsDateRange({
        productId: draft.productId || undefined,
        movementType: draft.movementType,
        from: draft.from,
        to: draft.to,
        order: draft.order ?? DEFAULT_INVENTORY_MOVEMENTS_ORDER,
      });

      onApply(clean, {
        selectedProductName: clean.productId ? selectedProductLabel : undefined,
      });
      onClose();
    };

    const clearFilter = () => {
      setDraft({ order: DEFAULT_INVENTORY_MOVEMENTS_ORDER });
      setSelectedProductLabel(undefined);
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={[
              styles.modalCard,
              {
                borderColor: String(border),
              },
            ]}
          >
            <ThemedText type="subtitle">Filtrar movimientos</ThemedText>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <InventoryMovementsProductPickerField
                value={draft.productId ?? ""}
                selectedLabel={selectedProductLabel}
                onSelect={(nextProductId, nextProductName) => {
                  setDraft((prev) => ({
                    ...prev,
                    productId: nextProductId,
                  }));
                  setSelectedProductLabel(nextProductName);
                }}
              />

              <SelectField
                label="Tipo"
                value={draft.movementType ?? ""}
                options={movementTypeOptions}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    movementType:
                      (next as InventoryMovementType | "") || undefined,
                  }))
                }
                iconColor={String(icon)}
              />

              <SelectField
                label="Orden"
                value={draft.order ?? DEFAULT_INVENTORY_MOVEMENTS_ORDER}
                options={orderOptions}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    order: next === "ASC" ? "ASC" : "DESC",
                  }))
                }
                iconColor={String(icon)}
              />

              <View style={styles.dateRow}>
                <Pressable
                  {...a11yButton("Seleccionar fecha desde")}
                  onPress={() => openDatePicker("from")}
                  style={[styles.dateButton, { borderColor: String(border) }]}
                >
                  <ThemedText style={styles.dateLabel}>Desde</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {formatLocalDate(fromDate)}
                  </ThemedText>
                </Pressable>

                <Pressable
                  {...a11yButton("Seleccionar fecha hasta")}
                  onPress={() => openDatePicker("to")}
                  style={[styles.dateButton, { borderColor: String(border) }]}
                >
                  <ThemedText style={styles.dateLabel}>Hasta</ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {formatLocalDate(toDate)}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.quickRow}>
                <Pressable
                  {...a11yButton("Filtrar hoy")}
                  onPress={() =>
                    setDraft((prev) => ({ ...prev, ...isoRangeToday() }))
                  }
                  style={[styles.quickButton, { borderColor: String(border) }]}
                >
                  <ThemedText type="defaultSemiBold">Hoy</ThemedText>
                </Pressable>
                <Pressable
                  {...a11yButton("Filtrar últimos siete días")}
                  onPress={() =>
                    setDraft((prev) => ({ ...prev, ...isoRangeLastNDays(7) }))
                  }
                  style={[styles.quickButton, { borderColor: String(border) }]}
                >
                  <ThemedText type="defaultSemiBold">7 días</ThemedText>
                </Pressable>
                <Pressable
                  {...a11yButton("Filtrar este mes")}
                  onPress={() =>
                    setDraft((prev) => ({ ...prev, ...isoRangeThisMonth() }))
                  }
                  style={[styles.quickButton, { borderColor: String(border) }]}
                >
                  <ThemedText type="defaultSemiBold">Este mes</ThemedText>
                </Pressable>
                <Pressable
                  {...a11yButton("Limpiar filtros")}
                  onPress={clearFilter}
                  style={[styles.quickButton, { borderColor: String(border) }]}
                >
                  <ThemedText type="defaultSemiBold">Limpiar</ThemedText>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                {...a11yButton("Cerrar")}
                onPress={onClose}
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: String(border),
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold">Cerrar</ThemedText>
              </Pressable>

              <Pressable
                {...a11yButton("Aplicar filtros")}
                onPress={applyFilter}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: String(primary),
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                  Aplicar
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>

        {picker && Platform.OS !== "ios" ? (
          <DateTimePicker
            value={picker.date}
            mode="date"
            display="default"
            onChange={onPicked}
          />
        ) : null}

        {picker && Platform.OS === "ios" ? (
          <Modal
            transparent
            animationType="fade"
            visible
            onRequestClose={() => setPicker(null)}
          >
            <View style={styles.pickerOverlay}>
              <ThemedView
                style={[
                  styles.pickerCard,
                  {
                    borderColor: String(border),
                  },
                ]}
              >
                <View style={styles.pickerHeader}>
                  <ThemedText type="defaultSemiBold">
                    {picker.kind === "from" ? "Desde" : "Hasta"}
                  </ThemedText>
                  <Pressable
                    {...a11yButton("Cerrar selector de fecha")}
                    onPress={() => setPicker(null)}
                  >
                    <Ionicons name="close" size={20} color={String(icon)} />
                  </Pressable>
                </View>
                <DateTimePicker
                  value={picker.date}
                  mode="date"
                  display="inline"
                  onChange={onPicked}
                />
              </ThemedView>
            </View>
          </Modal>
        ) : null}
      </Modal>
    );
  }
);

function SelectField({
  label,
  value,
  options,
  onChange,
  iconColor,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (next: string) => void;
  iconColor: string;
}) {
  const { border, surface, primary, text } = useThemeColors();
  const [open, setOpen] = useState(false);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <>
      <Pressable
        {...a11yButton(`Seleccionar ${label.toLowerCase()}`)}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            borderColor: String(border),
            backgroundColor: String(surface),
          },
        ]}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {selected?.label ?? "Seleccionar"}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={16} color={iconColor} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={[
              styles.selectModalCard,
              {
                borderColor: String(border),
              },
            ]}
          >
            <ThemedText type="subtitle">{label}</ThemedText>

            <ScrollView
              style={styles.selectScroll}
              contentContainerStyle={styles.selectScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <Pressable
                    key={`${label}-${option.value || "all"}`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.optionRow,
                      {
                        borderColor: String(border),
                        backgroundColor: isSelected
                          ? `${String(primary)}22`
                          : "transparent",
                      },
                    ]}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={{
                        color: isSelected ? String(primary) : String(text),
                      }}
                    >
                      {option.label}
                    </ThemedText>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={String(primary)}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              {...a11yButton("Cerrar")}
              onPress={() => setOpen(false)}
              style={[
                styles.secondaryButton,
                {
                  borderColor: String(border),
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">Cerrar</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

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
    maxWidth: 540,
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
    gap: 10,
    paddingBottom: 4,
  },
  field: {
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  fieldLabel: {
    opacity: 0.68,
    fontSize: 12,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 56,
    justifyContent: "center",
    gap: 2,
  },
  dateLabel: {
    opacity: 0.7,
    fontSize: 13,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  selectModalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "86%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  selectScroll: {
    flexGrow: 0,
  },
  selectScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  optionRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 460,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
