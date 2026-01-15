// File: src/api/env.ts — Variables de entorno (Expo public env).

export const env = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? "").trim(),
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? "15000"),
};

export function assertEnv(): void {
  if (!env.apiUrl) {
    console.warn(
      "Missing EXPO_PUBLIC_API_URL. Crea un .env (ver .env.example) y reinicia Expo."
    );
  }

  if (!Number.isFinite(env.apiTimeoutMs) || env.apiTimeoutMs <= 0) {
    console.warn(
      "Invalid EXPO_PUBLIC_API_TIMEOUT_MS. Se usará 15000ms. (Revisa tu .env y reinicia Expo.)"
    );
  }
}
