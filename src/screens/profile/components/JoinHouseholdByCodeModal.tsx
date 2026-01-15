import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import { getApiErrorMessage } from "@/api/api";
import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAcceptHouseholdInvitationMutation } from "@/query/households";
import { a11yButton } from "@/utils/accessibility";

function friendlyAcceptError(message: string): string {
  const m = String(message || "").toLowerCase();
  if (m.includes("invitation not found")) {
    return "Código inválido o vencido. Pide que te reenvíen uno.";
  }
  if (m.includes("invitation already used") || m.includes("already used")) {
    return "Este código ya fue usado. Si ya estás en el hogar, solo actualiza tu perfil o reinicia la app.";
  }
  if (m.includes("household not found")) {
    return "No se encontró el hogar asociado a este código. Pide un nuevo código.";
  }
  if (m.includes("not found")) {
    return "No se pudo aceptar el código. Verifica que esté completo y vuelve a intentarlo.";
  }
  return message;
}

export type JoinHouseholdByCodeModalProps = {
  visible: boolean;
  onClose: () => void;
  onAccepted: () => Promise<void> | void;

  border: string;
  primary: string;
  onPrimary: string;
  text: string;
};

export function JoinHouseholdByCodeModal({
  visible,
  onClose,
  onAccepted,
  border,
  primary,
  onPrimary,
  text,
}: JoinHouseholdByCodeModalProps) {
  const { width, height } = useWindowDimensions();
  const { surface } = useThemeColors();

  const isCompact = width < 380;
  // Keep the modal usable on small devices / landscape.
  const maxCardHeight = Math.max(260, Math.min(620, height - 32));
  const accept = useAcceptHouseholdInvitationMutation();

  const [token, setToken] = useState("");

  const canAccept = useMemo(() => token.trim().length >= 10, [token]);

  const onPressClose = useCallback(() => {
    setToken("");
    accept.reset();
    onClose();
  }, [accept, onClose]);

  const onPaste = useCallback(async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      const v = String(clip || "").trim();
      if (!v) {
        Alert.alert(
          "Portapapeles vacío",
          "Copia el código y vuelve aquí para pegarlo."
        );
        return;
      }
      setToken(v);
    } catch {
      Alert.alert(
        "No se pudo pegar",
        "Copia el código manualmente y pégalo en el campo."
      );
    }
  }, []);

  const onAccept = useCallback(async () => {
    const t = token.trim();
    if (t.length < 10) {
      Alert.alert("Código incompleto", "Pega el código completo.");
      return;
    }

    try {
      await accept.mutateAsync({ token: t });

      // IMPORTANT: backend sets primaryHouseholdId; refresh the auth profile.
      await onAccepted();

      Alert.alert("Listo", "Te uniste al hogar correctamente.");
      onPressClose();
    } catch (e) {
      const raw = getApiErrorMessage(e);
      Alert.alert("No se pudo aceptar", friendlyAcceptError(raw), [
        {
          text: "Pegar de nuevo",
          onPress: () => {
            setToken("");
            // Best-effort paste again.
            onPaste();
          },
        },
        {
          text: "Solicitar otro código",
          onPress: () => {
            Alert.alert(
              "Pide un nuevo código",
              "Contacta a quien te invitó y pídele que genere un nuevo código desde: Lista → Compartir → Invitar."
            );
          },
        },
        { text: "Cerrar", style: "cancel" },
      ]);
    }
  }, [accept, onAccepted, onPaste, onPressClose, token]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onPressClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ThemedView
          style={[
            styles.card,
            {
              borderColor: border,
              backgroundColor: surface,
              maxHeight: maxCardHeight,
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="subtitle">Unirme con código</ThemedText>

            <TextField
              placeholder="Pega el código aquí"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={[styles.actions, isCompact && styles.actionsCompact]}>
              <Pressable
                {...a11yButton("Pegar", "Pega el código desde el portapapeles")}
                onPress={onPaste}
                style={StyleSheet.flatten([
                  styles.secondaryButton,
                  { borderColor: border },
                  isCompact && styles.buttonCompact,
                ])}
              >
                <ThemedText type="defaultSemiBold" style={{ color: text }}>
                  Pegar
                </ThemedText>
              </Pressable>

              <Pressable
                {...a11yButton("Aceptar", "Aceptar invitación por código")}
                onPress={onAccept}
                disabled={!canAccept || accept.isPending}
                style={({ pressed }) => [
                  styles.primaryButton,
                  isCompact && styles.buttonCompact,
                  {
                    backgroundColor: primary,
                    opacity:
                      !canAccept || accept.isPending ? 0.6 : pressed ? 0.92 : 1,
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                  {accept.isPending ? "Aceptando…" : "Aceptar"}
                </ThemedText>
              </Pressable>
            </View>

            <Pressable
              {...a11yButton("Cerrar")}
              onPress={onPressClose}
              style={StyleSheet.flatten([
                styles.secondaryButton,
                { borderColor: border },
              ])}
            >
              <ThemedText type="defaultSemiBold" style={{ color: text }}>
                Cerrar
              </ThemedText>
            </Pressable>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardContent: {
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  actionsCompact: {
    flexDirection: "column",
  },
  buttonCompact: {
    width: "100%",
    flex: 0,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
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
  },
});
