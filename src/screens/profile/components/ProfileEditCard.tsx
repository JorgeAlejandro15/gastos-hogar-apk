// File: src/screens/profile/components/ProfileEditCard.tsx — Editar datos del perfil (nombre/email/teléfono).

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
import type { UpdateMeRequest } from "@/api/auth-api";
import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAuthStore } from "@/stores/authStore";
import { isValidEmail, isValidPhone, normalizePhone } from "@/utils/validation";

export type ProfileEditCardProps = {
  cardBg: string;
  border: string;
  primary: string;
  onPrimary: string;
  isCompact?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestClose?: () => void;
};

export function ProfileEditCard({
  cardBg,
  border,
  primary,
  onPrimary,
  isCompact,
  onDirtyChange,
  onRequestClose,
}: ProfileEditCardProps) {
  const user = useAuthStore((s) => s.user);
  const updateMe = useAuthStore((s) => s.updateMe);

  const { text } = useThemeColors();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mantener el form sincronizado si el store cambia (p.ej., refreshMe).
  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.displayName, user?.email, user?.phone]);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const normalizedPhone = useMemo(() => {
    const trimmed = phone.trim();
    return trimmed ? normalizePhone(trimmed) : "";
  }, [phone]);

  const baseline = useMemo(() => {
    return {
      displayName: String(user?.displayName ?? "").trim(),
      email: String(user?.email ?? "")
        .trim()
        .toLowerCase(),
      phone: user?.phone ? normalizePhone(String(user.phone)) : "",
    };
  }, [user?.displayName, user?.email, user?.phone]);

  const isDirty = useMemo(() => {
    return (
      displayName.trim() !== baseline.displayName ||
      normalizedEmail !== baseline.email ||
      normalizedPhone !== baseline.phone
    );
  }, [
    baseline.displayName,
    baseline.email,
    baseline.phone,
    displayName,
    normalizedEmail,
    normalizedPhone,
  ]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const canSubmit = useMemo(() => {
    if (saving) return false;

    const nameOk = displayName.trim().length >= 2;

    const emailTrimmed = normalizedEmail;
    const phoneNorm = normalizedPhone;

    const emailOk = !emailTrimmed || isValidEmail(emailTrimmed);
    const phoneOk = !phoneNorm || isValidPhone(phoneNorm);

    // Mantener al menos un identificador. El backend también valida esto.
    const hasSomeIdentifier = !!emailTrimmed || !!phoneNorm;

    return nameOk && emailOk && phoneOk && hasSomeIdentifier;
  }, [displayName, normalizedEmail, normalizedPhone, saving]);

  async function onSave() {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      const dto: UpdateMeRequest = {
        displayName: displayName.trim(),
        // Enviamos null si se elimina el valor.
        email: normalizedEmail ? normalizedEmail : null,
        phone: normalizedPhone ? normalizedPhone : null,
      };

      await updateMe(dto);
      Alert.alert(
        "Perfil actualizado",
        "Tus datos se guardaron correctamente."
      );
      onDirtyChange?.(false);
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

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Nombre para mostrar</ThemedText>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Juan Pérez"
          placeholderTextColor={String(text) + "99"}
          autoCapitalize="words"
          textContentType="name"
          style={[styles.input, { borderColor: border, color: text }]}
          editable={!saving}
          accessibilityLabel="Nombre para mostrar"
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Correo</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="user@example.com"
          placeholderTextColor={String(text) + "99"}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          style={[styles.input, { borderColor: border, color: text }]}
          editable={!saving}
          accessibilityLabel="Correo"
          accessibilityHint="Puedes cambiarlo o dejarlo vacío si tienes teléfono"
        />
        {!!normalizedEmail && !isValidEmail(normalizedEmail) && (
          <ThemedText style={styles.errorText}>Correo inválido</ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText type="defaultSemiBold">Móvil</ThemedText>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+5355512345"
          placeholderTextColor={String(text) + "99"}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="telephoneNumber"
          style={[styles.input, { borderColor: border, color: text }]}
          editable={!saving}
          accessibilityLabel="Móvil"
          accessibilityHint="Puedes agregarlo o dejarlo vacío si tienes email"
        />
        {!!normalizedPhone && !isValidPhone(normalizedPhone) && (
          <ThemedText style={styles.errorText}>Teléfono inválido</ThemedText>
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
          accessibilityLabel="Cancelar edición"
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
          accessibilityLabel="Guardar cambios de perfil"
          accessibilityState={{ disabled: !canSubmit || saving }}
          onPress={onSave}
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
              Guardar
            </ThemedText>
          )}
        </Pressable>
      </View>

      {!normalizedEmail && !normalizedPhone && (
        <ThemedText style={styles.miniNote}>
          Debes mantener al menos un identificador: email o móvil.
        </ThemedText>
      )}

      {isDirty && (
        <ThemedText style={styles.miniNote}>
          Tienes cambios sin guardar.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 1,
    gap: 12,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
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
  miniNote: {
    fontSize: 12,
    opacity: 0.6,
  },
});
