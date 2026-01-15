// File: src/screens/profile/components/ProfileEditModal.tsx — Modal para editar perfil.

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { ProfileEditCard } from "@/screens/profile/components/ProfileEditCard";
import { a11yButton } from "@/utils/accessibility";

export type ProfileEditModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ProfileEditModal({ visible, onClose }: ProfileEditModalProps) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 420;
  const maxCardHeight = Math.max(280, Math.min(760, height - 32));

  const { surface, border, primary, onPrimary, icon, text } = useThemeColors();

  const [dirty, setDirty] = useState(false);

  const requestClose = useCallback(() => {
    if (!dirty) {
      onClose();
      return;
    }

    Alert.alert(
      "Descartar cambios",
      "Tienes cambios sin guardar. ¿Deseas descartarlos?",
      [
        { text: "Seguir editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: onClose },
      ]
    );
  }, [dirty, onClose]);

  // Reset dirty when it opens/closes to avoid stale state.
  React.useEffect(() => {
    if (!visible) setDirty(false);
  }, [visible]);

  const cardProps = useMemo(
    () => ({
      cardBg: String(surface),
      border: String(border),
      primary: String(primary),
      onPrimary: String(onPrimary),
    }),
    [surface, border, primary, onPrimary]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={requestClose}
    >
      <View style={styles.overlay}>
        <ThemedView
          style={[
            styles.card,
            {
              borderColor: String(border),
              backgroundColor: String(surface),
              maxHeight: maxCardHeight,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">Editar perfil</ThemedText>
            <Pressable
              {...a11yButton("Cerrar")}
              onPress={requestClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={String(icon)} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <ProfileEditCard
              {...cardProps}
              onDirtyChange={setDirty}
              onRequestClose={requestClose}
              isCompact={isCompact}
            />

            <ThemedText style={[styles.help, { color: String(text) + "AA" }]}>
              Mantén al menos el (correo o móvil).
            </ThemedText>
          </ScrollView>
        </ThemedView>
      </View>
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
    maxWidth: 560,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  closeButton: {
    padding: 6,
  },
  content: {
    gap: 12,
    paddingBottom: 4,
  },
  help: {
    fontSize: 12,
    opacity: 0.8,
  },
});
