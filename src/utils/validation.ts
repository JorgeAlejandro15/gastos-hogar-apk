// File: src/utils/validation.ts — Funciones de validación reutilizables.

/**
 * Valida formato de email básico.
 */
export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (!email) return false;
  // Similar a class-validator IsEmail (sin ser excesivamente estricto).
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Normaliza un email (trim + lower).
 */
export function normalizeEmail(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * Normaliza un número de teléfono a formato E.164 o local.
 * - E.164: +[1-9][0-9]{7,14}
 * - Local: [0-9]{6,15}
 */
export function normalizePhone(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";

  if (hasPlus) {
    const normalized = `+${digits}`;
    return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : "";
  }

  return /^\d{6,15}$/.test(digits) ? digits : "";
}

/**
 * Valida que un teléfono tenga formato E.164 o local válido.
 * - E.164: +[1-9][0-9]{7,14} (8 a 15 dígitos con +)
 * - Local: [0-9]{6,15} (6 a 15 dígitos sin +)
 */
export function isValidPhone(value: string): boolean {
  const normalized = normalizePhone(value);
  return /^(\+[1-9]\d{7,14}|\d{6,15})$/.test(normalized);
}

/**
 * Política de contraseña (alineada con backend):
 * - 8+ caracteres
 * - 1 mayúscula
 * - 1 minúscula
 * - 1 número
 * - sin espacios
 */
export type PasswordPolicyChecks = {
  min8: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  noSpaces: boolean;
  okCount: number;
  ok: boolean;
};

export function getPasswordPolicyChecks(value: string): PasswordPolicyChecks {
  const v = String(value || "");
  const min8 = v.length >= 8;
  const hasUpper = /[A-ZÁÉÍÓÚÑ]/.test(v);
  const hasLower = /[a-záéíóúñ]/.test(v);
  const hasNumber = /\d/.test(v);
  const noSpaces = /^\S*$/.test(v);
  const okCount = [min8, hasUpper, hasLower, hasNumber, noSpaces].filter(
    Boolean
  ).length;
  const ok = min8 && hasUpper && hasLower && hasNumber && noSpaces;
  return { min8, hasUpper, hasLower, hasNumber, noSpaces, okCount, ok };
}

export function isStrongPassword(value: string): boolean {
  return getPasswordPolicyChecks(value).ok;
}
