// File: src/screens/lists/components/HouseholdsManagerCard.tsx — Gestión de hogares dentro de la tab Listas.

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  ActionSheet,
  type ActionSheetOption,
} from "@/components/ui/ActionSheet";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useToast } from "@/providers/ToastProvider";
import {
  useDeleteHouseholdMutation,
  useMyHouseholdsQuery,
  useSwitchPrimaryHouseholdMutation,
} from "@/query/households";
import { CreateHouseholdModal } from "@/screens/lists/components/CreateHouseholdModal";
import {
  EditHouseholdModal,
  type EditableHousehold,
} from "@/screens/lists/components/EditHouseholdModal";
import { HouseholdMembersModal } from "@/screens/lists/components/HouseholdMembersModal";
import { JoinHouseholdByCodeModal } from "@/screens/profile/components/JoinHouseholdByCodeModal";
import { useAuthStore } from "@/stores/authStore";
import { a11yButton } from "@/utils/accessibility";

export const HouseholdsManagerCard = React.memo(function HouseholdsManagerCard({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 420;

  const { text, border, primary, onPrimary, surface, icon } = useThemeColors();

  const activeHousehold = useAuthStore((s) => s.household);
  const refreshMe = useAuthStore((s) => s.refreshMe);

  const householdsQuery = useMyHouseholdsQuery();
  const switchHousehold = useSwitchPrimaryHouseholdMutation();
  const deleteHousehold = useDeleteHouseholdMutation();

  const toast = useToast();

  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [membersVisible, setMembersVisible] = useState(false);
  const [selectedHousehold, setSelectedHousehold] =
    useState<EditableHousehold | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuHousehold, setMenuHousehold] = useState<
    | (EditableHousehold & { role: "owner" | "member"; isPrimary: boolean })
    | null
  >(null);
  const [deletingHouseholdId, setDeletingHouseholdId] = useState<string | null>(
    null
  );

  const isBusy =
    switchHousehold.isPending ||
    deleteHousehold.isPending ||
    deletingHouseholdId !== null;

  const activeId = activeHousehold?.id ?? null;

  const subtitle = useMemo(() => {
    if (!activeId)
      return "Crea o únete a un hogar para habilitar listas y gastos.";
    const name = activeHousehold?.name?.trim();
    return name
      ? `Hogar activo: ${name}`
      : "Gestiona tu hogar activo o cambia a otro.";
  }, [activeHousehold?.name, activeId]);

  const handleSwitch = useCallback(
    async (householdId: string) => {
      if (householdId === activeId) return;

      try {
        await switchHousehold.mutateAsync({ householdId });
        await refreshMe();
        toast.show("Hogar activo actualizado", { variant: "success" });
      } catch (e) {
        Alert.alert(
          "No se pudo cambiar",
          e instanceof Error ? e.message : "Inténtalo nuevamente."
        );
      }
    },
    [activeId, refreshMe, switchHousehold, toast]
  );

  const handleDelete = useCallback(
    async (householdId: string) => {
      try {
        setDeletingHouseholdId(householdId);
        await deleteHousehold.mutateAsync(householdId);

        // Refresca auth: el hogar activo puede cambiar o quedar vacío.
        await refreshMe();
        await householdsQuery.refetch();

        toast.show("Hogar eliminado", { variant: "success" });
      } catch (e) {
        Alert.alert(
          "No se pudo eliminar",
          e instanceof Error ? e.message : "Inténtalo nuevamente."
        );
      } finally {
        setDeletingHouseholdId(null);
      }
    },
    [deleteHousehold, householdsQuery, refreshMe, toast]
  );

  const confirmDelete = useCallback(
    (h: { id: string; name: string; isPrimary: boolean }) => {
      Alert.alert(
        "Eliminar hogar",
        `¿Seguro que deseas eliminar "${h.name}"?\n\nEsto eliminará miembros, invitaciones, listas y gastos asociados a este hogar.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => handleDelete(h.id),
          },
        ]
      );
    },
    [handleDelete]
  );

  const openMembers = useCallback(
    (h: { id: string; name: string; currency: string }) => {
      setSelectedHousehold({ id: h.id, name: h.name, currency: h.currency });
      setMembersVisible(true);
    },
    []
  );

  const openEdit = useCallback(
    (h: { id: string; name: string; currency: string }) => {
      setSelectedHousehold({ id: h.id, name: h.name, currency: h.currency });
      setEditVisible(true);
    },
    []
  );

  const openMenu = useCallback(
    (h: {
      id: string;
      name: string;
      currency: string;
      role: "owner" | "member";
      isPrimary: boolean;
    }) => {
      setMenuHousehold({
        id: h.id,
        name: h.name,
        currency: h.currency,
        role: h.role,
        isPrimary: h.isPrimary,
      });
      setMenuVisible(true);
    },
    []
  );

  const menuOptions: ActionSheetOption[] = useMemo(() => {
    if (!menuHousehold) return [];

    const isActive =
      menuHousehold.isPrimary ||
      (activeId != null && menuHousehold.id === activeId);
    const canEdit = menuHousehold.role === "owner";
    const canDelete = menuHousehold.role === "owner";

    const opts: ActionSheetOption[] = [];

    if (!isActive) {
      opts.push({
        key: "switch",
        label: "Activar este hogar",
        hint: "Usar este hogar para listas y gastos",
        icon: "swap-horizontal-outline",
        disabled: isBusy,
      });
    }

    opts.push({
      key: "members",
      label: "Ver miembros",
      hint: "Abrir la lista de miembros",
      icon: "people-outline",
      disabled: isBusy,
    });

    if (canEdit) {
      opts.push({
        key: "edit",
        label: "Editar hogar",
        hint: "Cambiar nombre y moneda",
        icon: "create-outline",
        disabled: isBusy,
      });
    }

    if (canDelete) {
      opts.push({
        key: "delete",
        label: "Eliminar hogar",
        hint: "Elimina miembros, invitaciones, listas y gastos asociados",
        icon: "trash-outline",
        destructive: true,
        disabled: isBusy,
      });
    }

    return opts;
  }, [activeId, isBusy, menuHousehold]);

  return (
    <ThemedView
      style={StyleSheet.flatten([
        styles.card,
        { borderColor: String(border), backgroundColor: surface },
        style,
      ])}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold">Hogares</ThemedText>
          <ThemedText style={styles.muted}>{subtitle}</ThemedText>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="home-outline" size={20} color={icon ?? primary} />
        </View>
      </View>

      <View
        style={StyleSheet.flatten([
          styles.actions,
          isCompact && styles.actionsCompact,
        ])}
      >
        <Pressable
          {...a11yButton("Crear hogar", "Crea un nuevo hogar")}
          onPress={() => setCreateVisible(true)}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.primaryButton,
            isCompact && styles.actionButtonCompact,
            {
              backgroundColor: primary,
              opacity: isBusy ? 0.65 : pressed ? 0.92 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={18} color={onPrimary} />
          <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
            Crear
          </ThemedText>
        </Pressable>

        <Pressable
          {...a11yButton("Unirme con código", "Pega un código de invitación")}
          onPress={() => setJoinVisible(true)}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.secondaryButton,
            isCompact && styles.actionButtonCompact,
            {
              borderColor: String(border),
              backgroundColor: String(primary) + "0F",
              opacity: isBusy ? 0.65 : pressed ? 0.92 : 1,
            },
          ]}
        >
          <Ionicons name="key-outline" size={18} color={primary} />
          <ThemedText type="defaultSemiBold" style={{ color: primary }}>
            Unirme
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.listArea}>
        {householdsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <ThemedText style={styles.muted}>Cargando hogares…</ThemedText>
          </View>
        ) : householdsQuery.isError ? (
          <View style={styles.center}>
            <ThemedText style={styles.muted}>No se pudieron cargar.</ThemedText>
          </View>
        ) : (householdsQuery.data ?? []).length === 0 ? (
          <View style={styles.center}>
            <ThemedText style={styles.muted}>Aún no tienes hogares.</ThemedText>
            <ThemedText style={styles.miniNote}>
              Crea uno para empezar a usar listas.
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {(householdsQuery.data ?? []).map((h) => {
              const isActive =
                h.isPrimary || (activeId != null && h.id === activeId);
              const isDeleting = deletingHouseholdId === h.id;

              return (
                <View
                  key={h.id}
                  style={StyleSheet.flatten([
                    styles.householdItem,
                    { borderColor: String(border) },
                    isActive && {
                      backgroundColor: String(primary) + "10",
                      borderColor: primary,
                    },
                  ])}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Cambiar a hogar: ${h.name}`}
                    accessibilityHint={
                      isActive
                        ? "Este es tu hogar activo"
                        : "Activa este hogar para ver sus listas"
                    }
                    onPress={() => handleSwitch(h.id)}
                    disabled={isBusy || isActive}
                    style={styles.householdMainPressable}
                  >
                    <View style={styles.householdInfo}>
                      <View style={styles.householdNameRow}>
                        <ThemedText type="defaultSemiBold">{h.name}</ThemedText>
                        {isActive && (
                          <View
                            style={StyleSheet.flatten([
                              styles.activeBadge,
                              { backgroundColor: primary },
                            ])}
                          >
                            <ThemedText
                              style={StyleSheet.flatten([
                                styles.activeBadgeText,
                                { color: onPrimary },
                              ])}
                            >
                              Activo
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.householdDetails}>
                        {h.currency} ·{" "}
                        {h.role === "owner" ? "Propietario" : "Miembro"}
                      </ThemedText>
                    </View>
                  </Pressable>

                  <View style={styles.householdActions}>
                    {switchHousehold.isPending && isActive ? (
                      <ActivityIndicator />
                    ) : isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={primary}
                      />
                    ) : null}

                    <Pressable
                      {...a11yButton(
                        `Más acciones para: ${h.name}`,
                        "Abre un menú con acciones"
                      )}
                      onPress={() => openMenu(h)}
                      disabled={isBusy || isDeleting}
                      style={({ pressed }) => [
                        styles.iconButton,
                        {
                          borderColor: String(border),
                          backgroundColor: String(primary) + "0F",
                          opacity:
                            isBusy || isDeleting ? 0.55 : pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      {isDeleting ? (
                        <ActivityIndicator color="#ef4444" />
                      ) : (
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={20}
                          color={icon ?? primary}
                        />
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <CreateHouseholdModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={refreshMe}
        text={String(text)}
        onTintText={String(primary)}
      />

      <JoinHouseholdByCodeModal
        visible={joinVisible}
        onClose={() => setJoinVisible(false)}
        onAccepted={refreshMe}
        border={String(border)}
        primary={String(primary)}
        onPrimary={String(onPrimary)}
        text={String(text)}
      />

      <EditHouseholdModal
        visible={editVisible}
        household={selectedHousehold}
        onClose={() => setEditVisible(false)}
        onSuccess={async () => {
          await refreshMe();
          await householdsQuery.refetch();
        }}
      />

      <HouseholdMembersModal
        visible={membersVisible}
        householdId={selectedHousehold?.id ?? null}
        householdName={selectedHousehold?.name}
        onClose={() => setMembersVisible(false)}
      />

      <ActionSheet
        visible={menuVisible}
        title={
          menuHousehold?.name ? `Hogar: ${menuHousehold.name}` : "Acciones"
        }
        message={
          menuHousehold?.role === "owner"
            ? "Acciones de propietario"
            : "Acciones disponibles"
        }
        options={menuOptions}
        onClose={() => setMenuVisible(false)}
        onSelect={(key) => {
          const h = menuHousehold;
          setMenuVisible(false);
          if (!h) return;

          if (key === "switch") {
            void handleSwitch(h.id);
            return;
          }
          if (key === "members") {
            openMembers(h);
            return;
          }
          if (key === "edit") {
            openEdit(h);
            return;
          }
          if (key === "delete") {
            confirmDelete({ id: h.id, name: h.name, isPrimary: h.isPrimary });
          }
        }}
      />
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    opacity: 0.75,
    fontSize: 12,
    marginTop: 2,
  },
  miniNote: {
    opacity: 0.65,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  actionsCompact: {
    flexDirection: "column",
  },
  actionButtonCompact: {
    width: "100%",
    flex: 0,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    flexGrow: 1,
    flexShrink: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    flexGrow: 1,
    flexShrink: 1,
  },

  listArea: {
    flex: 1,
    minHeight: 0,
  },
  listScroll: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: 10,
    paddingBottom: 4,
  },
  center: {
    paddingVertical: 8,
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  householdItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  householdMainPressable: {
    flex: 1,
  },
  householdInfo: {
    flex: 1,
  },
  householdNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  householdDetails: {
    fontSize: 12,
    opacity: 0.7,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  householdActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
