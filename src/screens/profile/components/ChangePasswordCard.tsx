// File: src/screens/profile/components/ChangePasswordCard.tsx — Cambio de contraseña.

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { getApiErrorMessage } from "@/api/api";
import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAuthStore } from "@/stores/authStore";
import { getPasswordPolicyChecks, isStrongPassword } from "@/utils/validation";

export type ChangePasswordCardProps = {
  cardBg: string;
  border: string;
  primary: string;
  onPrimary: string;
  icon: string;
  isCompact?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestClose?: () => void;
  onSuccess?: () => void;
};

export function ChangePasswordCard({
  cardBg,
  border,
  primary,
  onPrimary,
  icon,
  isCompact,
  onDirtyChange,
  onRequestClose,
  onSuccess,
}: ChangePasswordCardProps) {
  const changePassword = useAuthStore((s) => s.changePassword);

  const { text } = useThemeColors();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNew2, setShowNew2] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    return (
      currentPassword.length > 0 ||
      newPassword.length > 0 ||
      newPassword2.length > 0
    );
  }, [currentPassword, newPassword, newPassword2]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    const curOk = currentPassword.trim().length >= 6;
    const newOk = isStrongPassword(newPassword);
    const match = newPassword === newPassword2;
    return curOk && newOk && match;
  }, [currentPassword, newPassword, newPassword2, saving]);

  const mismatch = newPassword2.length > 0 && newPassword !== newPassword2;

  const strength = useMemo(() => {
    return getPasswordPolicyChecks(newPassword);
  }, [newPassword]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");

      Alert.alert(
        "Contraseña actualizada",
        "Tu contraseña fue cambiada con éxito."
      );

      onDirtyChange?.(false);
      onSuccess?.();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
    >
      <ThemedText type="subtitle">Cambiar contraseña</ThemedText>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Contraseña actual</ThemedText>
        <View style={[styles.passwordRow, { borderColor: border }]}>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            placeholderTextColor={String(text) + "99"}
            secureTextEntry={!showCurrent}
            textContentType="password"
            autoComplete="password"
            style={[styles.passwordInput, { color: text }]}
            editable={!saving}
            accessibilityLabel="Contraseña actual"
          />
          <Pressable
            onPress={() => setShowCurrent((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              showCurrent ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            style={styles.eyeButton}
            disabled={saving}
          >
            <Ionicons
              name={showCurrent ? "eye-off" : "eye"}
              size={20}
              color={icon}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Nueva contraseña</ThemedText>
        <View style={[styles.passwordRow, { borderColor: border }]}>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="8+ caracteres, mayús/minús y número"
            placeholderTextColor={String(text) + "99"}
            secureTextEntry={!showNew}
            textContentType="newPassword"
            autoComplete="new-password"
            style={[styles.passwordInput, { color: text }]}
            editable={!saving}
            accessibilityLabel="Nueva contraseña"
          />
          <Pressable
            onPress={() => setShowNew((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              showNew ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            style={styles.eyeButton}
            disabled={saving}
          >
            <Ionicons
              name={showNew ? "eye-off" : "eye"}
              size={20}
              color={icon}
            />
          </Pressable>
        </View>

        {newPassword.length > 0 && (
          <View style={styles.strengthBox}>
            <ThemedText style={styles.miniNote}>
              Requisitos de la contraseña:
            </ThemedText>
            <View style={styles.strengthRow}>
              <Ionicons
                name={strength.min8 ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={strength.min8 ? "#22c55e" : String(text) + "66"}
              />
              <ThemedText style={styles.miniNote}>8+ caracteres</ThemedText>
            </View>
            <View style={styles.strengthRow}>
              <Ionicons
                name={
                  strength.hasUpper ? "checkmark-circle" : "ellipse-outline"
                }
                size={16}
                color={strength.hasUpper ? "#22c55e" : String(text) + "66"}
              />
              <ThemedText style={styles.miniNote}>Una mayúscula</ThemedText>
            </View>
            <View style={styles.strengthRow}>
              <Ionicons
                name={
                  strength.hasLower ? "checkmark-circle" : "ellipse-outline"
                }
                size={16}
                color={strength.hasLower ? "#22c55e" : String(text) + "66"}
              />
              <ThemedText style={styles.miniNote}>Una minúscula</ThemedText>
            </View>
            <View style={styles.strengthRow}>
              <Ionicons
                name={
                  strength.hasNumber ? "checkmark-circle" : "ellipse-outline"
                }
                size={16}
                color={strength.hasNumber ? "#22c55e" : String(text) + "66"}
              />
              <ThemedText style={styles.miniNote}>Un número</ThemedText>
            </View>
            <View style={styles.strengthRow}>
              <Ionicons
                name={
                  strength.noSpaces ? "checkmark-circle" : "ellipse-outline"
                }
                size={16}
                color={strength.noSpaces ? "#22c55e" : String(text) + "66"}
              />
              <ThemedText style={styles.miniNote}>Sin espacios</ThemedText>
            </View>
          </View>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">
          Confirmar nueva contraseña
        </ThemedText>
        <View style={[styles.passwordRow, { borderColor: border }]}>
          <TextInput
            value={newPassword2}
            onChangeText={setNewPassword2}
            placeholder="Repite la nueva contraseña"
            placeholderTextColor={String(text) + "99"}
            secureTextEntry={!showNew2}
            textContentType="newPassword"
            autoComplete="new-password"
            style={[styles.passwordInput, { color: text }]}
            editable={!saving}
            accessibilityLabel="Confirmar nueva contraseña"
          />
          <Pressable
            onPress={() => setShowNew2((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              showNew2 ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            style={styles.eyeButton}
            disabled={saving}
          >
            <Ionicons
              name={showNew2 ? "eye-off" : "eye"}
              size={20}
              color={icon}
            />
          </Pressable>
        </View>
        {mismatch && (
          <ThemedText style={styles.errorText}>
            Las contraseñas no coinciden
          </ThemedText>
        )}
      </View>

      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

      <View
        style={StyleSheet.flatten([
          styles.actions,
          isCompact && styles.actionsCompact,
        ])}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar cambio de contraseña"
          onPress={onRequestClose}
          disabled={saving}
          style={StyleSheet.flatten([
            styles.secondaryButton,
            { borderColor: border },
            isCompact && styles.buttonCompact,
            saving && { opacity: 0.6 },
          ])}
        >
          <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar contraseña"
          accessibilityState={{ disabled: !canSubmit || saving }}
          onPress={onSubmit}
          disabled={!canSubmit || saving}
          style={StyleSheet.flatten([
            styles.primaryButton,
            { backgroundColor: primary },
            isCompact && styles.buttonCompact,
            (!canSubmit || saving) && { opacity: 0.6 },
          ])}
        >
          {saving ? (
            <ActivityIndicator color={onPrimary} />
          ) : (
            <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
              Guardar contraseña
            </ThemedText>
          )}
        </Pressable>
      </View>

      <ThemedText style={styles.miniNote}>
        8+ caracteres, con mayúscula, minúscula y número (sin espacios).
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  field: {
    gap: 8,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  actionsCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  buttonCompact: {
    flex: 0,
    width: "100%",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
  },
  strengthBox: {
    gap: 6,
    marginTop: 8,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniNote: {
    fontSize: 12,
    opacity: 0.6,
  },
});
