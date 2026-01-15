// File: src/components/forms/SelectField.tsx — Select simple (Pressable + Modal) sin dependencias.

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { a11yButton } from "@/utils/accessibility";

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectFieldProps = {
  value: string;
  onChange: (v: string) => void;
  options: readonly SelectOption[];

  placeholder?: string;
  title?: string;

  /** Muestra una opción para limpiar el valor ("Sin categoría", etc.). */
  allowEmpty?: boolean;
  emptyLabel?: string;

  disabled?: boolean;
};

export const SelectField = React.memo(function SelectField({
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  title = "Selecciona una opción",
  allowEmpty,
  emptyLabel = "Sin categoría",
  disabled,
}: SelectFieldProps) {
  const { text, border, surface, icon } = useThemeColors();
  const [open, setOpen] = useState(false);

  const currentLabel = useMemo(() => {
    if (!value) return "";
    return options.find((o) => o.value === value)?.label ?? value;
  }, [options, value]);

  const openModal = () => {
    if (disabled) return;
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const selectValue = (v: string) => {
    onChange(v);
    closeModal();
  };

  const borderColor = String(text) + "22";

  return (
    <>
      <Pressable
        {...a11yButton(
          title,
          "Abre un selector con la lista de opciones disponibles"
        )}
        disabled={disabled}
        onPress={openModal}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor,
            backgroundColor: "transparent",
            opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
          },
        ]}
      >
        <ThemedText
          numberOfLines={1}
          style={[
            styles.valueText,
            !currentLabel && { color: String(text) + "66" },
          ]}
        >
          {currentLabel || placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={18} color={icon ?? text} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={[
              styles.modalCard,
              { borderColor: String(border), backgroundColor: String(surface) },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">{title}</ThemedText>
              <Pressable
                {...a11yButton("Cerrar")}
                onPress={closeModal}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    borderColor: String(border),
                    backgroundColor: String(surface),
                  },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Ionicons name="close" size={18} color={text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.optionsScroll}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.optionsWrap}
            >
              {allowEmpty ? (
                <OptionRow
                  label={emptyLabel}
                  selected={!value}
                  onPress={() => selectValue("")}
                />
              ) : null}

              {options.map((o) => (
                <OptionRow
                  key={o.value}
                  label={o.label}
                  selected={o.value === value}
                  onPress={() => selectValue(o.value)}
                />
              ))}
            </ScrollView>

            <Pressable
              {...a11yButton("Cancelar")}
              onPress={closeModal}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: String(border),
                  backgroundColor: String(surface),
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
});

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { text, border, surface, primary } = useThemeColors();

  return (
    <Pressable
      {...a11yButton(label)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor: String(border),
          backgroundColor: selected ? String(primary) + "14" : String(surface),
        },
        pressed && { opacity: 0.92 },
      ]}
    >
      <ThemedText
        type="defaultSemiBold"
        style={selected ? { color: primary } : { color: text }}
      >
        {label}
      </ThemedText>
      {selected ? (
        <Ionicons name="checkmark" size={18} color={primary} />
      ) : (
        <View style={{ width: 18, height: 18 }} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  valueText: {
    flex: 1,
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    // Importante: en pantallas chicas, el card puede crecer más que el viewport
    // y esconder el botón superior (Cerrar) y el inferior (Cancelar).
    // Con maxHeight hacemos scroll interno y mantenemos acciones visibles.
    maxHeight: "85%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsScroll: {
    flexGrow: 0,
  },
  optionsWrap: {
    gap: 10,
    paddingBottom: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },

  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
