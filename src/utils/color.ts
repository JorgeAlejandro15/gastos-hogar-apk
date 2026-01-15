// File: src/utils/color.ts — Helpers de color/contraste.

/**
 * Devuelve un color de texto legible (claro u oscuro) para un fondo en HEX.
 * - Soporta #RGB y #RRGGBB
 * - Si no puede parsear, retorna texto claro.
 */
export function readableTextOnHex(
  bg: string,
  options?: { lightText?: string; darkText?: string; threshold?: number }
): string {
  const lightText = options?.lightText ?? "#fff";
  const darkText = options?.darkText ?? "#11181C";
  const threshold =
    typeof options?.threshold === "number" ? options.threshold : 0.7;

  const hex = String(bg).trim().toLowerCase();
  const norm =
    hex.startsWith("#") && (hex.length === 7 || hex.length === 4) ? hex : null;

  if (!norm) return lightText;

  const full =
    norm.length === 4
      ? `#${norm[1]}${norm[1]}${norm[2]}${norm[2]}${norm[3]}${norm[3]}`
      : norm;

  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return lightText;
  }

  const srgb = [r, g, b].map((v) => v / 255);
  const lin = srgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  const luminance = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];

  return luminance > threshold ? darkText : lightText;
}
