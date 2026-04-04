import {
  inventoryValueLabel,
  type InventoryMovementType,
} from "@/types/inventory";

export type InventoryMovementsFilterValue = {
  productId?: string;
  movementType?: InventoryMovementType;
  from?: string;
  to?: string;
  order?: "ASC" | "DESC";
};

export const DEFAULT_INVENTORY_MOVEMENTS_ORDER: "ASC" | "DESC" = "DESC";

export function normalizeInventoryMovementsFilter(
  value: InventoryMovementsFilterValue
): InventoryMovementsFilterValue {
  return {
    productId: value.productId,
    movementType: value.movementType,
    from: value.from,
    to: value.to,
    order: value.order ?? DEFAULT_INVENTORY_MOVEMENTS_ORDER,
  };
}

export function hasActiveInventoryMovementsFilter(
  value: InventoryMovementsFilterValue
): boolean {
  return Boolean(
    value.productId ||
    value.movementType ||
    value.from ||
    value.to ||
    (value.order && value.order !== DEFAULT_INVENTORY_MOVEMENTS_ORDER)
  );
}

export function sanitizeInventoryMovementsDateRange(
  filter: InventoryMovementsFilterValue
): InventoryMovementsFilterValue {
  if (!filter.from || !filter.to) return filter;

  const fromMs = new Date(filter.from).getTime();
  const toMs = new Date(filter.to).getTime();

  if (Number.isNaN(fromMs) || Number.isNaN(toMs) || fromMs <= toMs) {
    return filter;
  }

  return {
    ...filter,
    from: new Date(toMs).toISOString(),
    to: new Date(fromMs).toISOString(),
  };
}

export function inventoryMovementOrderLabel(order: "ASC" | "DESC"): string {
  return order === "ASC" ? "Más antiguos primero" : "Más recientes primero";
}

export function inventoryMovementTypeChipLabel(
  type: InventoryMovementType
): string {
  return inventoryValueLabel(type);
}

export function formatFilterDateRange(from?: string, to?: string): string {
  const fmt = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  return `${fmt(from)} · ${fmt(to)}`;
}
