import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useInventoryProductsInfiniteQuery } from "@/query/inventory";
import { useAuthStore } from "@/stores/authStore";
import { a11yButton } from "@/utils/accessibility";

type ProductOption = {
  id: string;
  name: string;
};

const SEARCH_DEBOUNCE_MS = 1000;

export const InventoryMovementsProductPickerField = React.memo(
  function InventoryMovementsProductPickerField({
    value,
    selectedLabel,
    onSelect,
  }: {
    value?: string;
    selectedLabel?: string;
    onSelect: (
      nextProductId: string | undefined,
      nextProductName?: string
    ) => void;
  }) {
    const { border, surface, primary, text } = useThemeColors();
    const household = useAuthStore((s) => s.household);
    const user = useAuthStore((s) => s.user);
    const enabled = !!household?.id && !!user?.id;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    React.useEffect(() => {
      const timeout = setTimeout(() => {
        setDebouncedSearch(search);
      }, SEARCH_DEBOUNCE_MS);

      return () => clearTimeout(timeout);
    }, [search]);

    const productsQuery = useInventoryProductsInfiniteQuery(
      {
        limit: 20,
        order: "ASC",
        sortBy: "name",
        includeInactive: false,
        search: debouncedSearch.trim() || undefined,
      },
      enabled && open
    );

    const productItems = useMemo<ProductOption[]>(
      () =>
        productsQuery.data?.pages.flatMap((page) =>
          page.items.map((item) => ({ id: item.id, name: item.name }))
        ) ?? [],
      [productsQuery.data]
    );

    const selectedInLoaded = useMemo(
      () => productItems.find((item) => item.id === value),
      [productItems, value]
    );

    const selectedText = value
      ? (selectedInLoaded?.name ?? selectedLabel ?? "Producto seleccionado")
      : "Todos los productos";

    React.useEffect(() => {
      if (open) return;
      setSearch("");
      setDebouncedSearch("");
    }, [open]);

    return (
      <>
        <Pressable
          {...a11yButton("Seleccionar producto")}
          onPress={() => setOpen(true)}
          style={[
            styles.field,
            {
              borderColor: String(border),
              backgroundColor: String(surface),
            },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText style={styles.fieldLabel}>Producto</ThemedText>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {selectedText}
            </ThemedText>
          </View>
        </Pressable>

        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView
              style={[
                styles.modalCard,
                {
                  borderColor: String(border),
                },
              ]}
            >
              <ThemedText type="subtitle">Seleccionar producto</ThemedText>

              <TextField
                placeholder="Buscar producto por nombre"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />

              <Pressable
                {...a11yButton("Todos los productos")}
                onPress={() => {
                  onSelect(undefined, undefined);
                  setOpen(false);
                }}
                style={[
                  styles.optionRow,
                  {
                    borderColor: String(border),
                    backgroundColor: !value
                      ? `${String(primary)}22`
                      : "transparent",
                  },
                ]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{ color: !value ? String(primary) : String(text) }}
                >
                  Todos los productos
                </ThemedText>
              </Pressable>

              <FlatList
                data={productItems}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                onEndReached={() => {
                  if (
                    productsQuery.hasNextPage &&
                    !productsQuery.isFetchingNextPage
                  ) {
                    productsQuery.fetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.4}
                ListEmptyComponent={
                  productsQuery.isLoading ? (
                    <View style={styles.centerBox}>
                      <ActivityIndicator color={String(primary)} />
                      <ThemedText style={{ opacity: 0.75 }}>
                        Cargando productos…
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.centerBox}>
                      <ThemedText style={{ opacity: 0.75 }}>
                        No encontramos productos
                      </ThemedText>
                    </View>
                  )
                }
                ListFooterComponent={
                  productsQuery.isFetchingNextPage ? (
                    <View style={styles.footerLoading}>
                      <ActivityIndicator color={String(primary)} />
                    </View>
                  ) : null
                }
                renderItem={({ item }) => {
                  const selected = item.id === value;

                  return (
                    <Pressable
                      {...a11yButton(`Seleccionar ${item.name}`)}
                      onPress={() => {
                        onSelect(item.id, item.name);
                        setOpen(false);
                      }}
                      style={[
                        styles.optionRow,
                        {
                          borderColor: String(border),
                          backgroundColor: selected
                            ? `${String(primary)}22`
                            : "transparent",
                        },
                      ]}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={{
                          color: selected ? String(primary) : String(text),
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </ThemedText>
                    </Pressable>
                  );
                }}
              />

              <Pressable
                {...a11yButton("Cerrar selector de productos")}
                onPress={() => setOpen(false)}
                style={[
                  styles.closeButton,
                  {
                    borderColor: String(border),
                  },
                ]}
              >
                <ThemedText type="defaultSemiBold">Cerrar</ThemedText>
              </Pressable>
            </ThemedView>
          </View>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  field: {
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    gap: 2,
  },
  fieldLabel: {
    opacity: 0.68,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  list: {
    flexGrow: 0,
    minHeight: 120,
    maxHeight: 320,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  optionRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: "center",
  },
  centerBox: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerLoading: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
