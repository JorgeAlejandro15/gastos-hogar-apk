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
import { useThemeTokens } from "@/providers/ThemeTokensProvider";
import { type ShoppingItemType } from "@/types/lists";
import { a11yButton } from "@/utils/accessibility";
import { parseDecimalInput } from "@/utils/number";

export type EditItemModalProps = {
  visible: boolean;
  isCompact: boolean;
  isNarrow: boolean;
  text: string;
  tint: string;
  border: string;
  name: string;
  amount: string;
  price: string;
  category: string;
  itemType: ShoppingItemType;
  syncToInventory: boolean;

  onChangeName: (v: string) => void;
  onChangeAmount: (v: string) => void;
  onChangePrice: (v: string) => void;
  onChangeCategory: (v: string) => void;
  onChangeItemType: (v: ShoppingItemType) => void;
  onChangeSyncToInventory: (v: boolean) => void;

  onCancel: () => void;
  onSave: () => void;
};

export const EditItemModal = React.memo(function EditItemModal({
  visible,
  isCompact,
  isNarrow,
  text,
  tint,
  border,
  name,
  amount,
  price,
  category,
  itemType,
  syncToInventory,
  onChangeName,
  onChangeAmount,
  onChangePrice,
  onChangeCategory,
  onChangeItemType,
  onChangeSyncToInventory,
  onCancel,
  onSave,
}: EditItemModalProps) {
  const isService = itemType === "service";
  const { scheme } = useThemeTokens();
  const isDarkMode = scheme === "dark";

  const selectedButtonBg = String(tint);
  const unselectedButtonBg = isDarkMode ? "transparent" : `${String(tint)}14`;
  const selectedButtonTextColor = String(text);
  const unselectedButtonTextColor = isDarkMode ? String(text) : String(tint);

  const parsedPrice = React.useMemo(() => parseDecimalInput(price), [price]);
  const priceError = React.useMemo(() => {
    if (parsedPrice == null) return null;
    return parsedPrice < 1 ? "El precio debe ser mayor o igual a 1." : null;
  }, [parsedPrice]);

  const isSaveDisabled = !!priceError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={styles.kbContainer}
        >
          <ThemedView
            style={[styles.modalCard, { borderColor: String(text) + "22" }]}
          >
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              nestedScrollEnabled
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedText type="subtitle">Editar artículo</ThemedText>

              <View style={styles.fieldFullWrap}>
                <TextField
                  placeholder="Nombre"
                  value={name}
                  onChangeText={onChangeName}
                  autoCapitalize="sentences"
                />
              </View>

              <View style={styles.gridRow}>
                <View style={[styles.full, { marginBottom: 10 }]}>
                  <SelectField
                    title="Tipo"
                    placeholder="Tipo de item"
                    value={itemType}
                    onChange={(v) => onChangeItemType(v as ShoppingItemType)}
                    options={[
                      { label: "Producto", value: "product" },
                      { label: "Servicio", value: "service" },
                    ]}
                  />
                </View>

                <View
                  style={StyleSheet.flatten([
                    styles.full,
                    styles.inventoryAutoCard,
                    {
                      borderColor: border,
                      backgroundColor: String(tint) + "08",
                      marginBottom: 10,
                    },
                  ])}
                >
                  <ThemedText type="defaultSemiBold">
                    Inventario automático
                  </ThemedText>
                  <ThemedText style={styles.helperText}>
                    {isService
                      ? "En tipo Servicio se desactiva la sincronización con inventario."
                      : "Controla si este artículo se sincroniza automáticamente con Inventario."}
                  </ThemedText>

                  <View
                    style={StyleSheet.flatten([
                      styles.inventoryToggleRow,
                      isService && { opacity: 0.65 },
                    ])}
                  >
                    <Pressable
                      {...a11yButton(
                        "Sí, sincronizar en inventario",
                        "Activa la sincronización automática para este artículo"
                      )}
                      onPress={() => onChangeSyncToInventory(true)}
                      disabled={isService}
                      style={({ pressed }) => [
                        styles.inventoryToggleButton,
                        {
                          borderColor: syncToInventory ? String(tint) : border,
                          backgroundColor: syncToInventory
                            ? selectedButtonBg
                            : unselectedButtonBg,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={{
                          color: syncToInventory
                            ? selectedButtonTextColor
                            : unselectedButtonTextColor,
                        }}
                      >
                        Sí, sincronizar
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      {...a11yButton(
                        "No sincronizar en inventario",
                        "Desactiva la sincronización automática para este artículo"
                      )}
                      onPress={() => onChangeSyncToInventory(false)}
                      disabled={isService}
                      style={({ pressed }) => [
                        styles.inventoryToggleButton,
                        {
                          borderColor: !syncToInventory ? String(tint) : border,
                          backgroundColor: !syncToInventory
                            ? selectedButtonBg
                            : unselectedButtonBg,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={{
                          color: !syncToInventory
                            ? selectedButtonTextColor
                            : unselectedButtonTextColor,
                        }}
                      >
                        No sincronizar
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

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
                    errorText={priceError}
                  />
                  {priceError ? (
                    <ThemedText
                      style={styles.errorText}
                      accessibilityLiveRegion="polite"
                    >
                      {priceError}
                    </ThemedText>
                  ) : null}
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
                    { borderColor: border },
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
                  disabled={isSaveDisabled}
                  style={StyleSheet.flatten([
                    styles.primaryButton,
                    { backgroundColor: String(tint) },
                    isCompact && styles.modalButtonCompact,
                    isSaveDisabled && styles.primaryButtonDisabled,
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
    maxHeight: "100%",
    flexShrink: 1,
  },
  modalCard: {
    width: "100%",
    maxHeight: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
  },
  scroll: {
    minHeight: 0,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  fieldFullWrap: {
    width: "100%",
  },
  helperText: {
    opacity: 0.72,
    fontSize: 12,
    lineHeight: 16,
  },
  inventoryAutoCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  inventoryToggleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  inventoryToggleButton: {
    flex: 1,
    minWidth: 140,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
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
  primaryButtonDisabled: {
    opacity: 0.6,
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
  errorText: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.9,
    color: "#D14343",
  },
});
