import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useToast } from "@/providers/ToastProvider";
import { useUpdateHouseholdMutation } from "@/query/households";
import { a11yButton } from "@/utils/accessibility";

export type EditableHousehold = {
  id: string;
  name: string;
  currency: string;
};

interface EditHouseholdModalProps {
  visible: boolean;
  household: EditableHousehold | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function EditHouseholdModal({
  visible,
  household,
  onClose,
  onSuccess,
}: EditHouseholdModalProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 420;

  const { text, primary, onPrimary } = useThemeColors();

  const update = useUpdateHouseholdMutation();
  const toast = useToast();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("CUP");

  useEffect(() => {
    if (!visible) return;
    setName(household?.name ?? "");
    setCurrency(household?.currency ?? "CUP");
  }, [household?.currency, household?.name, visible]);

  const trimmedName = name.trim();
  const trimmedCurrency = currency.trim().toUpperCase();

  const validation = useMemo(() => {
    if (!trimmedName || trimmedName.length < 2) {
      return {
        ok: false as const,
        message: "El nombre debe tener al menos 2 caracteres.",
      };
    }
    if (trimmedCurrency && !/^[A-Z]{3}$/.test(trimmedCurrency)) {
      return {
        ok: false as const,
        message: "Usa un código ISO de 3 letras (ej: CUP, USD, EUR).",
      };
    }
    return { ok: true as const, message: null };
  }, [trimmedCurrency, trimmedName]);

  const canSave = !!household && validation.ok && !update.isPending;

  const handleClose = () => {
    setName("");
    setCurrency("CUP");
    onClose();
  };

  const handleSave = async () => {
    if (!household) return;

    if (!validation.ok) {
      Alert.alert(
        "Datos inválidos",
        validation.message ?? "Revisa el formulario"
      );
      return;
    }

    try {
      await update.mutateAsync({
        householdId: household.id,
        dto: {
          name: trimmedName,
          currency: trimmedCurrency || undefined,
        },
      });

      await onSuccess();
      handleClose();
      toast.show("Hogar actualizado", { variant: "success" });
    } catch (e) {
      Alert.alert("No se pudo actualizar", getApiErrorMessage(e));
    }
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
          <ThemedText type="subtitle">Editar hogar</ThemedText>

          <TextField
            placeholder="Nombre *"
            value={name}
            onChangeText={setName}
            autoCapitalize="sentences"
            editable={!update.isPending}
          />

          <TextField
            placeholder="Moneda (ej: CUP)"
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            editable={!update.isPending}
          />

          {!validation.ok && (
            <ThemedText style={styles.validationText}>
              {validation.message}
            </ThemedText>
          )}

          <View
            style={StyleSheet.flatten([
              styles.modalActions,
              isCompact && styles.modalActionsCompact,
            ])}
          >
            <Pressable
              {...a11yButton("Cancelar")}
              onPress={handleClose}
              disabled={update.isPending}
              style={StyleSheet.flatten([
                styles.secondaryButton,
                { borderColor: String(text) + "22" },
                isCompact && styles.modalButtonCompact,
                { opacity: update.isPending ? 0.7 : 1 },
              ])}
            >
              <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
            </Pressable>

            <Pressable
              {...a11yButton("Guardar cambios")}
              onPress={handleSave}
              disabled={!canSave}
              style={StyleSheet.flatten([
                styles.primaryButton,
                { backgroundColor: primary },
                isCompact && styles.modalButtonCompact,
                { opacity: canSave ? 1 : 0.6 },
              ])}
            >
              {update.isPending ? (
                <View style={styles.savingRow}>
                  <ActivityIndicator color={String(onPrimary)} />
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: onPrimary }}
                  >
                    Guardando…
                  </ThemedText>
                </View>
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                  Guardar
                </ThemedText>
              )}
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
  validationText: {
    fontSize: 12,
    opacity: 0.8,
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
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
