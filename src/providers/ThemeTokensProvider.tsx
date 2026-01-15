// File: src/providers/ThemeTokensProvider.tsx — Context para exponer tokens de tema (scheme + colores)
// calculados una sola vez, evitando suscripciones repetidas en cada componente.

import React, { createContext, useContext, useMemo } from "react";

import { Colors } from "@/constants/theme";
import type { AppColorScheme } from "@/hooks/use-app-color-scheme";
import { useAppColorScheme } from "@/hooks/use-app-color-scheme";

type ThemeColors = typeof Colors.light;

export type ThemeTokens = {
  scheme: AppColorScheme;
  colors: ThemeColors;
};

const ThemeTokensContext = createContext<ThemeTokens | null>(null);

export function ThemeTokensProvider({
  children,
  scheme,
}: {
  children: React.ReactNode;
  scheme?: AppColorScheme;
}) {
  // Si se provee `scheme`, evitamos suscribirnos a Appearance aquí (mejor performance).
  if (scheme) {
    return (
      <ThemeTokensProviderInner scheme={scheme}>
        {children}
      </ThemeTokensProviderInner>
    );
  }

  return <ThemeTokensProviderAuto>{children}</ThemeTokensProviderAuto>;
}

function ThemeTokensProviderAuto({ children }: { children: React.ReactNode }) {
  const scheme = useAppColorScheme();
  return (
    <ThemeTokensProviderInner scheme={scheme}>
      {children}
    </ThemeTokensProviderInner>
  );
}

function ThemeTokensProviderInner({
  children,
  scheme,
}: {
  children: React.ReactNode;
  scheme: AppColorScheme;
}) {
  const colors = useMemo(() => {
    return Colors[scheme];
  }, [scheme]);

  const value = useMemo<ThemeTokens>(
    () => ({ scheme, colors }),
    [scheme, colors]
  );

  return (
    <ThemeTokensContext.Provider value={value}>
      {children}
    </ThemeTokensContext.Provider>
  );
}

/**
 * Retorna tokens del tema desde context.
 * Si el provider no está montado (caso raro), hace fallback a cálculo local.
 */
export function useThemeTokens(): ThemeTokens {
  const ctx = useContext(ThemeTokensContext);
  if (ctx) return ctx;

  // Fallback seguro sin hooks (para evitar violar las reglas de hooks).
  // En la app normal esto NO debería ocurrir porque AppProviders monta ThemeTokensProvider.
  return { scheme: "light", colors: Colors.light };
}
