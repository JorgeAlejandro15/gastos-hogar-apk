import { type ShoppingItemType } from "@/types/lists";

type SmartValidationInput = {
  name: string;
  category?: string | null;
  itemType: ShoppingItemType;
};

export type ItemTypeSmartWarning = {
  suggestedType: ShoppingItemType;
  title: string;
  message: string;
};

const SERVICE_HINTS = [
  "luz",
  "agua",
  "gas",
  "internet",
  "telefono",
  "telefonia",
  "transporte",
  "taxi",
  "uber",
  "servicio",
  "suscripcion",
  "membresia",
  "alquiler",
  "renta",
  "seguro",
  "colegiatura",
];

const PRODUCT_HINTS = [
  "arroz",
  "leche",
  "pan",
  "huevo",
  "pollo",
  "carne",
  "fruta",
  "verdura",
  "detergente",
  "jabon",
  "papel",
  "aceite",
  "azucar",
  "sal",
  "cafe",
  "queso",
  "producto",
  "super",
  "supermercado",
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function countHints(text: string, hints: string[]): number {
  return hints.reduce((acc, hint) => (text.includes(hint) ? acc + 1 : acc), 0);
}

export function getSmartItemTypeWarning(
  input: SmartValidationInput
): ItemTypeSmartWarning | null {
  const name = normalizeText(input.name);
  const category = normalizeText(input.category ?? "");
  const source = `${name} ${category}`.trim();

  if (!source) return null;

  const serviceScore =
    countHints(name, SERVICE_HINTS) * 2 + countHints(category, SERVICE_HINTS);
  const productScore =
    countHints(name, PRODUCT_HINTS) * 2 + countHints(category, PRODUCT_HINTS);

  if (
    input.itemType === "product" &&
    serviceScore >= 2 &&
    serviceScore >= productScore + 1
  ) {
    return {
      suggestedType: "service",
      title: "¿Seguro que es un producto?",
      message:
        "Por el nombre o la categoría parece un servicio. Si lo prefieres, puedes cambiarlo a Servicio antes de guardar.",
    };
  }

  if (
    input.itemType === "service" &&
    productScore >= 2 &&
    productScore >= serviceScore + 1
  ) {
    return {
      suggestedType: "product",
      title: "¿Seguro que es un servicio?",
      message:
        "Por el nombre o la categoría parece un producto. Si lo prefieres, puedes cambiarlo a Producto antes de guardar.",
    };
  }

  return null;
}
