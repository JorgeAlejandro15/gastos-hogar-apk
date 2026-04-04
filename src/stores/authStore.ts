// File: src/stores/authStore.ts — Store global de autenticación (Zustand) con persistencia segura.

import { isAxiosError } from "axios";
import { create } from "zustand";

import { setAccessToken, setRefreshHandler } from "@/api/api";
import * as authApi from "@/api/auth-api";
import * as authStorage from "@/api/auth-storage";

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: authApi.AuthUser | null;
  household: authApi.AuthHousehold | null;

  isHydrating: boolean;
  hydratedOnce: boolean;

  hydrate: () => Promise<void>;
  login: (dto: authApi.LoginRequest) => Promise<void>;
  register: (dto: authApi.RegisterRequest) => Promise<void>;
  refreshMe: () => Promise<void>;
  updateMe: (dto: authApi.UpdateMeRequest) => Promise<void>;
  changePassword: (dto: authApi.ChangePasswordRequest) => Promise<void>;
  logout: () => Promise<void>;
};

let hydrateInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  household: null,

  isHydrating: true,
  hydratedOnce: false,

  hydrate: async () => {
    if (get().hydratedOnce) return;
    if (hydrateInFlight) return hydrateInFlight;

    set({ isHydrating: true });

    hydrateInFlight = (async () => {
      try {
        const persisted = await authStorage.loadAuth();

        const user = persisted.userJson
          ? (JSON.parse(persisted.userJson) as authApi.AuthUser)
          : null;

        const household = persisted.householdJson
          ? (JSON.parse(persisted.householdJson) as authApi.AuthHousehold)
          : null;

        setAccessToken(persisted.accessToken);

        set({
          accessToken: persisted.accessToken,
          refreshToken: persisted.refreshToken,
          user,
          household,
          hydratedOnce: true,
        });
      } catch {
        // Si el storage está corrupto o inaccesible, reiniciamos sesión.
        setAccessToken(null);
        await authStorage.clearAuth();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          household: null,
          hydratedOnce: true,
        });
      } finally {
        set({ isHydrating: false });
        hydrateInFlight = null;
      }
    })();

    return hydrateInFlight;
  },

  login: async (dto) => {
    const res = await authApi.login(dto);
    setAccessToken(res.accessToken);

    await authStorage.saveAuth({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      userJson: JSON.stringify(res.user),
      // El backend puede no devolver household en login; lo sincronizamos vía /auth/me.
      householdJson: res.household ? JSON.stringify(res.household) : null,
    });

    set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
      household: res.household ?? null,
    });

    // Best-effort: obtener el household real (y user actualizado) desde /auth/me.
    // Si falla (offline), mantenemos sesión con tokens y el household seguirá null hasta la próxima sync.
    try {
      const me = await authApi.me();

      await authStorage.updateProfile({
        userJson: me.user ? JSON.stringify(me.user) : null,
        householdJson: me.household ? JSON.stringify(me.household) : null,
      });

      set({
        user: me.user,
        household: me.household ?? null,
      });
    } catch {
      // noop
      throw new Error("Failed to refresh profile after login");
    }
  },

  register: async (dto) => {
    const res = await authApi.register(dto);
    setAccessToken(res.accessToken);

    await authStorage.saveAuth({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      userJson: JSON.stringify(res.user),
      householdJson: res.household ? JSON.stringify(res.household) : null,
    });

    set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
      household: res.household ?? null,
    });

    // Igual que login: sincroniza el perfil desde /auth/me para reflejar household si ya existe.
    try {
      const me = await authApi.me();

      await authStorage.updateProfile({
        userJson: me.user ? JSON.stringify(me.user) : null,
        householdJson: me.household ? JSON.stringify(me.household) : null,
      });

      set({
        user: me.user,
        household: me.household ?? null,
      });
    } catch {
      // noop
      throw new Error("Failed to refresh profile after registration");
    }
  },

  refreshMe: async () => {
    // Requiere estar autenticado (accessToken ya configurado en axios).
    const { accessToken } = get();
    if (!accessToken) return;

    const res = await authApi.me();

    await authStorage.updateProfile({
      userJson: res.user ? JSON.stringify(res.user) : null,
      householdJson: res.household ? JSON.stringify(res.household) : null,
    });

    set({
      user: res.user,
      household: res.household ?? null,
    });
  },

  updateMe: async (dto) => {
    const { accessToken } = get();
    if (!accessToken) return;

    const res = await authApi.updateMe(dto);

    await authStorage.updateProfile({
      userJson: res.user ? JSON.stringify(res.user) : null,
      householdJson: res.household ? JSON.stringify(res.household) : null,
    });

    set({
      user: res.user,
      household: res.household ?? null,
    });
  },

  changePassword: async (dto) => {
    const { accessToken } = get();
    if (!accessToken) return;
    await authApi.changePassword(dto);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      await authStorage.clearAuth();
      setAccessToken(null);
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        household: null,
      });
    }
  },
}));

// Configura refresh handler una sola vez (usa el estado actual del store en cada llamada).
setRefreshHandler(async () => {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await authApi.refresh({ refreshToken });

    // Persistimos y actualizamos estado. refresh no devuelve user/household.
    await authStorage.updateTokens({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });

    setAccessToken(res.accessToken);
    useAuthStore.setState({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });

    return { accessToken: res.accessToken };
  } catch (e) {
    const status = isAxiosError(e) ? e.response?.status : undefined;

    // Refresh token inválido/expirado: limpia sesión para disparar redirect al login.
    if (status === 400 || status === 401 || status === 403) {
      await authStorage.clearAuth();
      setAccessToken(null);
      useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        household: null,
      });
      return null;
    }

    throw e;
  }
});

export function selectIsAuthenticated(s: AuthState): boolean {
  return !!s.accessToken;
}
