// File: src/screens/auth/LoginScreen.tsx — Pantalla de login (email o teléfono) con validación básica.

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
import { isValidEmail, isValidPhone, normalizePhone } from "@/utils/validation";

type Mode = "email" | "phone";

export function LoginScreen() {
  const router = useRouter();

  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    text,
    surface: cardBg,
    border,
    primary,
    onPrimary,
    background,
  } = useThemeColors();

  const canSubmit = useMemo(() => {
    const pwdOk = password.trim().length >= 6;
    const identityOk =
      mode === "email" ? isValidEmail(email) : isValidPhone(phone);
    return pwdOk && identityOk && !submitting;
  }, [email, phone, password, submitting, mode]);

  async function onSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "email") {
        await login({ email: email.trim(), password });
      } else {
        await login({ phone: normalizePhone(phone), password });
      }

      router.replace("/(tabs)");
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

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
                <ThemedText type="title">Iniciar sesión</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Accede con tu {mode === "email" ? "correo" : "teléfono"} y
                  contraseña.
                </ThemedText>
              </View>

              <View
                style={[
                  styles.card,
                  { backgroundColor: cardBg, borderColor: border },
                ]}
              >
                <View style={styles.modeRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar a modo correo"
                    onPress={() => setMode("email")}
                    style={[
                      styles.modePill,
                      { borderColor: border },
                      mode === "email" && { backgroundColor: primary },
                      mode === "email" && { borderColor: primary },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: mode === "email" ? onPrimary : text,
                      }}
                    >
                      Correo
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar a modo teléfono"
                    onPress={() => setMode("phone")}
                    style={[
                      styles.modePill,
                      { borderColor: border },
                      mode === "phone" && { backgroundColor: primary },
                      mode === "phone" && { borderColor: primary },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: mode === "phone" ? onPrimary : text,
                      }}
                    >
                      Teléfono
                    </ThemedText>
                  </Pressable>
                </View>

                {mode === "email" ? (
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
                      placeholder="+5355512345"
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
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={String(text) + "99"}
                      secureTextEntry={!showPassword}
                      textContentType="password"
                      autoComplete="password"
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
                </View>

                {error ? (
                  <ThemedText style={styles.error}>{error}</ThemedText>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Entrar"
                  accessibilityHint="Inicia sesión en tu cuenta"
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
                      style={[styles.primaryButtonText, { color: onPrimary }]}
                    >
                      Entrar
                    </ThemedText>
                  )}
                </Pressable>

                <View style={styles.footerRow}>
                  <ThemedText>¿No tienes cuenta?</ThemedText>
                  <Link href="./register" asChild>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Crear cuenta"
                    >
                      <ThemedText type="link">Crear cuenta</ThemedText>
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
  title: { alignItems: "center" },
  subtitle: { opacity: 0.8 },
  card: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modePill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  field: { gap: 6 },
  passwordContainer: {
    position: "relative",
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
