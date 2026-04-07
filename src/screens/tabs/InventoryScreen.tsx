import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/api";
import { TextField } from "@/components/forms/TextField";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  useCreateInventoryProductMutation,
  useDeleteInventoryProductMutation,
  useInventoryMovementsInfiniteQuery,
  useInventoryProductsInfiniteQuery,
  useRegisterInventoryMovementMutation,
  useUpdateInventoryProductMutation,
} from "@/query/inventory";
import { InventoryMovementModal } from "@/screens/inventory/components/InventoryMovementModal";
import { InventoryMovementsActiveFilters } from "@/screens/inventory/components/InventoryMovementsActiveFilters";
import { InventoryMovementsFilterFab } from "@/screens/inventory/components/InventoryMovementsFilterFab";
import { InventoryMovementsFilterModal } from "@/screens/inventory/components/InventoryMovementsFilterModal";
import { InventoryMovementsList } from "@/screens/inventory/components/InventoryMovementsList";
import { InventoryProductCard } from "@/screens/inventory/components/InventoryProductCard";
import { InventoryProductEditModal } from "@/screens/inventory/components/InventoryProductEditModal";
import { InventoryProductFormModal } from "@/screens/inventory/components/InventoryProductFormModal";
import {
  DEFAULT_INVENTORY_MOVEMENTS_ORDER,
  hasActiveInventoryMovementsFilter,
  type InventoryMovementsFilterValue,
} from "@/screens/inventory/components/inventoryMovementsFilter.shared";
import { useAuthStore } from "@/stores/authStore";
import {
  type CreateInventoryProductDto,
  type InventoryMovementDirection,
  type InventoryMovementType,
  type InventoryProductApi,
  type UpdateInventoryProductDto,
} from "@/types/inventory";
import { a11yButton } from "@/utils/accessibility";

type InventorySegment = "products" | "movements";

const PRODUCT_SEARCH_DEBOUNCE_MS = 1000;

type MovementModalState = {
  visible: boolean;
  product: InventoryProductApi | null;
  movementType: InventoryMovementType;
  direction: InventoryMovementDirection;
};

function getDirectionForMovementType(
  movementType: InventoryMovementType,
  currentDirection: InventoryMovementDirection = "incremento"
): InventoryMovementDirection {
  if (movementType === "compra") return "incremento";
  if (
    movementType === "consumo" ||
    movementType === "pérdida_por_vencimiento"
  ) {
    return "decremento";
  }
  return currentDirection;
}

