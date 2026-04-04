// File: src/api/api.ts — Cliente HTTP (axios) + refresh automático + helper de errores.

import axios, { AxiosError, isAxiosError } from "axios";

import { assertEnv, env } from "@/api/env";

assertEnv();

const timeoutMs =
  Number.isFinite(env.apiTimeoutMs) && env.apiTimeoutMs > 0
    ? env.apiTimeoutMs
    : 15000;

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: timeoutMs,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

type RefreshHandler = () => Promise<{ accessToken: string } | null>;

let refreshHandler: RefreshHandler | null = null;
let refreshInFlight: Promise<{ accessToken: string } | null> | null = null;

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}

export function setAccessToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }

    const err = error as AxiosError;
    const status = err.response?.status;
    const originalRequest: any = err.config;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url) ||
      !refreshHandler
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = refreshHandler();
      }

      const refreshed = await refreshInFlight;

      if (!refreshed?.accessToken) {
        return Promise.reject(error);
      }

      setAccessToken(refreshed.accessToken);
      originalRequest.headers = {
        ...(originalRequest.headers ?? {}),
        Authorization: `Bearer ${refreshed.accessToken}`,
      };

      return api.request(originalRequest);
    } finally {
      refreshInFlight = null;
    }
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (!error) return "Error desconocido";

  if (isAxiosError(error)) {
    const err = error as AxiosError<any>;

    const messageFromServer =
      typeof err.response?.data?.message === "string"
        ? err.response.data.message
        : Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message?.[0]
          : undefined;

    const fallback = err.response?.status
      ? `Error ${err.response.status}`
      : err.code
        ? `Error (${err.code})`
        : "Error de red";

    return messageFromServer ?? err.message ?? fallback;
  }

  if (error instanceof Error) return error.message;
  return "Error desconocido";
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (!error) return undefined;
  if (!isAxiosError(error)) return undefined;

  const err = error as AxiosError<any>;
  return err.response?.status;
}
