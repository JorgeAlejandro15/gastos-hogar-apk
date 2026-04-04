// File: src/api/inventory-api.ts — Cliente REST para inventario (backend NestJS /inventory).

import { api } from "@/api/api";
import type {
  CreateInventoryProductDto,
  InventoryMovementApi,
  InventoryMovementDirectionApi,
  InventoryMovementTypeApi,
  InventoryMovementsListApi,
  InventoryProductApi,
  InventoryProductsListApi,
  InventoryUnitApi,
  ListInventoryMovementsQuery,
  ListInventoryProductsQuery,
  RegisterInventoryMovementDto,
  RegisterInventoryMovementResultApi,
  UpdateInventoryProductDto,
} from "@/types/inventory";
import {
  toInventoryMovementDirectionApi,
  toInventoryMovementDirectionUi,
  toInventoryMovementTypeApi,
  toInventoryMovementTypeUi,
  toInventoryUnitApi,
  toInventoryUnitUi,
} from "@/types/inventory";

type InventoryProductApiServer = Omit<InventoryProductApi, "unit"> & {
  unit: InventoryUnitApi;
};

type InventoryProductsListApiServer = Omit<
  InventoryProductsListApi,
  "items"
> & {
  items: InventoryProductApiServer[];
};

type InventoryMovementApiServer = Omit<
  InventoryMovementApi,
  "movementType" | "direction"
> & {
  movementType: InventoryMovementTypeApi;
  direction: InventoryMovementDirectionApi;
};

type InventoryMovementsListApiServer = Omit<
  InventoryMovementsListApi,
  "items"
> & {
  items: InventoryMovementApiServer[];
};

type RegisterInventoryMovementResultApiServer = Omit<
  RegisterInventoryMovementResultApi,
  "movement"
> & {
  movement: Omit<
    RegisterInventoryMovementResultApi["movement"],
    "movementType" | "direction"
  > & {
    movementType: InventoryMovementTypeApi;
    direction: InventoryMovementDirectionApi;
  };
};

function mapProductFromServer(
  product: InventoryProductApiServer
): InventoryProductApi {
  return {
    ...product,
    unit: toInventoryUnitUi(product.unit),
  };
}

function mapMovementFromServer(
  movement: InventoryMovementApiServer
): InventoryMovementApi {
  return {
    ...movement,
    movementType: toInventoryMovementTypeUi(movement.movementType),
    direction: toInventoryMovementDirectionUi(movement.direction),
  };
}

export const inventoryApi = {
  async listProducts(
    q?: ListInventoryProductsQuery
  ): Promise<InventoryProductsListApi> {
    const { data } = await api.get<InventoryProductsListApiServer>(
      "/inventory/products",
      {
        params: q,
      }
    );
    return {
      ...data,
      items: data.items.map(mapProductFromServer),
    };
  },

  async getProduct(productId: string): Promise<InventoryProductApi> {
    const { data } = await api.get<InventoryProductApiServer>(
      `/inventory/products/${productId}`
    );
    return mapProductFromServer(data);
  },

  async createProduct(
    dto: CreateInventoryProductDto
  ): Promise<InventoryProductApi> {
    const payload: Omit<CreateInventoryProductDto, "unit"> & {
      unit: InventoryUnitApi;
    } = {
      ...dto,
      unit: toInventoryUnitApi(dto.unit),
    };

    const { data } = await api.post<InventoryProductApiServer>(
      "/inventory/products",
      payload
    );
    return mapProductFromServer(data);
  },

  async updateProduct(
    productId: string,
    dto: UpdateInventoryProductDto
  ): Promise<InventoryProductApi> {
    const payload = dto.unit
      ? {
          ...dto,
          unit: toInventoryUnitApi(dto.unit),
        }
      : dto;

    const { data } = await api.patch<InventoryProductApiServer>(
      `/inventory/products/${productId}`,
      payload
    );
    return mapProductFromServer(data);
  },

  async deleteProduct(
    productId: string
  ): Promise<{ ok: true } | { ok: boolean }> {
    const { data } = await api.delete<{ ok: true } | { ok: boolean }>(
      `/inventory/products/${productId}`
    );
    return data;
  },

  async registerMovement(
    productId: string,
    dto: RegisterInventoryMovementDto
  ): Promise<RegisterInventoryMovementResultApi> {
    const payload: Omit<
      RegisterInventoryMovementDto,
      "movementType" | "direction"
    > & {
      movementType: InventoryMovementTypeApi;
      direction: InventoryMovementDirectionApi;
    } = {
      ...dto,
      movementType: toInventoryMovementTypeApi(dto.movementType),
      direction: toInventoryMovementDirectionApi(dto.direction),
    };

    const { data } = await api.post<RegisterInventoryMovementResultApiServer>(
      `/inventory/products/${productId}/movements`,
      payload
    );
    return {
      ...data,
      movement: {
        ...data.movement,
        movementType: toInventoryMovementTypeUi(data.movement.movementType),
        direction: toInventoryMovementDirectionUi(data.movement.direction),
      },
    };
  },

  async listMovements(
    q?: ListInventoryMovementsQuery
  ): Promise<InventoryMovementsListApi> {
    const params = q?.movementType
      ? {
          ...q,
          movementType: toInventoryMovementTypeApi(q.movementType),
        }
      : q;

    const { data } = await api.get<InventoryMovementsListApiServer>(
      "/inventory/movements",
      {
        params,
      }
    );
    return {
      ...data,
      items: data.items.map(mapMovementFromServer),
    };
  },
};
