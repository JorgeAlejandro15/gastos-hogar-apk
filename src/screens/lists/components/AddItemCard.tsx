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

export type AddItemCardProps = {
  visible: boolean;
  onClose: () => void;

  text: string;
  tint: string;
  border: string;
  isCompact: boolean;
  name: string;
  amount: string;
  price: string;
  category: string;
  itemType: ShoppingItemType;
  syncToInventory: boolean;

  setName: (v: string) => void;
  setAmount: (v: string) => void;
  setPrice: (v: string) => void;
  setCategory: (v: string) => void;
  setItemType: (v: ShoppingItemType) => void;
  setSyncToInventory: (v: boolean) => void;

  isSaving: boolean;
  onAdd: () => void;
};

export const AddItemCard = React.memo(function AddItemCard({
  visible,
  onClose,
  text,
  tint,
  border,
  isCompact,
  name,
  amount,
  price,
  category,
  itemType,
  syncToInventory,
  setName,
  setAmount,
  setPrice,
  setCategory,
  setItemType,
  setSyncToInventory,
  isSaving,
  onAdd,
}: AddItemCardProps) {
  const isService = itemType === "service";
  const { scheme } = useThemeTokens();
  const isDarkMode = scheme === "dark";

  const selectedButtonBg = String(tint);
  const unselectedButtonBg = isDarkMode ? "transparent" : `${String(tint)}14`;
  const selectedButtonTextColor = String(text);
  const unselectedButtonTextColor = isDarkMode ? String(text) : String(tint);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kbContainer}
        >
          <ThemedView style={[styles.card, { borderColor: border }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedText type="defaultSemiBold">Agregar artículo</ThemedText>
              <ThemedText style={styles.helperText}>
                {isService
                  ? "Los servicios solo generan gasto al marcarse como comprados."
                  : "Los productos también se sincronizan con Inventario al comprarlos."}
              </ThemedText>

              <View style={styles.formRow}>
                <View style={styles.fieldFullWrap}>
                  <TextField
                    placeholder="Nombre (ej: Arroz)"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                    autoCapitalize="sentences"
                  />
                </View>
              </View>

              <View
                style={StyleSheet.flatten([styles.formRow, styles.formRowWrap])}
              >
                <View
                  style={StyleSheet.flatten([
                    styles.fieldFlexWrap,
                    isCompact && styles.fieldFullWrapCompact,
                    styles.spacingBottomOnly,
                  ])}
                >
                  <SelectField
                    title="Tipo"
                    placeholder="Tipo de item"
                    value={itemType}
                    onChange={(v) => setItemType(v as ShoppingItemType)}
                    options={[
                      { label: "Producto", value: "product" },
                      { label: "Servicio", value: "service" },
                    ]}
                    disabled={isSaving}
                  />
                </View>

                <View
                  style={StyleSheet.flatten([
                    styles.fieldFlexWrap,
                    isCompact && styles.fieldFullWrapCompact,
                    styles.spacingBottomOnly,
                    styles.inventoryAutoCard,
                    {
                      borderColor: border,
                      backgroundColor: String(tint) + "08",
                    },
                  ])}
                >
                  <ThemedText type="defaultSemiBold">
                    Inventario automático
                  </ThemedText>
                  <ThemedText style={styles.helperText}>
                    {isService
                      ? "En tipo Servicio esta opción se desactiva porque no sincroniza inventario."
                      : "Elige si este artículo debe crearse/sincronizarse automáticamente en Inventario."}
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
                        "Activa la creación y sincronización automática en inventario"
                      )}
                      onPress={() => setSyncToInventory(true)}
                      disabled={isSaving || isService}
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
                        "El artículo solo generará gasto y no se sincronizará en inventario"
                      )}
                      onPress={() => setSyncToInventory(false)}
                      disabled={isSaving || isService}
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
                    styles.fieldSmallWrap,
                    isCompact && styles.fieldHalfWrapCompact,
                    isCompact
                      ? styles.spacingRightBottom
                      : styles.spacingRightOnly,
                  ])}
                >
                  <TextField
                    placeholder="Cant"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View
                  style={StyleSheet.flatten([
                    styles.fieldSmallWrap,
                    isCompact && styles.fieldHalfWrapCompact,
                    isCompact
                      ? styles.spacingBottomOnly
                      : styles.spacingRightOnly,
                  ])}
                >
                  <TextField
                    placeholder="Precio"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View
                  style={StyleSheet.flatten([
                    styles.fieldFlexWrap,
                    isCompact && styles.fieldFullWrapCompact,
                  ])}
                >
                  <SelectField
                    title="Categoría"
                    placeholder="Categoría (opcional)"
                    value={category}
                    onChange={setCategory}
                    allowEmpty
                    emptyLabel="Sin categoría"
                    options={EXPENSE_CATEGORIES.map((c) => ({
                      label: c,
                      value: c,
                    }))}
                    disabled={isSaving}
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
                  onPress={onClose}
                  disabled={isSaving}
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
                  {...a11yButton("Agregar", "Añade el producto a la lista")}
                  onPress={onAdd}
                  disabled={isSaving}
                  style={StyleSheet.flatten([
                    styles.primaryButton,
                    {
                      backgroundColor: String(tint),
                      opacity: isSaving ? 0.7 : 1,
                    },
                    isCompact && styles.modalButtonCompact,
                  ])}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.primaryButtonText, { color: text }]}
                  >
                    {isSaving ? "Agregando…" : "+ Agregar"}
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
  card: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
  },
  scrollContent: {
    gap: 10,
  },
  formRow: {
    flexDirection: "row",
  },
  helperText: {
    opacity: 0.72,
    fontSize: 12,
    lineHeight: 16,
  },
  formRowWrap: {
    flexWrap: "wrap",
  },
  fieldFullWrap: {
    flex: 1,
    width: "100%",
  },
  fieldSmallWrap: {
    width: 86,
  },
  fieldFlexWrap: {
    flex: 1,
    minWidth: "100%",
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
  fieldHalfWrapCompact: {
    width: "auto",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 120,
  },
  fieldFullWrapCompact: {
    width: "100%",
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
  },
  spacingRightOnly: {
    marginRight: 10,
  },
  spacingBottomOnly: {
    marginBottom: 10,
  },
  spacingRightBottom: {
    marginRight: 10,
    marginBottom: 10,
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
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
  },
  primaryButtonText: { color: "white" },
});
