// File: src/types/inventory.ts — Tipos del módulo Inventory.

export const INVENTORY_UNITS = [
  "unidad",
  "g",
  "oz",
  "kg",
  "lb",
  "ml",
  "l",
  "paquete",
  "caja",
] as const;

export type InventoryUnit = (typeof INVENTORY_UNITS)[number];

export const INVENTORY_UNITS_API = [
  "unit",
  "oz",
  "g",
  "kg",
  "lb",
  "ml",
  "l",
  "pack",
  "box",
] as const;

export type InventoryUnitApi = (typeof INVENTORY_UNITS_API)[number];

export const INVENTORY_MOVEMENT_TYPES = [
  "compra",
  "consumo",
  "ajuste",
  "pérdida_por_vencimiento",
] as const;

export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const INVENTORY_MOVEMENT_TYPES_API = [
  "purchase",
  "consumption",
  "adjustment",
  "expiration_loss",
] as const;

export type InventoryMovementTypeApi =
  (typeof INVENTORY_MOVEMENT_TYPES_API)[number];

export const INVENTORY_MOVEMENT_DIRECTIONS = [
  "incremento",
  "decremento",
] as const;

export type InventoryMovementDirection =
  (typeof INVENTORY_MOVEMENT_DIRECTIONS)[number];

export const INVENTORY_MOVEMENT_DIRECTIONS_API = [
  "increase",
  "decrease",
] as const;

export type InventoryMovementDirectionApi =
  (typeof INVENTORY_MOVEMENT_DIRECTIONS_API)[number];

const INVENTORY_UNIT_UI_TO_API: Record<InventoryUnit, InventoryUnitApi> = {
  unidad: "unit",
  oz: "oz",
  g: "g",
  kg: "kg",
  lb: "lb",
  ml: "ml",
  l: "l",
  paquete: "pack",
  caja: "box",
};

const INVENTORY_UNIT_API_TO_UI: Record<InventoryUnitApi, InventoryUnit> = {
  unit: "unidad",
  oz: "oz",
  g: "g",
  kg: "kg",
  lb: "lb",
  ml: "ml",
  l: "l",
  pack: "paquete",
  box: "caja",
};

const INVENTORY_MOVEMENT_TYPE_UI_TO_API: Record<
  InventoryMovementType,
  InventoryMovementTypeApi
> = {
  compra: "purchase",
  consumo: "consumption",
  ajuste: "adjustment",
  pérdida_por_vencimiento: "expiration_loss",
};

const INVENTORY_MOVEMENT_TYPE_API_TO_UI: Record<
  InventoryMovementTypeApi,
  InventoryMovementType
> = {
  purchase: "compra",
  consumption: "consumo",
  adjustment: "ajuste",
  expiration_loss: "pérdida_por_vencimiento",
};

const INVENTORY_MOVEMENT_DIRECTION_UI_TO_API: Record<
  InventoryMovementDirection,
  InventoryMovementDirectionApi
> = {
  incremento: "increase",
  decremento: "decrease",
};

const INVENTORY_MOVEMENT_DIRECTION_API_TO_UI: Record<
  InventoryMovementDirectionApi,
  InventoryMovementDirection
> = {
  increase: "incremento",
  decrease: "decremento",
};

const INVENTORY_VALUE_LABELS: Record<string, string> = {
  compra: "Compra",
  consumo: "Consumo",
  ajuste: "Ajuste",
  pérdida_por_vencimiento: "Pérdida por vencimiento",
  incremento: "Incremento",
  decremento: "Decremento",
  unidad: "Unidad",
  paquete: "Paquete",
  caja: "Caja",
};

export function inventoryValueLabel(value: string): string {
  return (
    INVENTORY_VALUE_LABELS[value] ??
    value
      .replaceAll("_", " ")
      .replace(/\b\p{L}/gu, (char) => char.toUpperCase())
  );
}

export function toInventoryUnitApi(unit: InventoryUnit): InventoryUnitApi {
  return INVENTORY_UNIT_UI_TO_API[unit];
}

export function toInventoryUnitUi(unit: InventoryUnitApi): InventoryUnit {
  return INVENTORY_UNIT_API_TO_UI[unit];
}

export function toInventoryMovementTypeApi(
  movementType: InventoryMovementType
): InventoryMovementTypeApi {
  return INVENTORY_MOVEMENT_TYPE_UI_TO_API[movementType];
}

