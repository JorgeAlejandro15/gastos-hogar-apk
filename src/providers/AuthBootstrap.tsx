// File: src/providers/AuthBootstrap.tsx — Hidrata sesión (SecureStore) y configura refresh handler.

import { isAxiosError } from "axios";
import React, { useEffect } from "react";

import { useAuthStore } from "@/stores/authStore";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const refreshMe = useAuthStore((s) => s.refreshMe);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    // Se ejecuta una vez al arrancar la app.
    let cancelled = false;

    (async () => {
      await hydrate();
      if (cancelled) return;

      // Sincroniza user/household desde el backend. Es seguro: refreshMe no hace nada si no hay token.
      try {
        await refreshMe();
      } catch (e) {
        // IMPORTANT: avoid "Uncaught (in promise)" on boot.
        // If the token is invalid/expired and refresh failed, force logout so the app redirects to login.
        const status = isAxiosError(e) ? e.response?.status : undefined;
        if (status === 401 || status === 403) {
          await logout();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrate, refreshMe, logout]);

  return <>{children}</>;
}
