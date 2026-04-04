import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage, getApiErrorStatus } from "@/api/api";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { DateField } from "@/screens/incomes/components/DateField";
import {
  INVENTORY_UNITS,
  inventoryValueLabel,
  type InventoryProductApi,
  type InventoryUnit,
  type UpdateInventoryProductDto,
} from "@/types/inventory";
import { a11yButton } from "@/utils/accessibility";

type FocusFieldKey = "minThreshold" | "reorderPoint" | "notes";

function toNumberOrUndefined(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return Number.NaN;
  return parsed;
}

export function InventoryProductEditModal({
  visible,
  product,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  product: InventoryProductApi | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (dto: UpdateInventoryProductDto) => Promise<void>;
}) {
  const { text, border, surface, primary, onPrimary, background } =
    useThemeColors();

  const [name, setName] = useState("");
  const [unit, setUnit] = useState<InventoryUnit>("unidad");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minThreshold, setMinThreshold] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsetsRef = useRef<Record<FocusFieldKey, number>>({
    minThreshold: -1,
    reorderPoint: -1,
    notes: -1,
  });
  const focusTopOffsetByField = useMemo<Record<FocusFieldKey, number>>(
    () => ({
      minThreshold: Platform.OS === "android" ? 35 : 25,
      reorderPoint: Platform.OS === "android" ? 25 : 20,
      notes: Platform.OS === "android" ? 0 : 6,
    }),
    []
  );

  const handleFieldLayout = React.useCallback(
    (field: FocusFieldKey) => (event: LayoutChangeEvent) => {
      fieldOffsetsRef.current[field] = event.nativeEvent.layout.y;
    },
    []
  );

  const handleFocusField = React.useCallback(
    (field: FocusFieldKey) => {
      const rawY = fieldOffsetsRef.current[field];

      if (!Number.isFinite(rawY) || rawY < 0) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        });
        return;
      }

      const targetY = Math.max(0, rawY - focusTopOffsetByField[field]);

      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      });

      // Refuerzo para release Android tras apertura completa del teclado.
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      }, 140);
    },
    [focusTopOffsetByField]
  );

  React.useEffect(() => {
    if (!visible || !product) return;

    setName(product.name);
    setUnit(product.unit);
    setCategory(product.category ?? "");
    setLocation(product.defaultLocation ?? "");
    setMinThreshold(
      typeof product.minThreshold === "number"
        ? String(product.minThreshold)
        : ""
    );
    setReorderPoint(
      typeof product.reorderPoint === "number"
        ? String(product.reorderPoint)
        : ""
    );
    setNotes(product.notes ?? "");
    setExpiresAt(product.expiresAt);
    setError(null);
  }, [visible, product]);

  const canSubmit = useMemo(() => {
    return !!product && name.trim().length >= 2 && !isSubmitting;
  }, [product, name, isSubmitting]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!product) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("El producto debe tener al menos 2 caracteres.");
      return;
    }

    const min = toNumberOrUndefined(minThreshold);
    const reorder = toNumberOrUndefined(reorderPoint);

    if (typeof min === "number" && Number.isNaN(min)) {
      setError("El umbral mínimo debe ser numérico.");
      return;
    }

    if (typeof reorder === "number" && Number.isNaN(reorder)) {
      setError("El punto de reposición debe ser numérico.");
      return;
    }

    if (typeof min === "number" && min < 0) {
      setError("El umbral mínimo no puede ser negativo.");
      return;
    }

    if (typeof reorder === "number" && reorder < 0) {
      setError("El punto de reposición no puede ser negativo.");
      return;
    }

    const dto: UpdateInventoryProductDto = {
      name: trimmedName,
      unit,
      category: category.trim() || undefined,
      defaultLocation: location.trim() || undefined,
      minThreshold: min,
      reorderPoint: reorder,
      notes: notes.trim() || undefined,
      expiresAt: expiresAt ?? undefined,
    };

    try {
      setError(null);
      await onSubmit(dto);
      onClose();
    } catch (e) {
      if (getApiErrorStatus(e) === 409) {
        setError(
          "Ya existe un producto con ese nombre en este hogar. Usa otro nombre o edita el existente."
        );
        return;
      }
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
        <ThemedView style={[styles.container, { backgroundColor: background }]}>
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          >
            <View style={styles.headerRow}>
              <ThemedText type="title">Editar producto</ThemedText>
              <Pressable
                {...a11yButton("Cerrar", "Cierra el formulario")}
                onPress={handleClose}
                disabled={isSubmitting}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={text} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.card,
                  {
                    borderColor: String(border),
                    backgroundColor: String(surface),
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold">
                  Datos del producto
                </ThemedText>

                <TextField
                  placeholder="Nombre (ej: Arroz integral)"
                  value={name}
                  onChangeText={setName}
                />

                <View style={styles.rowWrap}>
                  <View style={styles.rowItemMd}>
                    <SelectField
                      title="Unidad"
                      placeholder="Unidad"
                      value={unit}
                      onChange={(v) => setUnit(v as InventoryUnit)}
                      options={INVENTORY_UNITS.map((u) => ({
                        label: inventoryValueLabel(u),
                        value: u,
                      }))}
                      disabled={isSubmitting}
                    />
                  </View>

                  <View style={styles.rowItemMd}>
                    <TextField
                      placeholder="Categoría"
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>

                  <View style={styles.rowItemMd}>
                    <TextField
                      placeholder="Ubicación"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>
                </View>

                <View style={styles.rowWrap}>
                  <View
                    style={styles.rowItemMd}
                    onLayout={handleFieldLayout("minThreshold")}
                  >
                    <TextField
                      placeholder="Stock mínimo (Opcional)"
                      value={minThreshold}
                      onChangeText={setMinThreshold}
                      onFocus={() => handleFocusField("minThreshold")}
                      keyboardType="decimal-pad"
                      helperText="Si bajas de aquí, te avisamos como stock bajo."
                    />
                  </View>

                  <View
                    style={styles.rowItemMd}
                    onLayout={handleFieldLayout("reorderPoint")}
                  >
                    <TextField
                      placeholder="Cantidad para reponer (Opcional)"
                      value={reorderPoint}
                      onChangeText={setReorderPoint}
                      onFocus={() => handleFocusField("reorderPoint")}
                      keyboardType="decimal-pad"
                      helperText="Cantidad que deseas tener en stock para reponer."
                    />
                  </View>
                </View>

                <DateField
                  label="Vence"
                  valueIso={expiresAt}
                  onChange={setExpiresAt}
                  border={String(border)}
                  text={String(text)}
                  placeholder="Sin vencimiento"
                />

                <View onLayout={handleFieldLayout("notes")}>
                  <TextField
                    placeholder="Notas (opcional)"
                    value={notes}
                    onChangeText={setNotes}
                    onFocus={() => handleFocusField("notes")}
                  />
                </View>

                {error ? (
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                ) : null}

                <Pressable
                  {...a11yButton("Guardar cambios del producto")}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: String(primary),
                      opacity: canSubmit ? 1 : 0.6,
                    },
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={onPrimary} />
                  ) : (
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ color: onPrimary }}
                    >
                      Guardar cambios
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  keyboardContainer: {
    flex: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  scroll: {
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 26,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rowItemMd: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 170,
    gap: 8,
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#B00020",
    fontSize: 13,
  },
});
