// File: src/screens/tabs/ListsScreen.tsx — Listas de compras (Fase 2): CRUD + navegación a detalle.

import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/api";
import { TextField } from "@/components/forms/TextField";
import { ShoppingListRow } from "@/components/lists/ShoppingListRow";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useCreateListMutation,
  useDeleteListMutation,
  useListsQuery,
  useUpdateListMutation,
} from "@/query/lists";
import { HouseholdsManagerCard } from "@/screens/lists/components/HouseholdsManagerCard";
import { RenameListModal } from "@/screens/lists/components/RenameListModal";
import { useAuthStore } from "@/stores/authStore";
import { useListasStore } from "@/stores/listasStore";
import { getListScope } from "@/types/lists";
import { a11yButton } from "@/utils/accessibility";

type CreateScope = "shared" | "personal";
type ListsTabSegment = "lists" | "households";

export function ListsScreen() {
  const router = useRouter();
  const { text, primary, onPrimary } = useThemeColors();

  const { width } = useWindowDimensions();
  const isCompact = width < 420;

  const household = useAuthStore((s) => s.household);

  const [segment, setSegment] = useState<ListsTabSegment>("lists");

  const setActiveListId = useListasStore((s) => s.setActiveListId);

  const listsQuery = useListsQuery(!!household && segment === "lists");
  const createList = useCreateListMutation();
  const deleteList = useDeleteListMutation();
  const updateList = useUpdateListMutation();

  const [createName, setCreateName] = useState("");
  const [createScope, setCreateScope] = useState<CreateScope>("shared");

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameListId, setRenameListId] = useState<string | null>(null);

  const onPress = useCallback(
    (id: string) => {
      setActiveListId(id);
      router.push(`/lists/${id}` as any);
    },
    [router, setActiveListId]
  );

  const onLongPress = useCallback(
    (id: string) => {
      const list = (listsQuery.data ?? []).find((l) => l.id === id);
      if (!list) return;

      Alert.alert(list.name, "Acciones", [
        {
          text: "Renombrar",
          onPress: () => {
            setRenameListId(id);
            setRenameValue(list.name);
            setRenameVisible(true);
          },
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteList.mutateAsync(id);
            } catch (e) {
              Alert.alert("No se pudo eliminar", getApiErrorMessage(e));
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]);
    },
    [deleteList, listsQuery.data]
  );

  const data = useMemo(() => {
    return (listsQuery.data ?? []).map((l) => {
      const scope = getListScope(l);
      return {
        id: l.id,
        name: l.name,
        scopeLabel: scope === "shared" ? "Compartida" : "Personal",
        pendingCount: null as number | null,
      };
    });
  }, [listsQuery.data]);

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof data)[number] }) => (
      <ShoppingListRow
        item={item}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    ),
    [onLongPress, onPress]
  );

  const onCreate = useCallback(async () => {
    const name = createName.trim();
    if (name.length < 2) {
      Alert.alert("Nombre inválido", "Debe tener al menos 2 caracteres.");
      return;
    }

    try {
      await createList.mutateAsync({ name, scope: createScope });
      setCreateName("");
    } catch (e) {
      Alert.alert("No se pudo crear", getApiErrorMessage(e));
    }
  }, [createList, createName, createScope]);

  const handleCloseRename = useCallback(() => {
    setRenameVisible(false);
    setRenameListId(null);
    setRenameValue("");
  }, []);

  const onConfirmRename = useCallback(async () => {
    if (!renameListId) return;

    const name = renameValue.trim();
    if (name.length < 2) {
      Alert.alert("Nombre inválido", "Debe tener al menos 2 caracteres.");
      return;
    }

    try {
      await updateList.mutateAsync({ listId: renameListId, dto: { name } });
      handleCloseRename();
    } catch (e) {
      Alert.alert("No se pudo renombrar", getApiErrorMessage(e));
    }
  }, [handleCloseRename, renameListId, renameValue, updateList]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" accessibilityRole="header">
          Listas
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Crea y comparte listas de compras.
        </ThemedText>

        <SegmentedControl<ListsTabSegment>
          accessibilityLabel="Secciones de la pestaña Listas"
          value={segment}
          onChange={setSegment}
          options={[
            { value: "lists", label: "Listas" },
            { value: "households", label: "Hogares" },
          ]}
        />

        {segment === "households" ? (
          <View style={{ flex: 1, minHeight: 0 }}>
            <HouseholdsManagerCard style={{ flex: 1, minHeight: 0 }} />
          </View>
        ) : (
          <>
            {household ? (
              <View style={[styles.card, { borderColor: String(text) + "22" }]}>
                <ThemedText type="defaultSemiBold">Nueva lista</ThemedText>

                <View style={styles.createRowGrid}>
                  <View
                    style={StyleSheet.flatten([
                      styles.createNameGrid,
                      isCompact ? styles.gridFull : styles.gridName,
                    ])}
                  >
                    <TextField
                      placeholder="Nombre (ej: Supermercado)"
                      value={createName}
                      onChangeText={setCreateName}
                      autoCapitalize="sentences"
                    />
                  </View>

                  <Pressable
                    {...a11yButton(
                      createScope === "shared"
                        ? "Lista compartida"
                        : "Lista personal",
                      "Cambia el tipo de lista"
                    )}
                    onPress={() =>
                      setCreateScope((s) =>
                        s === "shared" ? "personal" : "shared"
                      )
                    }
                    style={StyleSheet.flatten([
                      styles.chip,
                      isCompact ? styles.gridFull : styles.gridChip,
                      {
                        borderColor: String(text) + "22",
                        backgroundColor: String(text) + "0D",
                      },
                    ])}
                  >
                    <ThemedText style={{ opacity: 0.85 }}>
                      {createScope === "shared" ? "Compartida" : "Personal"}
                    </ThemedText>
                  </Pressable>
                </View>

                <Pressable
                  {...a11yButton(
                    "Crear lista",
                    "Crea la lista y la muestra en pantalla"
                  )}
                  onPress={onCreate}
                  disabled={createList.isPending}
                  style={StyleSheet.flatten([
                    styles.primaryButton,
                    {
                      backgroundColor: String(primary),
                      opacity: createList.isPending ? 0.7 : 1,
                    },
                  ])}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.primaryButtonText, { color: onPrimary }]}
                  >
                    {createList.isPending ? "Creando…" : "+ Crear"}
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}

            <View
              style={[
                styles.listContainer,
                { borderColor: String(text) + "22" },
              ]}
            >
              {!household ? (
                <View style={styles.center}>
                  <ThemedText style={{ opacity: 0.8 }}>
                    Crea o selecciona un hogar para ver tus listas.
                  </ThemedText>
                </View>
              ) : listsQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                </View>
              ) : listsQuery.isError ? (
                <View style={styles.center}>
                  <ThemedText style={{ opacity: 0.8 }}>
                    {getApiErrorMessage(listsQuery.error)}
                  </ThemedText>
                </View>
              ) : (
                <FlatList
                  data={data}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContent}
                  initialNumToRender={10}
                  windowSize={7}
                  removeClippedSubviews
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <View style={styles.center}>
                      <ThemedText style={{ opacity: 0.75 }}>
                        Aún no tienes listas.
                      </ThemedText>
                      <ThemedText style={{ opacity: 0.6, fontSize: 13 }}>
                        Crea una arriba para empezar.
                      </ThemedText>
                    </View>
                  }
                />
              )}
            </View>
          </>
        )}
      </ThemedView>

      <RenameListModal
        visible={renameVisible}
        value={renameValue}
        onChange={setRenameValue}
        onClose={handleCloseRename}
        onSave={onConfirmRename}
        text={String(onPrimary)}
        isSaving={updateList.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  subtitle: { opacity: 0.8 },
  card: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  householdRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  secondaryButtonSmall: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  createRowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  createNameGrid: {
    minWidth: "100%",
  },
  gridName: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    marginRight: 10,
    marginBottom: 10,
  },
  gridChip: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 140,
    marginBottom: 10,
  },
  gridFull: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "100%",
    width: "100%",
    marginRight: 0,
    marginBottom: 10,
  },
  flex: { flex: 1 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButtonText: { color: "white" },
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
  listContainer: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: "hidden",
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  center: {
    padding: 16,
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
