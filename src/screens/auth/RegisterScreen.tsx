// File: src/screens/auth/RegisterScreen.tsx — Pantalla de registro (email) con validación básica.

import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/api";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useAuthStore } from "@/stores/authStore";
import {
  getPasswordPolicyChecks,
  isStrongPassword,
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from "@/utils/validation";

export function RegisterScreen() {
  const router = useRouter();

  const register = useAuthStore((s) => s.register);

  const [displayName, setDisplayName] = useState("");
  const [identifierMode, setIdentifierMode] = useState<"email" | "phone">(
    "email"
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { text, border, primary, background } = useThemeColors();

  const strength = useMemo(() => {
    return getPasswordPolicyChecks(password);
  }, [password]);

  const canSubmit = useMemo(() => {
    const nameOk = displayName.trim().length >= 2;
    const identifierOk =
      identifierMode === "email" ? isValidEmail(email) : isValidPhone(phone);
    const pwdOk = isStrongPassword(password);
    const match = password === password2;
    return nameOk && identifierOk && pwdOk && match && !submitting;
  }, [
    displayName,
    identifierMode,
    email,
    phone,
    password,
    password2,
    submitting,
  ]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const base = {
        displayName: displayName.trim(),
        password,
      };

      if (identifierMode === "email") {
        await register({
          ...base,
          email: email.trim().toLowerCase(),
        });
      } else {
        await register({
          ...base,
          phone: normalizePhone(phone),
        });
      }

      router.replace("/(tabs)");
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const passwordMismatch = password2.length > 0 && password !== password2;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            <ThemedView style={styles.container}>
              <View style={styles.title}>
                <ThemedText type="title">Crear cuenta</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Puedes registrarte con correo o teléfono.
                </ThemedText>
              </View>

              <View style={[styles.card, { borderColor: border }]}>
                <View style={styles.field}>
                  <ThemedText type="defaultSemiBold">
                    Nombre para mostrar
                  </ThemedText>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Juan Pérez"
                    placeholderTextColor={String(text) + "99"}
                    autoCapitalize="words"
                    textContentType="name"
                    style={[styles.input, { borderColor: border, color: text }]}
                    editable={!submitting}
                    accessibilityLabel="Nombre para mostrar"
                  />
                </View>

                <View style={[styles.segmented, { borderColor: border }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Usar correo"
                    onPress={() => setIdentifierMode("email")}
                    disabled={submitting}
                    style={[
                      styles.segment,
                      identifierMode === "email" && styles.segmentActive,
                      identifierMode === "email" && {
                        backgroundColor: String(primary) + "22",
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">Correo</ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Usar teléfono"
                    onPress={() => setIdentifierMode("phone")}
                    disabled={submitting}
                    style={[
                      styles.segment,
                      identifierMode === "phone" && styles.segmentActive,
                      identifierMode === "phone" && {
                        backgroundColor: String(primary) + "22",
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">Teléfono</ThemedText>
                  </Pressable>
                </View>

                {identifierMode === "email" ? (
                  <View style={styles.field}>
                    <ThemedText type="defaultSemiBold">Correo</ThemedText>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="user@example.com"
                      placeholderTextColor={String(text) + "99"}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
                      style={[
                        styles.input,
                        { borderColor: border, color: text },
                      ]}
                      editable={!submitting}
                      accessibilityLabel="Correo"
                    />
                  </View>
                ) : (
                  <View style={styles.field}>
                    <ThemedText type="defaultSemiBold">Teléfono</ThemedText>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+5355512345 o 56989636"
                      placeholderTextColor={String(text) + "99"}
                      autoCapitalize="none"
                      keyboardType="phone-pad"
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      style={[
                        styles.input,
                        { borderColor: border, color: text },
                      ]}
                      editable={!submitting}
                      accessibilityLabel="Teléfono"
                    />
                  </View>
                )}

                <View style={styles.field}>
                  <ThemedText type="defaultSemiBold">Contraseña</ThemedText>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="8+ caracteres, mayús/minús y número"
                      placeholderTextColor={String(text) + "99"}
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      style={[
                        styles.input,
                        styles.passwordInput,
                        { borderColor: border, color: text },
                      ]}
                      editable={!submitting}
                      accessibilityLabel="Contraseña"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      accessibilityLabel={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color={text}
                      />
                    </Pressable>
                  </View>

                  {password.length > 0 ? (
                    <View style={styles.strengthBox}>
                      <ThemedText style={styles.miniNote}>
                        Requisitos de la contraseña:
                      </ThemedText>
                      <View style={styles.strengthRow}>
                        <Ionicons
                          name={
                            strength.min8
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={16}
                          color={
                            strength.min8 ? "#22c55e" : String(text) + "66"
                          }
                        />
                        <ThemedText style={styles.miniNote}>
                          8+ caracteres
                        </ThemedText>
                      </View>
                      <View style={styles.strengthRow}>
                        <Ionicons
                          name={
                            strength.hasUpper
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={16}
                          color={
                            strength.hasUpper ? "#22c55e" : String(text) + "66"
                          }
                        />
                        <ThemedText style={styles.miniNote}>
                          Una mayúscula
                        </ThemedText>
                      </View>
                      <View style={styles.strengthRow}>
                        <Ionicons
                          name={
                            strength.hasLower
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={16}
                          color={
                            strength.hasLower ? "#22c55e" : String(text) + "66"
                          }
                        />
                        <ThemedText style={styles.miniNote}>
                          Una minúscula
                        </ThemedText>
                      </View>
                      <View style={styles.strengthRow}>
                        <Ionicons
                          name={
                            strength.hasNumber
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={16}
                          color={
                            strength.hasNumber ? "#22c55e" : String(text) + "66"
                          }
                        />
                        <ThemedText style={styles.miniNote}>
                          Un número
                        </ThemedText>
                      </View>
                      <View style={styles.strengthRow}>
                        <Ionicons
                          name={
                            strength.noSpaces
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={16}
                          color={
                            strength.noSpaces ? "#22c55e" : String(text) + "66"
                          }
                        />
                        <ThemedText style={styles.miniNote}>
                          Sin espacios
                        </ThemedText>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <ThemedText type="defaultSemiBold">
                    Confirmar contraseña
                  </ThemedText>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={password2}
                      onChangeText={setPassword2}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor={String(text) + "99"}
                      secureTextEntry={!showPassword2}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      style={[
                        styles.input,
                        styles.passwordInput,
                        { borderColor: border, color: text },
                      ]}
                      editable={!submitting}
                      accessibilityLabel="Confirmar contraseña"
                    />
                    <Pressable
                      onPress={() => setShowPassword2(!showPassword2)}
                      style={styles.eyeButton}
                      accessibilityLabel={
                        showPassword2
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={showPassword2 ? "eye-off" : "eye"}
                        size={22}
                        color={text}
                      />
                    </Pressable>
                  </View>
                  {passwordMismatch ? (
                    <ThemedText style={styles.helperError}>
                      Las contraseñas no coinciden.
                    </ThemedText>
                  ) : null}
                </View>

                {error ? (
                  <ThemedText style={styles.error}>{error}</ThemedText>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Crear cuenta"
                  accessibilityHint="Registra una nueva cuenta"
                  onPress={onSubmit}
                  disabled={!canSubmit}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: primary },
                    !canSubmit && styles.primaryButtonDisabled,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator />
                  ) : (
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.primaryButtonText}
                    >
                      Crear cuenta
                    </ThemedText>
                  )}
                </Pressable>

                <View style={styles.footerRow}>
                  <ThemedText>¿Ya tienes cuenta?</ThemedText>
                  <Link href="./login" asChild>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Ir a login"
                    >
                      <ThemedText type="link">Iniciar sesión</ThemedText>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </ThemedView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardAvoiding: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 24,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  title: { marginTop: 0, alignItems: "center" },
  subtitle: { opacity: 0.8 },
  card: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  field: { gap: 6 },
  passwordContainer: {
    position: "relative",
  },
  segmented: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    // Keep minimal; color is injected inline using theme.
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  helperError: {
    color: "#B00020",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
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
    opacity: 0.7,
  },
  error: {
    color: "#B00020",
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "white",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
});
