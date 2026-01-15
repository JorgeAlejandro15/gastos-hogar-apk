// File: src/api/auth-api.ts — Endpoints de autenticación (login/register/refresh/logout).

import { api } from "@/api/api";

export type LoginRequest =
  | { email: string; password: string }
  | { phone: string; password: string };

export type RegisterRequest = {
  password: string;
  displayName: string;
} & ({ email: string } | { phone: string });

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  phone?: string | null;
};

export type AuthHousehold = {
  id: string;
  name: string;
  currency: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  household?: AuthHousehold | null;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type MeResponse = {
  user: AuthUser;
  household: AuthHousehold | null;
};

export type UpdateMeRequest = {
  displayName?: string;
  email?: string | null;
  phone?: string | null;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export async function login(dto: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", dto);
  return data;
}

export async function register(dto: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", dto);
  return data;
}

export async function logout(): Promise<{ ok: true } | { ok: boolean }> {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function refresh(dto: RefreshRequest): Promise<RefreshResponse> {
  const { data } = await api.post<RefreshResponse>("/auth/refresh", dto);
  return data;
}

export async function me(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
}

export async function updateMe(dto: UpdateMeRequest): Promise<MeResponse> {
  const { data } = await api.patch<MeResponse>("/auth/me", dto);
  return data;
}

export async function changePassword(
  dto: ChangePasswordRequest
): Promise<{ ok: true } | { ok: boolean }> {
  const { data } = await api.patch("/auth/password", dto);
  return data;
}
