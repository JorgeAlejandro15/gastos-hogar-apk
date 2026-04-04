import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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
  const [keyboardInset, setKeyboardInset] = useState(0);

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

  React.useEffect(() => {
    if (!visible) return;

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

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
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 24 + keyboardInset },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
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
                  <View style={styles.rowItemMd}>
                    <TextField
                      placeholder="Stock mínimo (Opcional)"
                      value={minThreshold}
                      onChangeText={setMinThreshold}
                      keyboardType="decimal-pad"
                      helperText="Si bajas de aquí, te avisamos como stock bajo."
                    />
                  </View>

                  <View style={styles.rowItemMd}>
                    <TextField
                      placeholder="Cantidad para reponer (Opcional)"
                      value={reorderPoint}
                      onChangeText={setReorderPoint}
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

                <TextField
                  placeholder="Notas (opcional)"
                  value={notes}
                  onChangeText={setNotes}
                />

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