export function InventoryScreen() {
  const household = useAuthStore((s) => s.household);
  const user = useAuthStore((s) => s.user);
  const enabled = !!household?.id && !!user?.id;
  const currency = household?.currency ?? "USD";

  const { primary, onPrimary, surface, border } = useThemeColors();

  const [segment, setSegment] = useState<InventorySegment>("products");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);
  const [expiredOnly, setExpiredOnly] = useState(false);
  const [productFormVisible, setProductFormVisible] = useState(false);

  const [movementModal, setMovementModal] = useState<MovementModalState>({
    visible: false,
    product: null,
    movementType: "compra",
    direction: "incremento",
  });
  const [movementQty, setMovementQty] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementUnitCost, setMovementUnitCost] = useState("");
  const [movementsFilterVisible, setMovementsFilterVisible] = useState(false);
  const [movementsFilterProductLabel, setMovementsFilterProductLabel] =
    useState<string | undefined>(undefined);
  const [movementsFilter, setMovementsFilter] =
    useState<InventoryMovementsFilterValue>({
      order: DEFAULT_INVENTORY_MOVEMENTS_ORDER,
    });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, PRODUCT_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  const productsQuery = useInventoryProductsInfiniteQuery(
    {
      limit: 20,
      order: "DESC",
      sortBy: "updatedAt",
      search: debouncedSearch.trim() || undefined,
      lowStock: lowStockOnly || undefined,
      expiringSoon: expiringSoonOnly || undefined,
      expired: expiredOnly || undefined,
      includeInactive: false,
    },
    enabled && segment === "products"
  );

  const movementsQuery = useInventoryMovementsInfiniteQuery(
    {
      limit: 30,
      order: movementsFilter.order ?? "DESC",
      productId: movementsFilter.productId,
      movementType: movementsFilter.movementType,
      from: movementsFilter.from,
      to: movementsFilter.to,
    },
    enabled && segment === "movements"
  );

  const createProduct = useCreateInventoryProductMutation();
  const updateProduct = useUpdateInventoryProductMutation();
  const deleteProduct = useDeleteInventoryProductMutation();
  const registerMovement = useRegisterInventoryMovementMutation();

  const [editingProduct, setEditingProduct] =
    useState<InventoryProductApi | null>(null);

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [productsQuery.data]
  );

  const movementItems = useMemo(
    () => movementsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [movementsQuery.data]
  );

  const hasActiveMovementsFilter = useMemo(
    () => hasActiveInventoryMovementsFilter(movementsFilter),
    [movementsFilter]
  );

  const clearMovementsFilter = React.useCallback(() => {
    setMovementsFilter({
      order: DEFAULT_INVENTORY_MOVEMENTS_ORDER,
    });
    setMovementsFilterProductLabel(undefined);
  }, []);

  const hasActiveProductFilters = useMemo(
    () =>
      search.trim().length > 0 ||
      lowStockOnly ||
      expiringSoonOnly ||
      expiredOnly,
    [search, lowStockOnly, expiringSoonOnly, expiredOnly]
  );

  const clearProductsFilter = React.useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setLowStockOnly(false);
    setExpiringSoonOnly(false);
    setExpiredOnly(false);
  }, []);

  const summary = useMemo(() => {
    const total = products.length;
    const low = products.filter((p) => p.flags.lowStock).length;
    const expSoon = products.filter((p) => p.flags.expiringSoon).length;
    const expired = products.filter((p) => p.flags.expired).length;
    return { total, low, expSoon, expired };
  }, [products]);

  const onCreateProduct = async (dto: CreateInventoryProductDto) => {
    await createProduct.mutateAsync(dto);
  };

  const openMovementModal = (
    product: InventoryProductApi,
    preset?: {
      movementType: InventoryMovementType;
      direction: InventoryMovementDirection;
    }
  ) => {
    const movementType = preset?.movementType ?? "ajuste";
    const direction = getDirectionForMovementType(
      movementType,
      preset?.direction ?? "incremento"
    );

    setMovementModal({
      visible: true,
      product,
      movementType,
      direction,
    });
    setMovementQty("");
    setMovementReason("");
    setMovementUnitCost("");
  };

  const closeMovementModal = () => {
    setMovementModal((prev) => ({ ...prev, visible: false }));
  };

  const onEditProduct = async (
    productId: string,
    dto: UpdateInventoryProductDto
  ) => {
    await updateProduct.mutateAsync({ productId, dto });
  };

  const submitMovement = async () => {
    const product = movementModal.product;
    if (!product) return;

    const qty = Number(movementQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      Alert.alert("Cantidad inválida", "La cantidad debe ser mayor que 0.");
      return;
    }

    const unitCost = movementUnitCost.trim()
      ? Number(movementUnitCost)
      : undefined;

    if (typeof unitCost === "number" && Number.isNaN(unitCost)) {
      Alert.alert("Costo inválido", "El costo unitario debe ser numérico.");
      return;
    }

    const direction = getDirectionForMovementType(
      movementModal.movementType,
      movementModal.direction
    );

    try {
      await registerMovement.mutateAsync({
        productId: product.id,
        dto: {
          movementType: movementModal.movementType,
          direction,
          quantity: qty,
          unitCost,
          reason: movementReason.trim() || undefined,
        },
      });
      closeMovementModal();
    } catch (e) {
      Alert.alert("No se pudo registrar", getApiErrorMessage(e));
    }
  };

  const confirmDeleteProduct = (product: InventoryProductApi) => {
    Alert.alert(
      "Eliminar producto",
      `¿Seguro que deseas eliminar “${product.name}”? Esta acción borra su stock e historial.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct.mutateAsync(product.id);
            } catch (e) {
              Alert.alert("No se pudo eliminar", getApiErrorMessage(e));
            }
          },
        },
      ]
    );
  };

  if (!household) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Inventario</ThemedText>
          <ThemedText style={{ opacity: 0.8 }}>
            Para gestionar inventario primero necesitas crear un hogar.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
      >
        <ThemedView style={styles.container}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="title">Inventario</ThemedText>
              <ThemedText style={{ opacity: 0.8 }}>
                Controla stock, consumo y vencimientos del hogar.
              </ThemedText>
            </View>
          </View>

          <SegmentedControl<InventorySegment>
            value={segment}
            onChange={setSegment}
            accessibilityLabel="Secciones de inventario"
            options={[
              { value: "products", label: "Productos" },
              { value: "movements", label: "Movimientos" },
            ]}
          />

          {segment === "products" ? (
            <FlatList
              ListHeaderComponent={
                <>
                  <View
                    style={[
                      styles.summaryCard,
                      {
                        borderColor: String(border),
                        backgroundColor: String(surface),
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">
                      Resumen rápido
                    </ThemedText>
                    <View style={styles.summaryRow}>
                      <SummaryStatCard
                        label="Productos"
                        value={summary.total}
                      />
                      <SummaryStatCard
                        label="Stock bajo"
                        value={summary.low}
                        tone={summary.low > 0 ? "danger" : "neutral"}
                      />
                      <SummaryStatCard
                        label="Por vencer"
                        value={summary.expSoon}
                        tone={summary.expSoon > 0 ? "warning" : "neutral"}
                      />
                      <SummaryStatCard
                        label="Vencidos"
                        value={summary.expired}
                        tone={summary.expired > 0 ? "danger" : "neutral"}
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.card,
                      {
                        borderColor: String(border),
                        backgroundColor: String(surface),
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">Filtros</ThemedText>
                    <TextField
                      placeholder="Buscar producto por nombre"
                      value={search}
                      onChangeText={setSearch}
                    />

                    <View style={styles.filterRow}>
                      <ToggleChip
                        label="Stock bajo"
                        active={lowStockOnly}
                        onPress={() => setLowStockOnly((v) => !v)}
                      />
                      <ToggleChip
                        label="Por vencer"
                        active={expiringSoonOnly}
                        onPress={() => setExpiringSoonOnly((v) => !v)}
                      />
                      <ToggleChip
                        label="Vencidos"
                        active={expiredOnly}
                        onPress={() => setExpiredOnly((v) => !v)}
                      />
                    </View>

                    <View style={styles.filterActionsRow}>
                      <Pressable
                        {...a11yButton(
                          "Limpiar filtros",
                          "Reinicia búsqueda y filtros de productos"
                        )}
                        onPress={clearProductsFilter}
                        disabled={!hasActiveProductFilters}
                        style={({ pressed }) => [
                          styles.clearButton,
                          {
                            borderColor: String(border),
                            opacity: !hasActiveProductFilters
                              ? 0.55
                              : pressed
                                ? 0.92
                                : 1,
                          },
                        ]}
                      >
                        <ThemedText
                          type="defaultSemiBold"
                          style={{ color: String(primary) }}
                        >
                          Limpiar
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.card,
                      {
                        borderColor: String(border),
                        backgroundColor: String(surface),
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">
                      Nuevo producto
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.75 }}>
                      Agrega rápidamente un producto.
                    </ThemedText>
                    <Pressable
                      {...a11yButton("Abrir formulario de producto")}
                      onPress={() => setProductFormVisible(true)}
                      disabled={false}
                      style={[
                        styles.primaryButton,
                        {
                          backgroundColor: String(primary),
                          opacity: 1,
                        },
                      ]}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={{ color: onPrimary }}
                      >
                        + Nuevo producto
                      </ThemedText>
                    </Pressable>
                  </View>
                </>
              }
              data={products}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(28, keyboardHeight + 16) },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              removeClippedSubviews={false}
              onRefresh={() => productsQuery.refetch()}
              refreshing={productsQuery.isRefetching}
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
                    <ThemedText style={{ opacity: 0.7 }}>
                      Cargando inventario…
                    </ThemedText>
                  </View>
                ) : productsQuery.isError ? (
                  <View style={styles.centerBox}>
                    <ThemedText style={{ opacity: 0.75, textAlign: "center" }}>
                      {getApiErrorMessage(productsQuery.error)}
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.centerBox}>
                    <ThemedText type="subtitle">No hay productos</ThemedText>
                    <ThemedText style={{ opacity: 0.7 }}>
                      Crea el primero para empezar a controlar tu inventario.
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
              renderItem={({ item }) => (
                <InventoryProductCard
                  product={item}
                  onPurchase={() =>
                    openMovementModal(item, {
                      movementType: "compra",
                      direction: "incremento",
                    })
                  }
                  onConsume={() =>
                    openMovementModal(item, {
                      movementType: "consumo",
                      direction: "decremento",
                    })
                  }
                  onAdjust={() =>
                    openMovementModal(item, {
                      movementType: "ajuste",
                      direction: "incremento",
                    })
                  }
                  onEditProduct={() => setEditingProduct(item)}
                  onDelete={() => confirmDeleteProduct(item)}
                />
              )}
            />
          ) : (
            <View style={{ flex: 1, gap: 8 }}>
              <InventoryMovementsActiveFilters
                visible={hasActiveMovementsFilter}
                filter={movementsFilter}
                selectedProductName={movementsFilterProductLabel}
                onRemoveProduct={() => {
                  setMovementsFilter((prev) => ({
                    ...prev,
                    productId: undefined,
                  }));
                  setMovementsFilterProductLabel(undefined);
                }}
                onRemoveMovementType={() =>
                  setMovementsFilter((prev) => ({
                    ...prev,
                    movementType: undefined,
                  }))
                }
                onRemoveDateRange={() =>
                  setMovementsFilter((prev) => ({
                    ...prev,
                    from: undefined,
                    to: undefined,
                  }))
                }
                onRemoveOrder={() =>
                  setMovementsFilter((prev) => ({
                    ...prev,
                    order: DEFAULT_INVENTORY_MOVEMENTS_ORDER,
                  }))
                }
                onClearAll={clearMovementsFilter}
              />

              <InventoryMovementsList
                items={movementItems}
                currency={currency}
                isLoading={movementsQuery.isLoading}
                isError={movementsQuery.isError}
                error={movementsQuery.error}
                isRefetching={movementsQuery.isRefetching}
                isFetchingNextPage={movementsQuery.isFetchingNextPage}
                hasNextPage={!!movementsQuery.hasNextPage}
                bottomInset={keyboardHeight + 84}
                onRefresh={() => movementsQuery.refetch()}
                onFetchNextPage={() => movementsQuery.fetchNextPage()}
              />
            </View>
          )}

          <InventoryMovementsFilterFab
            visible={segment === "movements"}
            tint={String(primary)}
            onTintText={String(onPrimary)}
            hasActiveFilter={hasActiveMovementsFilter}
            onPress={() => setMovementsFilterVisible(true)}
          />
        </ThemedView>
      </KeyboardAvoidingView>

      <InventoryMovementsFilterModal
        visible={movementsFilterVisible}
        value={movementsFilter}
        selectedProductName={movementsFilterProductLabel}
        onApply={(next, meta) => {
          setMovementsFilter(next);
          setMovementsFilterProductLabel(meta?.selectedProductName);
        }}
        onClose={() => setMovementsFilterVisible(false)}
      />

      <InventoryMovementModal
        visible={movementModal.visible}
        productName={movementModal.product?.name}
        movementType={movementModal.movementType}
        direction={movementModal.direction}
        quantity={movementQty}
        unitCost={movementUnitCost}
        reason={movementReason}
        isSubmitting={registerMovement.isPending}
        onChangeMovementType={(v) =>
          setMovementModal((prev) => ({
            ...prev,
            movementType: v,
            direction: getDirectionForMovementType(v, prev.direction),
          }))
        }
        onChangeDirection={(v) =>
          setMovementModal((prev) => ({
            ...prev,
            direction:
              prev.movementType === "ajuste"
                ? v
                : getDirectionForMovementType(
                    prev.movementType,
                    prev.direction
                  ),
          }))
        }
        onChangeQuantity={setMovementQty}
        onChangeUnitCost={setMovementUnitCost}
        onChangeReason={setMovementReason}
        onClose={closeMovementModal}
        onSubmit={submitMovement}
      />

      <InventoryProductFormModal
        visible={productFormVisible}
        isSubmitting={createProduct.isPending}
        onClose={() => setProductFormVisible(false)}
        onSubmit={onCreateProduct}
      />

      <InventoryProductEditModal
        visible={!!editingProduct}
        product={editingProduct}
        isSubmitting={updateProduct.isPending}
        onClose={() => setEditingProduct(null)}
        onSubmit={(dto) =>
          editingProduct
            ? onEditProduct(editingProduct.id, dto)
            : Promise.resolve()
        }
      />
    </SafeAreaView>
  );
}

function SummaryStatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "danger";
}) {
  const palette =
    tone === "danger"
      ? { bg: "#fee2e2", fg: "#991b1b" }
      : tone === "warning"
        ? { bg: "#fef3c7", fg: "#92400e" }
        : { bg: "#e2e8f0", fg: "#0f172a" };

  return (
    <View style={[styles.summaryStatCard, { backgroundColor: palette.bg }]}>
      <ThemedText style={{ color: palette.fg, fontSize: 11, opacity: 0.9 }}>
        {label}
      </ThemedText>
      <ThemedText type="defaultSemiBold" style={{ color: palette.fg }}>
        {value}
      </ThemedText>
    </View>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { primary, border, text } = useThemeColors();

  return (
    <Pressable
      {...a11yButton(label)}
      onPress={onPress}
      style={[
        styles.toggleChip,
        {
          borderColor: active ? String(primary) : String(border),
          backgroundColor: active ? String(primary) + "1A" : "transparent",
        },
      ]}
    >
      <ThemedText
        type="defaultSemiBold"
        style={{ color: active ? String(primary) : String(text), fontSize: 12 }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginVertical: 7,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryStatCard: {
    minWidth: 92,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginVertical: 7,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  clearButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 28,
    gap: 10,
  },
  centerBox: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerLoading: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
