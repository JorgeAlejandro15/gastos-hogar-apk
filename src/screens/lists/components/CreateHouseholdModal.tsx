import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { getApiErrorMessage } from "@/api/api";
import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCreateMyHouseholdMutation } from "@/query/households";
import { a11yButton } from "@/utils/accessibility";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface CreateHouseholdModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  text: string;
  onTintText: string;
}

export function CreateHouseholdModal({
  visible,
  onClose,
  onSuccess,
  text,
  onTintText,
}: CreateHouseholdModalProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const { onPrimary } = useThemeColors();

  const createHousehold = useCreateMyHouseholdMutation();

  const [householdName, setHouseholdName] = useState("");
  const [householdCurrency, setHouseholdCurrency] = useState("CUP");

  const handleCreate = async () => {
    const name = householdName.trim();
    const currency = householdCurrency.trim().toUpperCase();

    if (!name || name.length < 2) {
      Alert.alert(
        "Nombre requerido",
        "El nombre debe tener al menos 2 caracteres."
      );
      return;
    }
    if (currency && !/^[A-Z]{3}$/.test(currency)) {
      Alert.alert(
        "Moneda inválida",
        "Usa un código ISO de 3 letras (ej: CUP, USD, EUR)."
      );
      return;
    }

    try {
      await createHousehold.mutateAsync({
        name,
        currency: currency || undefined,
      });
      await onSuccess();
      setHouseholdName("");
      setHouseholdCurrency("CUP");
      onClose();
    } catch (e) {
      Alert.alert("No se pudo crear el hogar", getApiErrorMessage(e));
    }
  };

  const handleClose = () => {
    setHouseholdName("");
    setHouseholdCurrency("CUP");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView
          style={[styles.modalCard, { borderColor: String(text) + "22" }]}
        >
          <ThemedText type="subtitle">Crear hogar</ThemedText>

          <TextField
            placeholder="Nombre *"
            value={householdName}
            onChangeText={setHouseholdName}
            autoCapitalize="sentences"
          />
          <TextField
            placeholder="Moneda (ej: CUP)"
            value={householdCurrency}
            onChangeText={setHouseholdCurrency}
            autoCapitalize="characters"
          />

          <View
            style={StyleSheet.flatten([
              styles.modalActions,
              isCompact && styles.modalActionsCompact,
            ])}
          >
            <Pressable
              {...a11yButton("Cancelar")}
              onPress={handleClose}
              style={StyleSheet.flatten([
                styles.secondaryButton,
                { borderColor: String(text) + "22" },
                isCompact && styles.modalButtonCompact,
              ])}
            >
              <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
            </Pressable>
            <Pressable
              {...a11yButton("Crear")}
              onPress={handleCreate}
              disabled={createHousehold.isPending}
              style={StyleSheet.flatten([
                styles.primaryButton,
                isCompact && styles.modalButtonCompact,
                {
                  backgroundColor: String(onTintText),
                  opacity: createHousehold.isPending ? 0.7 : 1,
                },
              ])}
            >
              <ThemedText
                type="defaultSemiBold"
                style={[styles.primaryButtonText, { color: onPrimary }]}
              >
                {createHousehold.isPending ? "Creando…" : "Crear"}
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
  modalButtonCompact: {
    flex: 0,
    width: "100%",
  },
});
