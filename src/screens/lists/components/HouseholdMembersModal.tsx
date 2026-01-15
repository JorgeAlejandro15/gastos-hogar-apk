import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
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
  useSetHouseholdMemberRoleMutation,
} from "@/query/households";
import { useAuthStore } from "@/stores/authStore";
import { a11yButton } from "@/utils/accessibility";

type HouseholdMembersModalProps = {
  visible: boolean;
  householdId: string | null;
  householdName?: string;
  onClose: () => void;
};

type Tab = "members" | "invites";

function initials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
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

export function HouseholdMembersModal({
  visible,
  householdId,
  householdName,
  onClose,
}: HouseholdMembersModalProps) {
  const { border, primary, onPrimary, surface } = useThemeColors();
  const toast = useToast();
  const myUserId = useAuthStore((s) => s.user?.id ?? null);

  const [tab, setTab] = useState<Tab>("members");
  const [inviteIdentifier, setInviteIdentifier] = useState("");

  const [memberMenuVisible, setMemberMenuVisible] = useState(false);
  const [menuMember, setMenuMember] = useState<{
    userId: string;
    displayName: string;
    email: string | null;
    role?: "owner" | "member";
  } | null>(null);

  const membersQuery = useHouseholdMembersQuery(householdId, visible);

  const inviteMutation = useInviteToHouseholdMutation();
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
    if (!visible) return;
    setTab("members");
    setInviteIdentifier("");
    setMemberMenuVisible(false);
    setMenuMember(null);
  }, [visible]);

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

  const onInvite = useCallback(async () => {
    if (!householdId) return;

    const identifier = inviteIdentifier.trim();
    if (!identifier) {
      toast.show("Escribe un email o teléfono", { variant: "info" });
      return;
    }

    const dto = identifier.includes("@")
      ? ({ email: identifier } as const)
      : ({ phone: identifier } as const);

    try {
      const res = await inviteMutation.mutateAsync({ householdId, dto });
      setInviteIdentifier("");

      toast.show("Invitación creada", { variant: "success" });
      Alert.alert(
        "Invitación creada",
        `Comparte este token con el invitado:\n\n${res.token}`
      );
    } catch (e) {
      toast.show(getApiErrorMessage(e), { variant: "error" });
    }
  }, [householdId, inviteIdentifier, inviteMutation, toast]);

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
            { borderColor: String(border), backgroundColor: surface },
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

          {tab === "invites" && canManage ? (
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
                Escribe un email o teléfono. Te mostraremos un token para
                compartir.
              </ThemedText>

              <TextField
                placeholder="Email o teléfono"
                value={inviteIdentifier}
                onChangeText={setInviteIdentifier}
                autoCapitalize="none"
              />

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
          ) : null}

          {tab === "invites" && canManage ? (
            invitationsQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <ThemedText style={styles.muted}>Cargando…</ThemedText>
              </View>
            ) : invitationsQuery.isError ? (
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
                  <ThemedText type="defaultSemiBold" style={{ color: primary }}>
                    Reintentar
                  </ThemedText>
                </Pressable>
              </View>
            ) : (invitationsQuery.data ?? []).length === 0 ? (
              <View style={styles.center}>
                <ThemedText style={styles.muted}>
                  No hay invitaciones.
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={invitationsQuery.data ?? []}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const statusLabel =
                    item.status === "pending"
                      ? "Pendiente"
                      : item.status === "accepted"
                      ? "Aceptada"
                      : item.status === "revoked"
                      ? "Revocada"
                      : "Expirada";

                  const statusColor =
                    item.status === "pending"
                      ? primary
                      : item.status === "accepted"
                      ? "#22c55e"
                      : item.status === "revoked"
                      ? "#ef4444"
                      : "#f59e0b";

                  const canRevoke = item.status === "pending";

                  return (
                    <View
                      style={StyleSheet.flatten([
                        styles.row,
                        { borderColor: String(border) },
                      ])}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.nameRow}>
                          <ThemedText type="defaultSemiBold">
                            {item.invitedIdentifier ?? "Invitación"}
                          </ThemedText>
                          <View
                            style={StyleSheet.flatten([
                              styles.badge,
                              { backgroundColor: String(statusColor) },
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
                          {formatWhen(item.createdAt)}
                        </ThemedText>
                      </View>

                      {canRevoke ? (
                        <Pressable
                          {...a11yButton("Revocar invitación")}
                          onPress={() => {
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
                                      await revokeInvitationMutation.mutateAsync(
                                        {
                                          householdId,
                                          invitationId: item.id,
                                        }
                                      );
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
                          style={({ pressed }) => [
                            styles.iconButton,
                            {
                              borderColor: String(border),
                              backgroundColor: "#ef4444" + "10",
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#ef4444"
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                }}
              />
            )
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
              data={membersQuery.data ?? []}
              keyExtractor={(item) => item.userId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const badgeLabel =
                  item.role === "owner"
                    ? "Owner"
                    : item.role === "member"
                    ? "Miembro"
                    : null;

                const showMenuButton =
                  canManage && !!householdId && item.userId !== myUserId;

                return (
                  <View
                    style={StyleSheet.flatten([
                      styles.row,
                      { borderColor: String(border) },
                    ])}
                    accessible
                    accessibilityRole="text"
                    accessibilityLabel={`Miembro: ${item.displayName}`}
                  >
                    <View
                      style={StyleSheet.flatten([
                        styles.avatar,
                        { backgroundColor: String(primary) + "22" },
                      ])}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={{ color: primary }}
                      >
                        {initials(item.displayName)}
                      </ThemedText>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={styles.nameRow}>
                        <ThemedText type="defaultSemiBold">
                          {item.displayName}
                        </ThemedText>
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
                      {!!item.email && (
                        <ThemedText style={styles.email}>
                          {item.email}
                        </ThemedText>
                      )}
                    </View>

                    {showMenuButton ? (
                      <Pressable
                        {...a11yButton("Acciones")}
                        onPress={() => openMemberMenu(item)}
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            borderColor: String(border),
                            backgroundColor: String(primary) + "10",
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={18}
                          color={primary}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                );
              }}
            />
          )}

          <View style={styles.footerRow}>
            <ThemedText style={styles.footerHint}>
              Solo puedes ver miembros de hogares donde eres miembro.
            </ThemedText>
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
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  footerRow: {
    paddingTop: 2,
  },
  footerHint: {
    fontSize: 12,
    opacity: 0.65,
  },
});
