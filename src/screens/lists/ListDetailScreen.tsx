// File: src/screens/lists/ListDetailScreen.tsx — Detalle de lista: CRUD items + marcar comprado con deshacer.

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/api";
import { UndoBanner } from "@/components/feedback/UndoBanner";
import { ShoppingItemRow } from "@/components/lists/ShoppingItemRow";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useAddItemMutation,
  useDeleteItemMutation,
  useDeleteListMutation,
  useListDetailQuery,
  useListHistoryInfiniteQuery,
  useListHistoryMetaQuery,
  useListPendingInfiniteQuery,
  useSetPurchasedMutation,
  useUpdateItemMutation,
  useUpdateListMutation,
} from "@/query/lists";
import { AddItemCard } from "@/screens/lists/components/AddItemCard";
import { EditItemModal } from "@/screens/lists/components/EditItemModal";
import { HistoryDateFilterModal } from "@/screens/lists/components/HistoryDateFilterModal";
import { HistoryFilterFab } from "@/screens/lists/components/HistoryFilterFab";
import { HistorySummaryBanner } from "@/screens/lists/components/HistorySummaryBanner";
import { ListHeader } from "@/screens/lists/components/ListHeader";
import { ListShareModal } from "@/screens/lists/components/ListShareModal";
import { RenameListModal } from "@/screens/lists/components/RenameListModal";
import {
  ViewSegment,
  type ViewMode,
} from "@/screens/lists/components/ViewSegment";
import { useUndoTimer } from "@/screens/lists/hooks/useUndoTimer";
import type { IsoRange } from "@/screens/lists/utils/dateRange";
import { isEmptyRange } from "@/screens/lists/utils/dateRange";
import { useAuthStore } from "@/stores/authStore";
import {
  getListScope,
  itemTotal,
  type ShoppingItemApi,
  type UpdateItemDto,
} from "@/types/lists";
import { readableTextOnHex } from "@/utils/color";
import { formatCurrency } from "@/utils/format";
import { parseDecimalInput } from "@/utils/number";

type EditItemState = {
  visible: boolean;
  itemId: string | null;
  name: string;
  amount: string;
  price: string;
  category: string;
};

type UndoState = {
  itemId: string;
  name: string;
  delta: number;
};

const keyExtractor = (item: ShoppingItemApi) => item.id;

