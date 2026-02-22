import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
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
import {
  ActionSheet,
  type ActionSheetOption,
} from "@/components/ui/ActionSheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useToast } from "@/providers/ToastProvider";
import {
  useHouseholdInvitationsQuery,
  useHouseholdMembersQuery,
  useInviteToHouseholdMutation,
  useRemoveHouseholdMemberMutation,
  useRevokeHouseholdInvitationMutation,
  useSearchUserForInviteMutation,
  useSetHouseholdMemberRoleMutation,
} from "@/query/households";
import { useAuthStore } from "@/stores/authStore";
import { a11yButton } from "@/utils/accessibility";
import { isValidEmail, isValidPhone, normalizePhone } from "@/utils/validation";

type HouseholdMembersModalProps = {
  visible: boolean;
  householdId: string | null;
  householdName?: string;
  onClose: () => void;
};

type Tab = "members" | "invites";

type InviteMethod = "email" | "phone";

function initials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  try {
    return d.toLocaleString();
  } catch {
    return d.toISOString();
  }
}

// Componentes memoizados para reducir re-renders en cambios de tema
const MemberRow = React.memo(function MemberRow({
  member,
  myUserId,
  canManage,
  householdId,
  border,
  primary,
  onPrimary,
  onOpenMenu,
}: {
  member: {
    userId: string;
    displayName: string;
    email: string | null;
    role?: "owner" | "member";
  };
  myUserId: string | null;
  canManage: boolean;
  householdId: string | null;
  border: string;
  primary: string;
  onPrimary: string;
  onOpenMenu: () => void;
}) {
  const badgeLabel =
    member.role === "owner"
      ? "Owner"
      : member.role === "member"
        ? "Miembro"
        : null;

  const showMenuButton =
    canManage && !!householdId && member.userId !== myUserId;

  return (
    <View
      style={StyleSheet.flatten([styles.row, { borderColor: border }])}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Miembro: ${member.displayName}`}
    >
      <View
        style={StyleSheet.flatten([
          styles.avatar,
          { backgroundColor: primary + "22" },
        ])}
      >
        <ThemedText type="defaultSemiBold" style={{ color: primary }}>
          {initials(member.displayName)}
        </ThemedText>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.nameRow}>
          <ThemedText type="defaultSemiBold">{member.displayName}</ThemedText>
          {badgeLabel && (
            <View
              style={StyleSheet.flatten([
                styles.badge,
                { backgroundColor: primary },
              ])}
            >
              <ThemedText
                style={{
                  color: onPrimary,
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {badgeLabel}
              </ThemedText>
            </View>
          )}
        </View>
        {!!member.email && (
          <ThemedText style={styles.email}>{member.email}</ThemedText>
        )}
      </View>

      {showMenuButton ? (
        <Pressable
          {...a11yButton("Acciones")}
          onPress={onOpenMenu}
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderColor: border,
              backgroundColor: primary + "10",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={primary} />
        </Pressable>
      ) : null}
    </View>
  );
});

const InvitationRow = React.memo(function InvitationRow({
  invitation,
  householdId,
  border,
  primary,
  onRevoke,
}: {
  invitation: {
    id: string;
    invitedIdentifier: string | null;
    status: "pending" | "accepted" | "revoked" | "expired";
    createdAt: string;
  };
  householdId: string | null;
  border: string;
  primary: string;
  onRevoke: (invitationId: string) => void;
}) {
  const statusLabel =
    invitation.status === "pending"
      ? "Pendiente"
      : invitation.status === "accepted"
        ? "Aceptada"
        : invitation.status === "revoked"
          ? "Revocada"
          : "Expirada";

  const statusColor =
    invitation.status === "pending"
      ? primary
      : invitation.status === "accepted"
        ? "#22c55e"
        : invitation.status === "revoked"
          ? "#ef4444"
          : "#f59e0b";

  const canRevoke = invitation.status === "pending";

  return (
    <View style={StyleSheet.flatten([styles.row, { borderColor: border }])}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.nameRow}>
          <ThemedText type="defaultSemiBold">
            {invitation.invitedIdentifier ?? "Invitación"}
          </ThemedText>
          <View
            style={StyleSheet.flatten([
              styles.badge,
              { backgroundColor: statusColor },
            ])}
          >
            <ThemedText
              style={{
                color: "#fff",
                fontSize: 10,
                fontWeight: "700",
              }}
            >
              {statusLabel}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.email}>
          {formatWhen(invitation.createdAt)}
        </ThemedText>
      </View>

      {canRevoke ? (
        <Pressable
          {...a11yButton("Revocar invitación")}
          onPress={() => onRevoke(invitation.id)}
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderColor: border,
              backgroundColor: "#ef4444" + "10",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </Pressable>
      ) : null}
    </View>
  );
});

export function HouseholdMembersModal({
  visible,
  householdId,
  householdName,
  onClose,
}: HouseholdMembersModalProps) {
  const { border, primary, onPrimary, surface } = useThemeColors();
  const toast = useToast();
  const myUserId = useAuthStore((s) => s.user?.id ?? null);

  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [tab, setTab] = useState<Tab>("members");
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>("email");
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [searchResult, setSearchResult] = useState<{
    exists: boolean;
    isAlreadyMember: boolean;
    canInvite: boolean;
    displayName?: string;
    method: "email" | "phone";
  } | null>(null);

  const [memberMenuVisible, setMemberMenuVisible] = useState(false);
  const [menuMember, setMenuMember] = useState<{
    userId: string;
    displayName: string;
    email: string | null;
    role?: "owner" | "member";
  } | null>(null);

  const membersQuery = useHouseholdMembersQuery(householdId, visible);

  const inviteMutation = useInviteToHouseholdMutation();
  const searchUser = useSearchUserForInviteMutation();
  const revokeInvitationMutation = useRevokeHouseholdInvitationMutation();
  const setRoleMutation = useSetHouseholdMemberRoleMutation();
  const removeMemberMutation = useRemoveHouseholdMemberMutation();

  const myRole = useMemo(() => {
    if (!myUserId) return null;
    const me = (membersQuery.data ?? []).find((m) => m.userId === myUserId);
    return me?.role ?? null;
  }, [membersQuery.data, myUserId]);

  const canManage = myRole === "owner";

  const invitationsQuery = useHouseholdInvitationsQuery(
    householdId,
    visible && canManage
  );

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const modalCardHeight = useMemo(() => {
    // Keep this stable while typing; changing container height on keyboard events
    // can cause focus loss on Android (keyboard closes immediately).
    const overlayPadding = 32; // styles.modalOverlay.padding * 2
    const available = windowHeight - overlayPadding;
    const desired = windowHeight * 0.85;
    return Math.max(320, Math.min(desired, available));
  }, [windowHeight]);

  useEffect(() => {
    if (!visible) return;
    setTab("members");
    setInviteMethod("email");
    setInviteIdentifier("");
    setSearchResult(null);
    setMemberMenuVisible(false);
    setMenuMember(null);
  }, [visible]);

  const validateIdentifier = useCallback(
    (value: string, method: InviteMethod): boolean => {
      return method === "email" ? isValidEmail(value) : isValidPhone(value);
    },
    []
  );

  const onInvite = useCallback(async () => {
    if (!householdId) return;

    const identifier = inviteIdentifier.trim();
    if (!identifier) {
      toast.show("Escribe un email o teléfono", { variant: "info" });
      return;
    }

    if (!validateIdentifier(identifier, inviteMethod)) {
      toast.show(
        inviteMethod === "email"
          ? "El email no tiene un formato válido."
          : "El teléfono debe estar en formato E.164 (ej: +34612345678) o solo dígitos (ej: 55246555).",
        { variant: "info" }
      );
      return;
    }

    if (searchResult?.isAlreadyMember) {
      toast.show("Este usuario ya pertenece al hogar", { variant: "info" });
      return;
    }

    const dto =
      inviteMethod === "email"
        ? ({ email: identifier.trim().toLowerCase() } as const)
        : ({ phone: normalizePhone(identifier) } as const);

    try {
      const res = await inviteMutation.mutateAsync({ householdId, dto });
      setInviteIdentifier("");
      setSearchResult(null);

      toast.show("Invitación creada", { variant: "success" });
      Alert.alert(
        "Invitación creada",
        `Comparte este token con el invitado:\n\n${res.token}`
      );
    } catch (e) {
      toast.show(getApiErrorMessage(e), { variant: "error" });
    }
  }, [
    householdId,
    inviteIdentifier,
    inviteMethod,
    inviteMutation,
    searchResult?.isAlreadyMember,
    toast,
    validateIdentifier,
  ]);

  const onSearchUser = useCallback(async () => {
    if (!householdId) return;

    const identifier = inviteIdentifier.trim();
    if (!identifier) {
      toast.show("Escribe el email o teléfono de la persona", {
        variant: "info",
      });
      return;
    }

    if (!validateIdentifier(identifier, inviteMethod)) {
      toast.show(
        inviteMethod === "email"
          ? "El email no tiene un formato válido."
          : "El teléfono debe estar en formato E.164 (ej: +34612345678) o solo dígitos (ej: 55246555).",
        { variant: "info" }
      );
      return;
    }

    try {
      const identifierForSearch =
        inviteMethod === "email"
          ? identifier.trim().toLowerCase()
          : normalizePhone(identifier);

      const result = await searchUser.mutateAsync({
        identifier: identifierForSearch,
        householdId,
      });
      setSearchResult(result);

      if (result.isAlreadyMember) {
        toast.show("Este usuario ya pertenece al hogar", { variant: "info" });
      }
    } catch (e) {
      toast.show(getApiErrorMessage(e), { variant: "error" });
    }
  }, [
    householdId,
    inviteIdentifier,
    inviteMethod,
    searchUser,
    toast,
    validateIdentifier,
  ]);

  // IMPORTANT: define this after onInvite/onSearchUser to avoid TDZ runtime errors.
  const inviteListHeader = useMemo(() => {
    return (
      <View
        style={StyleSheet.flatten([
          styles.inviteCard,
          {
            borderColor: String(border),
            backgroundColor: String(primary) + "06",
          },
        ])}
      >
        <ThemedText type="defaultSemiBold">Invitar</ThemedText>
        <ThemedText style={styles.muted}>
          Escribe un email o teléfono. Te mostraremos un token para compartir.
        </ThemedText>

        <View style={styles.methodSelector}>
          <Pressable
            {...a11yButton("Invitar por email")}
            onPress={() => {
              setInviteMethod("email");
              setSearchResult(null);
            }}
            style={({ pressed }) => [
              styles.methodButton,
              {
                borderColor: String(border),
                backgroundColor:
                  inviteMethod === "email"
                    ? String(primary) + "22"
                    : "transparent",
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText
              type={inviteMethod === "email" ? "defaultSemiBold" : "default"}
              style={{ color: String(primary) }}
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
            style={({ pressed }) => [
              styles.methodButton,
              {
                borderColor: String(border),
                backgroundColor:
                  inviteMethod === "phone"
                    ? String(primary) + "22"
                    : "transparent",
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText
              type={inviteMethod === "phone" ? "defaultSemiBold" : "default"}
              style={{ color: String(primary) }}
            >
              Teléfono
            </ThemedText>
          </Pressable>
        </View>

        <TextField
          placeholder={
            inviteMethod === "email"
              ? "Email (ej: amigo@example.com)"
              : "Teléfono (ej: +34612345678 o 55246555)"
          }
          value={inviteIdentifier}
          onChangeText={(t) => {
            setInviteIdentifier(t);
            setSearchResult(null);
          }}
          autoCapitalize="none"
        />

        <View style={styles.inviteActionsRow}>
          <Pressable
            {...a11yButton(
              "Buscar usuario",
              "Verifica si el usuario ya existe antes de invitar"
            )}
            onPress={onSearchUser}
            disabled={searchUser.isPending}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: String(border),
                backgroundColor: String(primary) + "0A",
                opacity: searchUser.isPending ? 0.7 : pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: primary }}>
              {searchUser.isPending ? "Buscando…" : "Buscar"}
            </ThemedText>
          </Pressable>

          <Pressable
            {...a11yButton("Invitar")}
            onPress={onInvite}
            disabled={inviteMutation.isPending}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: String(primary),
                opacity: inviteMutation.isPending ? 0.7 : pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
              {inviteMutation.isPending ? "Enviando…" : "+ Invitar"}
            </ThemedText>
          </Pressable>
        </View>

        {searchResult ? (
          <ThemedView
            style={StyleSheet.flatten([
              styles.searchResultBox,
              {
                borderColor: searchResult.isAlreadyMember
                  ? "#ef4444" + "55"
                  : searchResult.exists
                    ? String(primary) + "55"
                    : String(border),
                backgroundColor: searchResult.isAlreadyMember
                  ? "#ef4444" + "12"
                  : searchResult.exists
                    ? String(primary) + "10"
                    : String(primary) + "06",
              },
            ])}
          >
            {searchResult.isAlreadyMember ? (
              <>
                <ThemedText type="defaultSemiBold">⚠️ Ya es miembro</ThemedText>
                <ThemedText style={styles.muted}>
                  {searchResult.displayName ?? "El usuario"} ya pertenece a este
                  hogar.
                </ThemedText>
              </>
            ) : searchResult.exists ? (
              <>
                <ThemedText type="defaultSemiBold">
                  ✓ Usuario encontrado
                </ThemedText>
                <ThemedText style={styles.muted}>
                  {searchResult.displayName ?? "El usuario"} recibirá la
                  invitación.
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="defaultSemiBold">
                  Usuario no registrado
                </ThemedText>
                <ThemedText style={styles.muted}>
                  Se generará un token. Al registrarse podrá unirse.
                </ThemedText>
              </>
            )}
          </ThemedView>
        ) : null}
      </View>
    );
  }, [
    border,
    inviteIdentifier,
    inviteMethod,
    inviteMutation.isPending,
    onInvite,
    onPrimary,
    onSearchUser,
    primary,
    searchResult,
    searchUser.isPending,
  ]);

  const title = useMemo(() => {
    const name = String(householdName || "").trim();
    return name ? `Miembros — ${name}` : "Miembros";
  }, [householdName]);

  const openMemberMenu = useCallback(
    (member: {
      userId: string;
      displayName: string;
      email: string | null;
      role?: "owner" | "member";
    }) => {
      setMenuMember(member);
      setMemberMenuVisible(true);
    },
    []
  );

  const memberMenuOptions: ActionSheetOption[] = useMemo(() => {
    if (!canManage || !menuMember || !householdId) return [];

    const opts: ActionSheetOption[] = [];

    if (menuMember.role === "member") {
      opts.push({
        key: "promote",
        label: "Hacer owner",
        icon: "shield-checkmark-outline",
      });
    }

    if (menuMember.role === "owner") {
      opts.push({
        key: "demote",
        label: "Hacer miembro",
        icon: "person-outline",
      });
    }

    opts.push({
      key: "remove",
      label: "Expulsar",
      hint: "Elimina su acceso al hogar",
      icon: "trash-outline",
      destructive: true,
    });

    return opts;
  }, [canManage, householdId, menuMember]);

  const onSelectMemberMenu = useCallback(
    async (key: string) => {
      if (!householdId || !menuMember) return;
      setMemberMenuVisible(false);

      if (key === "promote") {
        try {
          await setRoleMutation.mutateAsync({
            householdId,
            memberUserId: menuMember.userId,
            dto: { role: "owner" },
          });
          toast.show("Rol actualizado", { variant: "success" });
        } catch (e) {
          toast.show(getApiErrorMessage(e), { variant: "error" });
        }
        return;
      }

      if (key === "demote") {
        Alert.alert(
          "Cambiar rol",
          `¿Hacer miembro a ${menuMember.displayName}?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Confirmar",
              onPress: async () => {
                try {
                  await setRoleMutation.mutateAsync({
                    householdId,
                    memberUserId: menuMember.userId,
                    dto: { role: "member" },
                  });
                  toast.show("Rol actualizado", { variant: "success" });
                } catch (e) {
                  toast.show(getApiErrorMessage(e), { variant: "error" });
                }
              },
            },
          ]
        );
        return;
      }

      if (key === "remove") {
        Alert.alert(
          "Expulsar miembro",
          `¿Expulsar a ${menuMember.displayName}?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Expulsar",
              style: "destructive",
              onPress: async () => {
                try {
                  await removeMemberMutation.mutateAsync({
                    householdId,
                    memberUserId: menuMember.userId,
                  });
                  toast.show("Miembro expulsado", { variant: "success" });
                } catch (e) {
                  toast.show(getApiErrorMessage(e), { variant: "error" });
                }
              },
            },
          ]
        );
      }
    },
    [householdId, menuMember, removeMemberMutation, setRoleMutation, toast]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView
          style={StyleSheet.flatten([
            styles.modalCard,
            {
              borderColor: String(border),
              backgroundColor: surface,
              height: modalCardHeight,
            },
          ])}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{title}</ThemedText>
              <ThemedText style={styles.muted}>
                {membersQuery.isLoading
                  ? "Cargando…"
                  : membersQuery.isError
                    ? "No se pudieron cargar los miembros."
                    : `${(membersQuery.data ?? []).length} miembro(s)`}
              </ThemedText>
            </View>

            <Pressable
              {...a11yButton("Cerrar")}
              onPress={onClose}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  borderColor: String(border),
                  backgroundColor: String(primary) + "10",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={primary} />
            </Pressable>
          </View>

          {canManage ? (
            <SegmentedControl<Tab>
              accessibilityLabel="Secciones del hogar"
              value={tab}
              onChange={setTab}
              options={[
                { value: "members", label: "Miembros" },
                { value: "invites", label: "Invitaciones" },
              ]}
            />
          ) : null}

          <View style={styles.body}>
            {tab === "invites" && canManage ? (
              <FlatList
                style={styles.list}
                data={invitationsQuery.data ?? []}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={StyleSheet.flatten([
                  styles.listContent,
                  { paddingBottom: 12 + keyboardHeight },
                ])}
                keyboardDismissMode="none"
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={inviteListHeader}
                ListEmptyComponent={() => {
                  if (invitationsQuery.isLoading) {
                    return (
                      <View style={styles.center}>
                        <ActivityIndicator />
                        <ThemedText style={styles.muted}>Cargando…</ThemedText>
                      </View>
                    );
                  }

                  if (invitationsQuery.isError) {
                    return (
                      <View style={styles.center}>
                        <ThemedText style={styles.muted}>
                          No se pudieron cargar las invitaciones.
                        </ThemedText>
                        <Pressable
                          {...a11yButton("Reintentar")}
                          onPress={() => invitationsQuery.refetch()}
                          style={({ pressed }) => [
                            styles.retryButton,
                            {
                              borderColor: String(border),
                              backgroundColor: String(primary) + "10",
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <Ionicons name="refresh" size={16} color={primary} />
                          <ThemedText
                            type="defaultSemiBold"
                            style={{ color: primary }}
                          >
                            Reintentar
                          </ThemedText>
                        </Pressable>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.center}>
                      <ThemedText style={styles.muted}>
                        No hay invitaciones.
                      </ThemedText>
                    </View>
                  );
                }}
                renderItem={({ item }) => (
                  <InvitationRow
                    invitation={item}
                    householdId={householdId}
                    border={String(border)}
                    primary={String(primary)}
                    onRevoke={(invitationId) => {
                      Alert.alert(
                        "Revocar invitación",
                        `¿Revocar la invitación a ${
                          item.invitedIdentifier ?? "este usuario"
                        }?`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Revocar",
                            style: "destructive",
                            onPress: async () => {
                              if (!householdId) return;
                              try {
                                await revokeInvitationMutation.mutateAsync({
                                  householdId,
                                  invitationId,
                                });
                                toast.show("Invitación revocada", {
                                  variant: "success",
                                });
                              } catch (e) {
                                toast.show(getApiErrorMessage(e), {
                                  variant: "error",
                                });
                              }
                            },
                          },
                        ]
                      );
                    }}
                  />
                )}
              />
            ) : membersQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <ThemedText style={styles.muted}>Cargando miembros…</ThemedText>
              </View>
            ) : membersQuery.isError ? (
              <View style={styles.center}>
                <ThemedText style={styles.muted}>
                  No se pudieron cargar los miembros.
                </ThemedText>
                <Pressable
                  {...a11yButton("Reintentar")}
                  onPress={() => membersQuery.refetch()}
                  style={({ pressed }) => [
                    styles.retryButton,
                    {
                      borderColor: String(border),
                      backgroundColor: String(primary) + "10",
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name="refresh" size={16} color={primary} />
                  <ThemedText type="defaultSemiBold" style={{ color: primary }}>
                    Reintentar
                  </ThemedText>
                </Pressable>
              </View>
            ) : (membersQuery.data ?? []).length === 0 ? (
              <View style={styles.center}>
                <ThemedText style={styles.muted}>
                  Este hogar no tiene miembros.
                </ThemedText>
              </View>
            ) : (
              <FlatList
                style={styles.list}
                data={membersQuery.data ?? []}
                keyExtractor={(item) => item.userId}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <MemberRow
                    member={item}
                    myUserId={myUserId}
                    canManage={canManage}
                    householdId={householdId}
                    border={String(border)}
                    primary={String(primary)}
                    onPrimary={String(onPrimary)}
                    onOpenMenu={() => openMemberMenu(item)}
                  />
                )}
              />
            )}
          </View>
        </ThemedView>
      </View>

      <ActionSheet
        visible={memberMenuVisible}
        title={
          menuMember?.displayName
            ? `Acciones — ${menuMember.displayName}`
            : "Acciones"
        }
        message={menuMember?.email ?? undefined}
        options={memberMenuOptions}
        onSelect={onSelectMemberMenu}
        onClose={() => setMemberMenuVisible(false)}
      />
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
    maxWidth: 560,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    maxHeight: "85%",
    minHeight: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  muted: {
    opacity: 0.75,
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    paddingVertical: 10,
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  listContent: {
    gap: 10,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  email: {
    opacity: 0.7,
    fontSize: 12,
  },
  inviteCard: {
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  methodSelector: {
    flexDirection: "row",
    gap: 10,
  },
  methodButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  inviteActionsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
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
  searchResultBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flex: 1,
  },
});