export function toInventoryMovementTypeUi(
  movementType: InventoryMovementTypeApi
): InventoryMovementType {
  return INVENTORY_MOVEMENT_TYPE_API_TO_UI[movementType];
}

export function toInventoryMovementDirectionApi(
  direction: InventoryMovementDirection
): InventoryMovementDirectionApi {
  return INVENTORY_MOVEMENT_DIRECTION_UI_TO_API[direction];
}

export function toInventoryMovementDirectionUi(
  direction: InventoryMovementDirectionApi
): InventoryMovementDirection {
  return INVENTORY_MOVEMENT_DIRECTION_API_TO_UI[direction];
}

export type InventoryFlagsApi = {
  lowStock: boolean;
  expired: boolean;
  expiringSoon: boolean;
};

export type InventoryStockApi = {
  quantity: number;
  reservedQuantity: number;
  lastRestockedAt: string | null;
  lastConsumedAt: string | null;
  updatedAt: string | null;
};

export type InventoryProductApi = {
  id: string;
  householdId: string;
  name: string;
  category: string | null;
  unit: InventoryUnit;
  defaultLocation: string | null;
  minThreshold: number | null;
  reorderPoint: number | null;
  notes: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stock: InventoryStockApi;
  flags: InventoryFlagsApi;
};

export type InventoryProductsListApi = {
  total: number;
  items: InventoryProductApi[];
  paging: {
    limit: number;
    offset: number;
  };
};

export type InventoryMovementApi = {
  id: string;
  householdId: string;
  productId: string;
  productName: string;
  movementType: InventoryMovementType;
  direction: InventoryMovementDirection;
  quantity: number;
  quantityDelta: number;
  unitCost: number | null;
  occurredAt: string;
  reason: string | null;
  sourceExpenseId: string | null;
  recordedByUserId: string;
  recordedByUserDisplayName: string | null;
  createdAt: string;
};

export type InventoryMovementsListApi = {
  total: number;
  items: InventoryMovementApi[];
  paging: {
    limit: number;
    offset: number;
  };
};

export type RegisterInventoryMovementResultApi = {
  movement: {
    id: string;
    productId: string;
    householdId: string;
    movementType: InventoryMovementType;
    direction: InventoryMovementDirection;
    quantity: number;
    quantityDelta: number;
    unitCost: number | null;
    occurredAt: string;
    reason: string | null;
    sourceExpenseId: string | null;
    recordedByUserId: string;
    recordedByUserDisplayName: string | null;
    createdAt: string;
  };
  stock: InventoryStockApi;
};

export type ListInventoryProductsQuery = {
  search?: string;
  category?: string;
  location?: string;
  lowStock?: boolean;
  expired?: boolean;
  expiringSoon?: boolean;
  expiringWithinDays?: number;
  includeInactive?: boolean;
  offset?: number;
  limit?: number;
  sortBy?: "name" | "updatedAt" | "quantity" | "expiresAt";
  order?: "ASC" | "DESC";
};

export type ListInventoryMovementsQuery = {
  productId?: string;
  movementType?: InventoryMovementType;
  from?: string;
  to?: string;
  offset?: number;
  limit?: number;
  order?: "ASC" | "DESC";
};

export type CreateInventoryProductDto = {
  name: string;
  category?: string;
  unit: InventoryUnit;
  defaultLocation?: string;
  minThreshold?: number;
  reorderPoint?: number;
  notes?: string;
  expiresAt?: string;
  initialQuantity?: number;
};

export type UpdateInventoryProductDto = {
  name?: string;
  category?: string;
  unit?: InventoryUnit;
  defaultLocation?: string;
  minThreshold?: number;
  reorderPoint?: number;
  notes?: string;
  isActive?: boolean;
  expiresAt?: string;
};

export type RegisterInventoryMovementDto = {
  movementType: InventoryMovementType;
  direction: InventoryMovementDirection;
  quantity: number;
  unitCost?: number;
  reason?: string;
  occurredAt?: string;
  sourceExpenseId?: string;
};

export function inventoryProductSubtitle(product: InventoryProductApi): string {
  const bits = [product.category, product.defaultLocation].filter(Boolean);
  return bits.length ? bits.join(" · ") : "Sin categoría/ubicación";
}
