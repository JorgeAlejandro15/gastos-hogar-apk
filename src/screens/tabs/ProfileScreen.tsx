// File: src/screens/tabs/ProfileScreen.tsx — Perfil del usuario + logout (usa authStore).

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { ChangePasswordModal } from "@/screens/profile/components/ChangePasswordModal";
import { ProfileEditModal } from "@/screens/profile/components/ProfileEditModal";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);

  // Hook optimizado que retorna todos los colores en una sola llamada
  const {
    text,
    surface: cardBg,
    border,
    primary,
    onPrimary,
    icon,
    yellow,
  } = useThemeColors();

  const name = user?.displayName ?? "";
  const email = user?.email ?? "";
  const phone = user?.phone ?? null;

  const isDarkMode = themePreference === "dark";

  const toggleTheme = () => {
    setThemePreference(isDarkMode ? "light" : "dark");
  };

  function confirmLogout() {
    Alert.alert("Cerrar sesión", "¿Seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="title" accessibilityRole="header">
              Perfil
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isDarkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
              }
              onPress={toggleTheme}
              style={[
                styles.themeToggle,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={22}
                color={icon}
              />
            </Pressable>
          </View>
          <ThemedText style={styles.subtitle}>
            Tu cuenta y configuración.
          </ThemedText>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <ThemedText type="subtitle">Cuenta</ThemedText>

              <View style={styles.accountActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Editar perfil"
                  accessibilityHint="Actualiza tu nombre, correo o móvil"
                  onPress={() => setEditProfileVisible(true)}
                  style={[
                    styles.smallIconButton,
                    {
                      borderColor: border,
                      backgroundColor: String(primary) + "12",
                    },
                  ]}
                >
                  <Ionicons name="create-outline" size={20} color="green" />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar contraseña"
                  accessibilityHint="Actualiza tu contraseña"
                  onPress={() => setChangePasswordVisible(true)}
                  style={[
                    styles.smallIconButton,
                    {
                      borderColor: border,
                      backgroundColor: String(primary) + "12",
                    },
                  ]}
                >
                  <Ionicons name="key-outline" size={20} color={yellow} />
                </Pressable>
              </View>
            </View>

            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Nombre</ThemedText>
              <ThemedText style={[styles.value, { color: text }]}>
                {name}
              </ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Correo</ThemedText>
              <ThemedText style={[styles.value, { color: text }]}>
                {email || "—"}
              </ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Móvil</ThemedText>
              <ThemedText style={[styles.value, { color: text }]}>
                {phone || "—"}
              </ThemedText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            accessibilityHint="Elimina la sesión del dispositivo"
            onPress={confirmLogout}
            style={[styles.primaryButton, { backgroundColor: primary }]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.primaryButtonText, { color: onPrimary }]}
            >
              Cerrar sesión
            </ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>

      <ProfileEditModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />

      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, opacity: 0.7 },

  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountActions: {
    flexDirection: "row",
    gap: 10,
  },
  smallIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 50,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlusOverlay: {
    position: "absolute",
    right: 3,
    top: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  value: { opacity: 0.8 },

  primaryButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {},
});
