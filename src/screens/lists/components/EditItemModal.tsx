import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EXPENSE_CATEGORIES } from "@/constants/expense-categories";
import { a11yButton } from "@/utils/accessibility";

export type EditItemModalProps = {
  visible: boolean;
  isCompact: boolean;
  isNarrow: boolean;
  text: string;
  tint: string;
  name: string;
  amount: string;
  price: string;
  category: string;

  onChangeName: (v: string) => void;
  onChangeAmount: (v: string) => void;
  onChangePrice: (v: string) => void;
  onChangeCategory: (v: string) => void;

  onCancel: () => void;
  onSave: () => void;
};

export const EditItemModal = React.memo(function EditItemModal({
  visible,
  isCompact,
  isNarrow,
  text,
  tint,
  name,
  amount,
  price,
  category,
  onChangeName,
  onChangeAmount,
  onChangePrice,
  onChangeCategory,
  onCancel,
  onSave,
}: EditItemModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kbContainer}
        >
          <ThemedView
            style={[styles.modalCard, { borderColor: String(text) + "22" }]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedText type="subtitle">Editar producto</ThemedText>

              <View style={styles.fieldFullWrap}>
                <TextField
                  placeholder="Nombre"
                  value={name}
                  onChangeText={onChangeName}
                  autoCapitalize="sentences"
                />
              </View>

              <View style={styles.gridRow}>
                <View
                  style={StyleSheet.flatten([
                    styles.half,
                    isNarrow && styles.fullOnNarrow,
                  ])}
                >
                  <TextField
                    placeholder="Cant"
                    value={amount}
                    onChangeText={onChangeAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View
                  style={StyleSheet.flatten([
                    styles.half,
                    isNarrow && styles.fullOnNarrow,
                  ])}
                >
                  <TextField
                    placeholder="Precio"
                    value={price}
                    onChangeText={onChangePrice}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.full}>
                  <SelectField
                    title="Categoría"
                    placeholder="Categoría"
                    value={category}
                    onChange={onChangeCategory}
                    allowEmpty
                    emptyLabel="Sin categoría"
                    options={EXPENSE_CATEGORIES.map((c) => ({
                      label: c,
                      value: c,
                    }))}
                  />
                </View>
              </View>

              <View
                style={StyleSheet.flatten([
                  styles.modalActions,
                  isCompact && styles.modalActionsCompact,
                ])}
              >
                <Pressable
                  {...a11yButton("Cancelar")}
                  onPress={onCancel}
                  style={StyleSheet.flatten([
                    styles.secondaryButton,
                    { borderColor: String(text) + "22" },
                    isCompact && styles.modalButtonCompact,
                    !isCompact && styles.spacingRightOnly,
                    isCompact && styles.spacingBottomOnly,
                  ])}
                >
                  <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
                </Pressable>

                <Pressable
                  {...a11yButton("Guardar")}
                  onPress={onSave}
                  style={StyleSheet.flatten([
                    styles.primaryButton,
                    { backgroundColor: String(tint) },
                    isCompact && styles.modalButtonCompact,
                  ])}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.primaryButtonText, { color: text }]}
                  >
                    Guardar
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </ThemedView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  kbContainer: {
    width: "100%",
    maxWidth: 520,
  },
  modalCard: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  scrollContent: {
    gap: 12,
  },
  fieldFullWrap: {
    width: "100%",
  },

  // Grid
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  half: {
    width: "48%",
    minWidth: 120,
    marginBottom: 10,
    padding: 1,
  },
  fullOnNarrow: {
    width: "100%",
  },
  full: {
    width: "100%",
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
