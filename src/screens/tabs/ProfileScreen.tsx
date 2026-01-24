// File: src/screens/tabs/ProfileScreen.optimized.tsx — Versión optimizada con menos re-renders

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useThemeToggle } from "@/hooks/use-theme-toggle";
import { ChangePasswordModal } from "@/screens/profile/components/ChangePasswordModal";
import { ProfileEditModal } from "@/screens/profile/components/ProfileEditModal";
import { useAuthStore } from "@/stores/authStore";

// Memoizar componentes que no dependen del tema
const Header = React.memo(function Header({
  isDarkMode,
  onToggleTheme,
  cardBg,
  border,
  icon,
}: {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  cardBg: string;
  border: string;
  icon: string;
}) {
  return (
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
          onPress={onToggleTheme}
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
  );
});

const AccountCard = React.memo(function AccountCard({
  name,
  email,
  phone,
  cardBg,
  border,
  primary,
  text,
  onEditProfile,
  onChangePassword,
}: {
  name: string;
  email: string;
  phone: string | null;
  cardBg: string;
  border: string;
  primary: string;
  text: string;
  onEditProfile: () => void;
  onChangePassword: () => void;
}) {
  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
    >
      <View style={styles.cardHeaderRow}>
        <ThemedText type="subtitle">Cuenta</ThemedText>

        <View style={styles.accountActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            accessibilityHint="Actualiza tu nombre, correo o móvil"
            onPress={onEditProfile}
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
            onPress={onChangePassword}
            style={[
              styles.smallIconButton,
              {
                borderColor: border,
                backgroundColor: String(primary) + "12",
              },
            ]}
          >
            <Ionicons name="key-outline" size={20} color="#FFD60A" />
          </Pressable>
        </View>
      </View>

      <View style={styles.row}>
        <ThemedText type="defaultSemiBold">Nombre</ThemedText>
        <ThemedText style={[styles.value, { color: text }]}>{name}</ThemedText>
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
  );
});

const LogoutButton = React.memo(function LogoutButton({
  onPress,
  primary,
  onPrimary,
}: {
  onPress: () => void;
  primary: string;
  onPrimary: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      accessibilityHint="Elimina la sesión del dispositivo"
      onPress={onPress}
      style={[styles.primaryButton, { backgroundColor: primary }]}
    >
      <ThemedText
        type="defaultSemiBold"
        style={[styles.primaryButtonText, { color: onPrimary }]}
      >
        Cerrar sesión
      </ThemedText>
    </Pressable>
  );
});

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  // Hook optimizado para gestión de tema
  const { isDarkMode, toggle: toggleTheme } = useThemeToggle();

  // Hook optimizado que retorna todos los colores en una sola llamada
  const colors = useThemeColors();
  const { text, surface: cardBg, border, primary, onPrimary, icon } = colors;

  // Memoizar datos del usuario
  const userData = useMemo(
    () => ({
      name: user?.displayName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? null,
    }),
    [user?.displayName, user?.email, user?.phone]
  );

  // Memoizar callbacks
  const handleEditProfile = useCallback(() => setEditProfileVisible(true), []);
  const handleChangePassword = useCallback(
    () => setChangePasswordVisible(true),
    []
  );
  const handleCloseEditProfile = useCallback(
    () => setEditProfileVisible(false),
    []
  );
  const handleCloseChangePassword = useCallback(
    () => setChangePasswordVisible(false),
    []
  );

  const confirmLogout = useCallback(() => {
    Alert.alert("Cerrar sesión", "¿Seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.container}>
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          cardBg={cardBg}
          border={border}
          icon={icon}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AccountCard
            name={userData.name}
            email={userData.email}
            phone={userData.phone}
            cardBg={cardBg}
            border={border}
            primary={primary}
            text={text}
            onEditProfile={handleEditProfile}
            onChangePassword={handleChangePassword}
          />

          <LogoutButton
            onPress={confirmLogout}
            primary={primary}
            onPrimary={onPrimary}
          />
        </ScrollView>
      </ThemedView>

      <ProfileEditModal
        visible={editProfileVisible}
        onClose={handleCloseEditProfile}
      />

      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={handleCloseChangePassword}
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
