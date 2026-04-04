import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  INVENTORY_MOVEMENT_DIRECTIONS,
  INVENTORY_MOVEMENT_TYPES,
  inventoryValueLabel,
  type InventoryMovementDirection,
  type InventoryMovementType,
} from "@/types/inventory";
import { a11yButton } from "@/utils/accessibility";

export function InventoryMovementModal({
  visible,
  productName,
  movementType,
  direction,
  quantity,
  unitCost,
  reason,
  isSubmitting,
  onChangeMovementType,
  onChangeDirection,
  onChangeQuantity,
  onChangeUnitCost,
  onChangeReason,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  productName?: string;
  movementType: InventoryMovementType;
  direction: InventoryMovementDirection;
  quantity: string;
  unitCost: string;
  reason: string;
  isSubmitting: boolean;
  onChangeMovementType: (value: InventoryMovementType) => void;
  onChangeDirection: (value: InventoryMovementDirection) => void;
  onChangeQuantity: (value: string) => void;
  onChangeUnitCost: (value: string) => void;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { primary, onPrimary, border, surface, background } = useThemeColors();
  const isDirectionLocked = movementType !== "ajuste";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 14 : 0}
      >
        <View
          style={[
            styles.modalCard,
            {
              borderColor: String(border),
              backgroundColor: String(background),
            },
          ]}
        >
          <ThemedText type="subtitle">
            Movimiento: {productName ?? ""}
          </ThemedText>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LabeledPicker
              label="Tipo"
              value={movementType}
              options={INVENTORY_MOVEMENT_TYPES}
              onChange={(v) => onChangeMovementType(v as InventoryMovementType)}
            />

            <LabeledPicker
              label="Dirección"
              value={direction}
              options={
                isDirectionLocked ? [direction] : INVENTORY_MOVEMENT_DIRECTIONS
              }
              onChange={(v) =>
                onChangeDirection(v as InventoryMovementDirection)
              }
              disabled={isDirectionLocked}
            />

            <ThemedText style={styles.helperText}>
              {isDirectionLocked
                ? `Dirección automática para ${inventoryValueLabel(movementType)}.`
                : "En Ajuste puedes elegir incremento o decremento."}
            </ThemedText>

            <TextField
              placeholder="Cantidad"
              value={quantity}
              onChangeText={onChangeQuantity}
              keyboardType="decimal-pad"
            />
            <TextField
              placeholder="Costo unitario (opcional)"
              value={unitCost}
              onChangeText={onChangeUnitCost}
              keyboardType="decimal-pad"
            />
            <TextField
              placeholder="Motivo (opcional)"
              value={reason}
              onChangeText={onChangeReason}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable
              {...a11yButton("Cancelar")}
              onPress={onClose}
              style={[
                styles.secondaryButton,
                {
                  borderColor: String(border),
                  backgroundColor: String(surface),
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
            </Pressable>

            <Pressable
              {...a11yButton("Guardar movimiento")}
              onPress={onSubmit}
              disabled={isSubmitting}
              style={[
                styles.primaryButton,
                {
                  flex: 1,
                  backgroundColor: String(primary),
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                {isSubmitting ? "Guardando…" : "Guardar"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LabeledPicker({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { border, surface, primary, text, icon } = useThemeColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        {...a11yButton(
          disabled ? `${label} automático` : `Seleccionar ${label}`
        )}
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        disabled={disabled}
        style={[
          styles.pickerField,
          {
            borderColor: String(border),
            backgroundColor: String(surface),
            opacity: disabled ? 0.72 : 1,
          },
        ]}
      >
        <ThemedText>
          {label}: {inventoryValueLabel(value)}
        </ThemedText>
        <Ionicons name="chevron-down" size={16} color={String(icon)} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { borderColor: String(border), backgroundColor: String(surface) },
            ]}
          >
            <ThemedText type="subtitle">{label}</ThemedText>

            {options.map((opt) => {
              const selected = value === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  style={[
                    styles.optionRow,
                    {
                      borderColor: String(border),
                      backgroundColor: selected
                        ? `${String(primary)}22`
                        : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: selected ? String(primary) : String(text) }}
                  >
                    {inventoryValueLabel(opt)}
                  </ThemedText>
                  {selected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={String(primary)}
                    />
                  ) : null}
                </Pressable>
              );
            })}

            <Pressable
              {...a11yButton("Cerrar")}
              onPress={() => setOpen(false)}
              style={[
                styles.secondaryButton,
                {
                  borderColor: String(border),
                  backgroundColor: String(surface),
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">Cerrar</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    maxHeight: "92%",
  },
  formScroll: {
    flexShrink: 1,
  },
  formScrollContent: {
    gap: 10,
    marginBottom: 5,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.72,
    marginTop: -2,
    marginLeft: 10,
  },
  pickerField: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  primaryButton: {
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
