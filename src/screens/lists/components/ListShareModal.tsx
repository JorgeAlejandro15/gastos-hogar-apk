import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import { getApiErrorMessage } from "@/api/api";
import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useInviteHouseholdByEmailMutation,
  useMyHouseholdMembersQuery,
  useSearchUserForInviteMutation,
} from "@/query/households";
import type { InviteMethod, SearchUserResult } from "@/types/households";
import type { ListScope } from "@/types/lists";
import { a11yButton } from "@/utils/accessibility";
import { isValidEmail, isValidPhone, normalizePhone } from "@/utils/validation";

type LastInvite = {
  email: string | null;
  phone: string | null;
  token: string;
  method: InviteMethod;
};

export type ListShareModalProps = {
  visible: boolean;
  onClose: () => void;

  listName: string;
  listScope: ListScope | "unknown";

  text: string;
  tint: string;
  isCompact: boolean;
};

export function ListShareModal({
  visible,
  onClose,
  listName,
  listScope,
  text,
  tint,
  isCompact,
}: ListShareModalProps) {
  const invite = useInviteHouseholdByEmailMutation();
  const searchUser = useSearchUserForInviteMutation();
  const membersQuery = useMyHouseholdMembersQuery(visible);

  const [inviteMethod, setInviteMethod] = useState<InviteMethod>("email");
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [searchResult, setSearchResult] = useState<SearchUserResult | null>(
    null
  );
  const [lastInvite, setLastInvite] = useState<LastInvite | null>(null);
  const { border } = useThemeColors();

  const canShare = listScope !== "personal";

  const { primary, onPrimary } = useThemeColors();

  // Validación de email o phone usando funciones centralizadas
  const validateIdentifier = useCallback(
    (value: string, method: InviteMethod): boolean => {
      if (method === "email") {
        return isValidEmail(value);
      } else {
        return isValidPhone(value);
      }
    },
    []
  );

  const shareMessage = useMemo(() => {
    if (!lastInvite) return "";

    const baseMessage = `Invitación para unirse al hogar y ver listas compartidas (incluye: ${listName}).\n\n`;

    if (lastInvite.method === "email" && searchResult?.exists) {
      // Usuario existe con email
      return (
        baseMessage +
        `Ya tienes cuenta. Pasos:\n` +
        `1) Inicia sesión con tu email${
          lastInvite.email ? `: ${lastInvite.email}` : ""
        }\n` +
        `2) Ve a Perfil → Unirme con código\n` +
        `3) Pega este código: ${lastInvite.token}`
      );
    } else if (lastInvite.method === "phone" && searchResult?.exists) {
      // Usuario existe con phone
      return (
        baseMessage +
        `Ya tienes cuenta. Pasos:\n` +
        `1) Inicia sesión con tu teléfono\n` +
        `2) Ve a Perfil → Unirme con código\n` +
        `3) Pega este código: ${lastInvite.token}`
      );
    } else {
      // Usuario nuevo
      const identifierText =
        lastInvite.method === "email" && lastInvite.email
          ? `este email: ${lastInvite.email}`
          : lastInvite.method === "phone" && lastInvite.phone
          ? `tu teléfono: ${lastInvite.phone}`
          : "email o teléfono";

      return (
        baseMessage +
        `Pasos:\n` +
        `1) Descarga la app\n` +
        `2) Regístrate con ${identifierText}\n` +
        `3) La invitación se aceptará automáticamente, o ve a Perfil → Unirme con código si no ocurre\n\n` +
        `Código: ${lastInvite.token}`
      );
    }
  }, [lastInvite, listName, searchResult]);

  const onPressClose = useCallback(() => {
    setLastInvite(null);
    setInviteIdentifier("");
    setSearchResult(null);
    setInviteMethod("email");
    onClose();
  }, [onClose]);

  // Buscar usuario antes de invitar
  const onSearchUser = useCallback(async () => {
    const identifier = inviteIdentifier.trim();
    if (!identifier) {
      Alert.alert(
        "Falta identificador",
        "Escribe el email o teléfono de la persona a invitar."
      );
      return;
    }

    if (!validateIdentifier(identifier, inviteMethod)) {
      Alert.alert(
        "Formato inválido",
        inviteMethod === "email"
          ? "El email no tiene un formato válido."
          : "El teléfono debe estar en formato E.164 (ej: +34612345678)."
      );
      return;
    }

    try {
      const result = await searchUser.mutateAsync({ identifier });
      setSearchResult(result);

      if (result.isAlreadyMember) {
        Alert.alert(
          "Ya es miembro",
          `${result.displayName} ya pertenece a tu hogar.`
        );
      }
    } catch (e) {
      Alert.alert("Error", getApiErrorMessage(e));
    }
  }, [inviteIdentifier, inviteMethod, searchUser, validateIdentifier]);

  const onInvite = useCallback(async () => {
    const identifier = inviteIdentifier.trim();
    if (!identifier) {
      Alert.alert(
        "Falta identificador",
        "Escribe el email o teléfono de la persona a invitar."
      );
      return;
    }

    if (!validateIdentifier(identifier, inviteMethod)) {
      Alert.alert(
        "Formato inválido",
        inviteMethod === "email"
          ? "El email no tiene un formato válido."
          : "El teléfono debe estar en formato (ej: +57669832)."
      );
      return;
    }

    // Verificar si ya es miembro
    if (searchResult?.isAlreadyMember) {
      Alert.alert(
        "Ya es miembro",
        `${searchResult.displayName} ya pertenece a tu hogar.`
      );
      return;
    }

    try {
      const dto =
        inviteMethod === "email"
          ? { email: identifier.trim().toLowerCase() }
          : { phone: normalizePhone(identifier) };
      const res = await invite.mutateAsync(dto);
      setLastInvite({
        email: res.email,
        phone: res.phone,
        token: res.token,
        method: res.method,
      });
      Alert.alert(
        "Invitación creada",
        "Se generó un código. Puedes copiarlo y enviarlo por WhatsApp/Telegram."
      );
    } catch (e) {
      Alert.alert("No se pudo invitar", getApiErrorMessage(e));
    }
  }, [
    invite,
    inviteIdentifier,
    inviteMethod,
    searchResult,
    validateIdentifier,
  ]);

  const onCopyToken = useCallback(async () => {
    if (!lastInvite) return;
    try {
      await Clipboard.setStringAsync(lastInvite.token);
      Alert.alert("Copiado", "El código de invitación fue copiado.");
    } catch {
      // As a backup, open the Share dialog (some platforms include a "Copy" action)
      try {
        await Share.share({ message: lastInvite.token });
      } catch {
        Alert.alert(
          "Código",
          "No se pudo copiar automáticamente. Mantén pulsado el código para seleccionarlo y copiarlo."
        );
      }
    }
  }, [lastInvite]);

  const onShareToken = useCallback(async () => {
    if (!lastInvite) return;
    try {
      await Share.share({ message: shareMessage });
    } catch {
      // user cancelled or not available
    }
  }, [lastInvite, shareMessage]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onPressClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.card, { borderColor: String(text) + "22" }]}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Compartir</ThemedText>
            <ThemedText style={{ opacity: 0.75, fontSize: 13 }}>
              {listName}
            </ThemedText>
          </View>

          {!canShare ? (
            <ThemedView style={styles.section}>
              <ThemedText type="defaultSemiBold">Lista personal</ThemedText>
              <ThemedText style={{ opacity: 0.8 }}>
                Esta lista es personal. Para compartir, crea una lista
                compartida.
              </ThemedText>
            </ThemedView>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedView style={styles.section}>
                <ThemedText type="defaultSemiBold">
                  Miembros del hogar
                </ThemedText>
                {membersQuery.isLoading ? (
                  <ThemedText style={{ opacity: 0.75 }}>Cargando…</ThemedText>
                ) : membersQuery.isError ? (
                  <ThemedText style={{ opacity: 0.75 }}>
                    {getApiErrorMessage(membersQuery.error)}
                  </ThemedText>
                ) : (membersQuery.data ?? []).length === 0 ? (
                  <ThemedText style={{ opacity: 0.75 }}>
                    No hay miembros.
                  </ThemedText>
                ) : (
                  <View style={{ gap: 6, marginTop: 6 }}>
                    {(membersQuery.data ?? []).map((m) => (
                      <ThemedText key={m.userId} style={{ opacity: 0.85 }}>
                        • {m.displayName}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </ThemedView>

              <ThemedView style={styles.section}>
                <ThemedText type="defaultSemiBold">
                  Invitar por correo o teléfono
                </ThemedText>
                <ThemedText style={{ opacity: 0.75, fontSize: 13 }}>
                  Esto invita al hogar. Al aceptar, verá todas las listas
                  compartidas.
                </ThemedText>

                {/* Selector de método */}
                <View style={styles.methodSelector}>
                  <Pressable
                    {...a11yButton("Invitar por email")}
                    onPress={() => {
                      setInviteMethod("email");
                      setSearchResult(null);
                    }}
                    style={[
                      styles.methodButton,
                      {
                        backgroundColor:
                          inviteMethod === "email"
                            ? primary + "99"
                            : "transparent",
                        borderColor: border,
                      },
                    ]}
                  >
                    <ThemedText
                      type={
                        inviteMethod === "email" ? "defaultSemiBold" : "default"
                      }
                    >
                      Correo
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    {...a11yButton("Invitar por teléfono")}
                    onPress={() => {
                      setInviteMethod("phone");
                      setSearchResult(null);
                    }}
                    style={[
                      styles.methodButton,
                      {
                        backgroundColor:
                          inviteMethod === "phone"
                            ? primary + "99"
                            : "transparent",
                        borderColor: border,
                      },
                    ]}
                  >
                    <ThemedText
                      type={
                        inviteMethod === "phone" ? "defaultSemiBold" : "default"
                      }
                    >
                      Teléfono
                    </ThemedText>
                  </Pressable>
                </View>

                <TextField
                  placeholder={
                    inviteMethod === "email"
                      ? "Email (ej: amigo@example.com)"
                      : "Teléfono (ej: +57669832)"
                  }
                  value={inviteIdentifier}
                  onChangeText={(text) => {
                    setInviteIdentifier(text);
                    setSearchResult(null);
                  }}
                  autoCapitalize="none"
                  keyboardType={
                    inviteMethod === "email" ? "email-address" : "phone-pad"
                  }
                />

                {/* Botón de búsqueda */}
                <Pressable
                  {...a11yButton(
                    "Buscar usuario",
                    "Verifica si el usuario ya existe"
                  )}
                  onPress={onSearchUser}
                  disabled={searchUser.isPending}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      borderColor: String(text) + "22",
                      opacity: searchUser.isPending ? 0.7 : pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <ThemedText type="defaultSemiBold">
                    {searchUser.isPending ? "Buscando…" : "Buscar usuario"}
                  </ThemedText>
                </Pressable>

                {/* Resultado de búsqueda */}
                {searchResult && (
                  <ThemedView
                    style={[
                      styles.searchResultBox,
                      {
                        backgroundColor: searchResult.isAlreadyMember
                          ? "#ff525215"
                          : searchResult.exists
                          ? String(tint) + "15"
                          : String(text) + "0A",
                        borderWidth: 1,
                        borderColor: searchResult.isAlreadyMember
                          ? "#ff525230"
                          : searchResult.exists
                          ? String(tint) + "30"
                          : String(text) + "15",
                      },
                    ]}
                  >
                    {searchResult.isAlreadyMember ? (
                      <>
                        <ThemedText type="defaultSemiBold">
                          ⚠️ Ya es miembro
                        </ThemedText>
                        <ThemedText style={{ opacity: 0.8, fontSize: 13 }}>
                          {searchResult.displayName} ya pertenece a tu hogar.
                        </ThemedText>
                      </>
                    ) : searchResult.exists ? (
                      <>
                        <ThemedText type="defaultSemiBold">
                          ✓ Usuario encontrado
                        </ThemedText>
                        <ThemedText style={{ opacity: 0.8, fontSize: 13 }}>
                          {searchResult.displayName} recibirá una invitación
                          para unirse al hogar.
                        </ThemedText>
                      </>
                    ) : (
                      <>
                        <ThemedText type="defaultSemiBold">
                          Usuario no registrado
                        </ThemedText>
                        <ThemedText style={{ opacity: 0.8, fontSize: 13 }}>
                          Se enviará una invitación. Al registrarse se unirá
                          automáticamente.
                        </ThemedText>
                      </>
                    )}
                  </ThemedView>
                )}

                <Pressable
                  {...a11yButton(
                    "Crear invitación",
                    "Genera un código para invitar a un usuario"
                  )}
                  onPress={onInvite}
                  disabled={invite.isPending}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: String(tint),
                      opacity: invite.isPending ? 0.7 : pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: onPrimary }}
                  >
                    {invite.isPending ? "Generando…" : "Invitar"}
                  </ThemedText>
                </Pressable>

                {lastInvite ? (
                  <ThemedView style={styles.tokenBox}>
                    <ThemedText type="defaultSemiBold">Código</ThemedText>
                    <ThemedText selectable style={styles.mono}>
                      {lastInvite.token}
                    </ThemedText>

                    <View
                      style={StyleSheet.flatten([
                        styles.row,
                        isCompact && styles.rowCompact,
                      ])}
                    >
                      <Pressable
                        {...a11yButton("Copiar código")}
                        onPress={onCopyToken}
                        style={StyleSheet.flatten([
                          styles.secondaryButton,
                          { borderColor: String(text) + "22" },
                          isCompact && styles.rowButtonCompact,
                        ])}
                      >
                        <ThemedText type="defaultSemiBold">Copiar</ThemedText>
                      </Pressable>

                      <Pressable
                        {...a11yButton("Compartir código")}
                        onPress={onShareToken}
                        style={StyleSheet.flatten([
                          styles.secondaryButton,
                          { borderColor: String(text) + "22" },
                          isCompact && styles.rowButtonCompact,
                        ])}
                      >
                        <ThemedText type="defaultSemiBold">
                          Compartir
                        </ThemedText>
                      </Pressable>
                    </View>
                  </ThemedView>
                ) : null}
              </ThemedView>
            </ScrollView>
          )}

          <View
            style={StyleSheet.flatten([
              styles.footer,
              isCompact && styles.footerCompact,
            ])}
          >
            <Pressable
              {...a11yButton("Cerrar")}
              onPress={onPressClose}
              style={StyleSheet.flatten([
                styles.secondaryButton,
                { borderColor: String(text) + "22" },
                isCompact && styles.footerButtonCompact,
              ])}
            >
              <ThemedText type="defaultSemiBold">Cerrar</ThemedText>
            </Pressable>
          </View>
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
    maxHeight: "86%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 2,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 4,
    gap: 12,
  },
  section: {
    gap: 10,
    backgroundColor: "transparent",
  },
  methodSelector: {
    flexDirection: "row",
    gap: 10,
  },
  methodButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
  },
  searchResultBox: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  tokenBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "transparent",
    gap: 8,
  },
  mono: {
    fontSize: 12,
    opacity: 0.9,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowCompact: {
    flexDirection: "column",
  },
  rowButtonCompact: {
    width: "100%",
    flex: 0,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
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
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  footerCompact: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  footerButtonCompact: {
    width: "100%",
    flex: 0,
  },
});
