import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
  type CreateInventoryProductDto,
  type InventoryUnit,
} from "@/types/inventory";
import { a11yButton } from "@/utils/accessibility";

export function InventoryProductFormModal({
  visible,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateInventoryProductDto) => Promise<void>;
}) {
  const { text, border, surface, primary, onPrimary, background } =
    useThemeColors();

  const [name, setName] = useState("");
  const [unit, setUnit] = useState<InventoryUnit>("unidad");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minThreshold, setMinThreshold] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && !isSubmitting;
  }, [name, isSubmitting]);

  React.useEffect(() => {
    if (!visible) return;
    setError(null);
  }, [visible]);

  const resetForm = () => {
    setName("");
    setUnit("unidad");
    setCategory("");
    setLocation("");
    setMinThreshold("");
    setReorderPoint("");
    setInitialQuantity("");
    setNotes("");
    setExpiresAt(null);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("El producto debe tener al menos 2 caracteres.");
      return;
    }

    const min = minThreshold.trim() ? Number(minThreshold) : undefined;
    const reorder = reorderPoint.trim() ? Number(reorderPoint) : undefined;
    const initial = initialQuantity.trim()
      ? Number(initialQuantity)
      : undefined;

    if (typeof min === "number" && Number.isNaN(min)) {
      setError("El umbral mínimo debe ser numérico.");
      return;
    }

    if (typeof reorder === "number" && Number.isNaN(reorder)) {
      setError("El punto de reposición debe ser numérico.");
      return;
    }

    if (typeof initial === "number" && Number.isNaN(initial)) {
      setError("La cantidad inicial debe ser numérica.");
      return;
    }

    if (typeof initial === "number" && initial < 0) {
      setError("La cantidad inicial no puede ser negativa.");
      return;
    }

    try {
      setError(null);
      await onSubmit({
        name: trimmed,
        unit,
        category: category.trim() || undefined,
        defaultLocation: location.trim() || undefined,
        minThreshold: min,
        reorderPoint: reorder,
        initialQuantity: initial,
        notes: notes.trim() || undefined,
        expiresAt: expiresAt ?? undefined,
      });

      resetForm();
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
          <View style={styles.headerRow}>
            <ThemedText type="title">Nuevo producto</ThemedText>
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
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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
              <ThemedText type="defaultSemiBold">Datos básicos</ThemedText>

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
                    placeholder="Cantidad inicial (Opcional)"
                    value={initialQuantity}
                    onChangeText={setInitialQuantity}
                    keyboardType="decimal-pad"
                    helperText="Se guarda en stock y crea movimiento inicial."
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
                {...a11yButton("Crear producto")}
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
                    + Crear producto
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </ScrollView>
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
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 24,
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
    gap: 10,
  },
  rowItemMd: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 170,
    gap: 10,
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