export function ListDetailScreen() {
  const params = useLocalSearchParams<{ listId?: string }>();
  const router = useRouter();

  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const isNarrow = width < 360;

  const listId = typeof params.listId === "string" ? params.listId : "";

  const { text, tint, primary, onPrimary } = useThemeColors();

  const tintStr = String(tint);
  const onTintText = useMemo(() => readableTextOnHex(tintStr), [tintStr]);

  const currency = useAuthStore((s) => s.household?.currency ?? "USD");

  const detailQuery = useListDetailQuery(listId);
  const [view, setView] = useState<ViewMode>("pending");

  const pendingQuery = useListPendingInfiniteQuery(listId, true);

  // Mantener history siempre activo para que historyCount se actualice sin
  // necesidad de entrar al tab Historial.
  const historyMetaQuery = useListHistoryMetaQuery(listId, true);
  const [historyFilter, setHistoryFilter] = useState<IsoRange>({});
  const [historyFilterVisible, setHistoryFilterVisible] = useState(false);
  const hasActiveHistoryFilter = !isEmptyRange(historyFilter);

  const historyAllQuery = useListHistoryInfiniteQuery(
    listId,
    view === "history"
  );
  const historyFilteredQuery = useListHistoryInfiniteQuery(
    listId,
    view === "history" && hasActiveHistoryFilter,
    historyFilter
  );

  const activeHistoryQuery =
    view === "history" && hasActiveHistoryFilter
      ? historyFilteredQuery
      : historyAllQuery;

  const addItem = useAddItemMutation(listId);
  const updateItem = useUpdateItemMutation(listId);
  const deleteItem = useDeleteItemMutation(listId);
  const setPurchased = useSetPurchasedMutation(listId);

  const updateList = useUpdateListMutation();
  const deleteList = useDeleteListMutation();

  const items = useMemo(() => {
    return pendingQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [pendingQuery.data]);

  const historyItems = useMemo(() => {
    // Only switch to filtered results while the user is actually in History.
    // Otherwise the filtered query may be disabled and we'd show an empty list.
    const data =
      view === "history" && hasActiveHistoryFilter
        ? historyFilteredQuery.data
        : historyAllQuery.data;
    return data?.pages.flatMap((p) => p.items) ?? [];
  }, [
    view,
    hasActiveHistoryFilter,
    historyAllQuery.data,
    historyFilteredQuery.data,
  ]);

  const historyCount = useMemo(() => {
    // Requirement: when filtering in History, show the filtered total.
    if (view === "history" && hasActiveHistoryFilter) {
      return historyFilteredQuery.data?.pages?.[0]?.total ?? 0;
    }
    return historyMetaQuery.data?.total ?? 0;
  }, [
    view,
    hasActiveHistoryFilter,
    historyMetaQuery.data,
    historyFilteredQuery.data,
  ]);

  const historyTotalAmount = useMemo(() => {
    const data =
      view === "history" && hasActiveHistoryFilter
        ? historyFilteredQuery.data
        : historyAllQuery.data;
    return data?.pages?.[0]?.totalAmount ?? 0;
  }, [
    view,
    hasActiveHistoryFilter,
    historyAllQuery.data,
    historyFilteredQuery.data,
  ]);

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("1");
  const [newPrice, setNewPrice] = useState("0");
  const [newCategory, setNewCategory] = useState("");

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [shareVisible, setShareVisible] = useState(false);

  const [editItem, setEditItem] = useState<EditItemState>({
    visible: false,
    itemId: null,
    name: "",
    amount: "",
    price: "",
    category: "",
  });

  const {
    value: undo,
    setValue: setUndo,
    show: showUndo,
  } = useUndoTimer<UndoState>(4500);

  const totalPending = useMemo(() => {
    return pendingQuery.data?.pages?.[0]?.totalAmount ?? 0;
  }, [pendingQuery.data]);

  const pendingCount = useMemo(() => {
    return pendingQuery.data?.pages?.[0]?.total ?? 0;
  }, [pendingQuery.data]);

  const onBack = useCallback(() => router.back(), [router]);

  const onOpenMenu = useCallback(() => {
    Alert.alert("Lista", "Acciones", [
      {
        text: "Renombrar",
        onPress: () => {
          setRenameValue(detailQuery.data?.name ?? "");
          setRenameVisible(true);
        },
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Eliminar lista",
            "Se eliminarán también sus items. ¿Continuar?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deleteList.mutateAsync(listId);
                    router.back();
                  } catch (e) {
                    Alert.alert("No se pudo eliminar", getApiErrorMessage(e));
                  }
                },
              },
            ]
          );
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, [deleteList, detailQuery.data?.name, listId, router]);

  const onOpenShare = useCallback(() => {
    setShareVisible(true);
  }, []);

  const onConfirmRename = useCallback(async () => {
    const name = renameValue.trim();
    if (name.length < 2) {
      Alert.alert("Nombre inválido", "Debe tener al menos 2 caracteres.");
      return;
    }

    try {
      await updateList.mutateAsync({ listId, dto: { name } });
      setRenameVisible(false);
    } catch (e) {
      Alert.alert("No se pudo renombrar", getApiErrorMessage(e));
    }
  }, [listId, renameValue, updateList]);

  const onAdd = useCallback(async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert("Falta nombre", "Escribe el nombre del producto.");
      return;
    }

    const amount = parseDecimalInput(newAmount);
    const price = parseDecimalInput(newPrice);

    if (amount == null || amount < 0) {
      Alert.alert("Cantidad inválida", "La cantidad debe ser un número >= 0.");
      return;
    }
    if (price == null || price < 0) {
      Alert.alert("Precio inválido", "El precio debe ser un número >= 0.");
      return;
    }

    try {
      await addItem.mutateAsync({
        name,
        amount,
        price,
        category: newCategory.trim() || undefined,
      });
      setNewName("");
      setNewCategory("");
      setNewPrice("0");
      setNewAmount("1");
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert("No se pudo agregar", getApiErrorMessage(e));
    }
  }, [addItem, newAmount, newCategory, newName, newPrice]);

  const onTogglePurchased = useCallback(
    async (itemId: string) => {
      const current = items.find((i) => i.id === itemId);
      if (!current) return;

      if (current.price < 1) {
        Alert.alert(
          "Precio inválido",
          "Para marcar como comprado, el precio debe ser mayor o igual a 1."
        );
        return;
      }

      const delta = itemTotal(current);
      try {
        await setPurchased.mutateAsync({ itemId, purchased: true });
        showUndo({ itemId, name: current.name, delta });
      } catch (e) {
        Alert.alert("No se pudo marcar", getApiErrorMessage(e));
      }
    },
    [items, setPurchased, showUndo]
  );

  const onEndReachedPending = useCallback(() => {
    if (pendingQuery.hasNextPage && !pendingQuery.isFetchingNextPage) {
      pendingQuery.fetchNextPage();
    }
  }, [pendingQuery]);

  const onRestorePurchased = useCallback(
    async (itemId: string) => {
      const current = historyItems.find((i) => i.id === itemId);
      if (!current) return;

      try {
        await setPurchased.mutateAsync({ itemId, purchased: false });

        // UX: volver a pendientes para seguir trabajando.
        setView("pending");
      } catch (e) {
        Alert.alert("No se pudo restaurar", getApiErrorMessage(e));
      }
    },
    [historyItems, setPurchased]
  );

  const onEndReachedHistory = useCallback(() => {
    if (
      activeHistoryQuery.hasNextPage &&
      !activeHistoryQuery.isFetchingNextPage
    ) {
      activeHistoryQuery.fetchNextPage();
    }
  }, [activeHistoryQuery]);

  const onUndo = useCallback(async () => {
    if (!undo) return;
    try {
      await setPurchased.mutateAsync({ itemId: undo.itemId, purchased: false });
      setUndo(null);
    } catch (e) {
      Alert.alert("No se pudo deshacer", getApiErrorMessage(e));
    }
  }, [setPurchased, setUndo, undo]);

  const onLongPressItem = useCallback(
    (itemId: string) => {
      const current = items.find((i) => i.id === itemId);
      if (!current) return;

      Alert.alert(current.name, "Acciones", [
        {
          text: "Editar",
          onPress: () =>
            setEditItem({
              visible: true,
              itemId: current.id,
              name: current.name,
              amount: String(current.amount),
              price: String(current.price),
              category: current.category ?? "",
            }),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItem.mutateAsync(current.id);
            } catch (e) {
              Alert.alert("No se pudo eliminar", getApiErrorMessage(e));
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]);
    },
    [deleteItem, items]
  );

  const onLongPressHistoryItem = useCallback(
    (itemId: string) => {
      const current = historyItems.find((i) => i.id === itemId);
      if (!current) return;

      Alert.alert(current.name, "Historial", [
        {
          text: "Restaurar (volver a pendientes)",
          onPress: () => onRestorePurchased(itemId),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItem.mutateAsync(current.id);
            } catch (e) {
              Alert.alert("No se pudo eliminar", getApiErrorMessage(e));
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]);
    },
    [deleteItem, historyItems, onRestorePurchased]
  );

  const onConfirmEditItem = useCallback(async () => {
    if (!editItem.itemId) return;
    const name = editItem.name.trim();
    if (!name) {
      Alert.alert("Nombre inválido", "Escribe un nombre.");
      return;
    }

    const amount = parseDecimalInput(editItem.amount);
    const price = parseDecimalInput(editItem.price);

    if (amount == null || amount < 0) {
      Alert.alert("Cantidad inválida", "La cantidad debe ser un número >= 0.");
      return;
    }
    if (price == null || price < 0) {
      Alert.alert("Precio inválido", "El precio debe ser un número >= 0.");
      return;
    }

    const dto: UpdateItemDto = {
      name,
      amount,
      price,
      category: editItem.category.trim() || undefined,
    };

    try {
      await updateItem.mutateAsync({ itemId: editItem.itemId, dto });
      setEditItem((s) => ({ ...s, visible: false }));
    } catch (e) {
      Alert.alert("No se pudo editar", getApiErrorMessage(e));
    }
  }, [editItem, updateItem]);

  const renderItem = useCallback(
    ({ item }: { item: ShoppingItemApi }) => (
      <ShoppingItemRow
        item={item}
        currency={currency}
        onTogglePurchased={onTogglePurchased}
        onLongPress={onLongPressItem}
      />
    ),
    [currency, onLongPressItem, onTogglePurchased]
  );

  const renderHistoryItem = useCallback(
    ({ item }: { item: ShoppingItemApi }) => (
      <ShoppingItemRow
        item={item}
        currency={currency}
        onTogglePurchased={onRestorePurchased}
        onLongPress={onLongPressHistoryItem}
      />
    ),
    [currency, onLongPressHistoryItem, onRestorePurchased]
  );

  if (!listId) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Lista</ThemedText>
          <ThemedText style={{ opacity: 0.8 }}>Falta la lista.</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <ListHeader
          title={detailQuery.data?.name ?? "Lista"}
          subtitleTotal={totalPending}
          currency={currency}
          tint={String(tint)}
          text={String(text)}
          onBack={onBack}
          onOpenMenu={onOpenMenu}
          onShare={onOpenShare}
        />

        <ViewSegment
          view={view}
          pendingCount={pendingCount}
          historyCount={historyCount}
          tint={String(tint)}
          text={String(text)}
          onTintText={onTintText}
          onChange={setView}
        />

        {view === "pending" ? (
          <AddItemCard
            text={String(onPrimary)}
            tint={String(primary)}
            isCompact={isCompact}
            name={newName}
            amount={newAmount}
            price={newPrice}
            category={newCategory}
            setName={setNewName}
            setAmount={setNewAmount}
            setPrice={setNewPrice}
            setCategory={setNewCategory}
            isSaving={addItem.isPending}
            onAdd={onAdd}
          />
        ) : null}

        <View
          style={[styles.listContainer, { borderColor: String(text) + "22" }]}
        >
          {view === "pending" ? (
            pendingQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            ) : pendingQuery.isError ? (
              <View style={styles.center}>
                <ThemedText style={{ opacity: 0.8 }}>
                  {getApiErrorMessage(pendingQuery.error)}
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                windowSize={7}
                removeClippedSubviews
                keyboardShouldPersistTaps="handled"
                onEndReached={onEndReachedPending}
                onEndReachedThreshold={0.25}
                ListFooterComponent={
                  pendingQuery.isFetchingNextPage ? (
                    <View style={styles.historyFooter}>
                      <ActivityIndicator />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.center}>
                    <ThemedText style={{ opacity: 0.75 }}>
                      No hay productos pendientes.
                    </ThemedText>
                  </View>
                }
              />
            )
          ) : activeHistoryQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : activeHistoryQuery.isError ? (
            <View style={styles.center}>
              <ThemedText style={{ opacity: 0.8 }}>
                {getApiErrorMessage(activeHistoryQuery.error)}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={historyItems}
              keyExtractor={keyExtractor}
              renderItem={renderHistoryItem}
              contentContainerStyle={styles.listContent}
              initialNumToRender={10}
              windowSize={7}
              removeClippedSubviews
              keyboardShouldPersistTaps="handled"
              onEndReached={onEndReachedHistory}
              onEndReachedThreshold={0.25}
              ListHeaderComponent={
                <View style={styles.historyHeader}>
                  <HistorySummaryBanner
                    totalAmount={historyTotalAmount}
                    currency={currency}
                    tint={tintStr}
                    onTintText={onTintText}
                  />
                </View>
              }
              ListFooterComponent={
                activeHistoryQuery.isFetchingNextPage ? (
                  <View style={styles.historyFooter}>
                    <ActivityIndicator />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.center}>
                  <ThemedText style={{ opacity: 0.75 }}>
                    Historial vacío.
                  </ThemedText>
                </View>
              }
            />
          )}
        </View>

        <UndoBanner
          visible={!!undo}
          message={
            undo
              ? `Comprado: ${undo.name} (+${formatCurrency(
                  undo.delta,
                  currency
                )})`
              : ""
          }
          onAction={onUndo}
          onDismiss={() => setUndo(null)}
        />

        <HistoryFilterFab
          visible={view === "history"}
          tint={String(tint)}
          onTintText={onTintText}
          hasActiveFilter={hasActiveHistoryFilter}
          onPress={() => setHistoryFilterVisible(true)}
        />
      </ThemedView>

      <RenameListModal
        visible={renameVisible}
        value={renameValue}
        onChange={setRenameValue}
        onClose={() => setRenameVisible(false)}
        onSave={onConfirmRename}
        text={String(text)}
        isCompact={isCompact}
        isSaving={updateList.isPending}
      />

      <EditItemModal
        visible={editItem.visible}
        isCompact={isCompact}
        isNarrow={isNarrow}
        text={String(onPrimary)}
        tint={String(primary)}
        name={editItem.name}
        amount={editItem.amount}
        price={editItem.price}
        category={editItem.category}
        onChangeName={(v) => setEditItem((s) => ({ ...s, name: v }))}
        onChangeAmount={(v) => setEditItem((s) => ({ ...s, amount: v }))}
        onChangePrice={(v) => setEditItem((s) => ({ ...s, price: v }))}
        onChangeCategory={(v) => setEditItem((s) => ({ ...s, category: v }))}
        onCancel={() => setEditItem((s) => ({ ...s, visible: false }))}
        onSave={onConfirmEditItem}
      />

      <HistoryDateFilterModal
        visible={historyFilterVisible}
        onClose={() => setHistoryFilterVisible(false)}
        value={historyFilter}
        onChange={setHistoryFilter}
        text={String(text)}
        tint={String(primary)}
        isCompact={isCompact}
      />

      <ListShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        listName={detailQuery.data?.name ?? "Lista"}
        listScope={
          detailQuery.data ? getListScope(detailQuery.data) : "unknown"
        }
        text={String(text)}
        tint={String(primary)}
        isCompact={isCompact}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
    gap: 10,
    position: "relative",
  },
  listContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: "hidden",
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  historyHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  historyFooter: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    padding: 16,
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
