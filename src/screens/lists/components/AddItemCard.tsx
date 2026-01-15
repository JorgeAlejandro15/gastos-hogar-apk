import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";

import { ThemedText } from "@/components/themed-text";
import { EXPENSE_CATEGORIES } from "@/constants/expense-categories";
import { a11yButton } from "@/utils/accessibility";

export type AddItemCardProps = {
  text: string;
  tint: string;
  isCompact: boolean;
  name: string;
  amount: string;
  price: string;
  category: string;

  setName: (v: string) => void;
  setAmount: (v: string) => void;
  setPrice: (v: string) => void;
  setCategory: (v: string) => void;

  isSaving: boolean;
  onAdd: () => void;
};

export const AddItemCard = React.memo(function AddItemCard({
  text,
  tint,
  isCompact,
  name,
  amount,
  price,
  category,
  setName,
  setAmount,
  setPrice,
  setCategory,
  isSaving,
  onAdd,
}: AddItemCardProps) {
  return (
    <View style={[styles.card, { borderColor: String(text) + "22" }]}>
      <ThemedText type="defaultSemiBold">Agregar producto</ThemedText>

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

      <View style={StyleSheet.flatten([styles.formRow, styles.formRowWrap])}>
        <View
          style={StyleSheet.flatten([
            styles.fieldSmallWrap,
            isCompact && styles.fieldHalfWrapCompact,
            isCompact ? styles.spacingRightBottom : styles.spacingRightOnly,
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
            isCompact ? styles.spacingBottomOnly : styles.spacingRightOnly,
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
            options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))}
            disabled={isSaving}
          />
        </View>
      </View>

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
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  formRow: {
    flexDirection: "row",
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
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButtonText: { color: "white" },
});
