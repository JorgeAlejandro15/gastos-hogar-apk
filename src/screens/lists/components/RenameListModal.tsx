import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { a11yButton } from "@/utils/accessibility";

interface RenameListModalProps {
  visible: boolean;
  value: string;
  onChange: (name: string) => void;
  onClose: () => void;
  onSave: () => void;
  text: string;
  isCompact?: boolean;
  isSaving?: boolean;
}

export function RenameListModal({
  visible,
  value,
  onChange,
  onClose,
  onSave,
  text,
  isCompact: isCompactProp,
  isSaving,
}: RenameListModalProps) {
  const { width } = useWindowDimensions();
  const isCompact =
    typeof isCompactProp === "boolean" ? isCompactProp : width < 420;
  const safeValue = typeof value === "string" ? value : "";
  const trimmed = safeValue.trim();
  const canSave = trimmed.length >= 2 && !isSaving;
  const { primary, onPrimary } = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView
          style={[styles.modalCard, { borderColor: String(text) + "22" }]}
        >
          <ThemedText type="subtitle">Renombrar lista</ThemedText>
          <TextField
            placeholder="Nuevo nombre"
            value={safeValue}
            onChangeText={onChange}
            autoCapitalize="sentences"
          />
          <View
            style={StyleSheet.flatten([
              styles.modalActions,
              isCompact && styles.modalActionsCompact,
            ])}
          >
            <Pressable
              {...a11yButton("Cancelar")}
              onPress={onClose}
              style={StyleSheet.flatten([
                styles.secondaryButton,
                { borderColor: String(text) + "22" },
                isCompact && styles.modalButtonCompact,
              ])}
            >
              <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
            </Pressable>
            <Pressable
              {...a11yButton("Guardar")}
              onPress={onSave}
              disabled={!canSave}
              style={StyleSheet.flatten([
                styles.primaryButton,
                { backgroundColor: primary },
                isCompact && styles.modalButtonCompact,
                { opacity: canSave ? 1 : 0.6 },
              ])}
            >
              <ThemedText type="defaultSemiBold" style={[{ color: onPrimary }]}>
                {isSaving ? "Guardando…" : "Guardar"}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalActionsCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
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
  modalButtonCompact: {
    flex: 0,
    width: "100%",
  },
});
