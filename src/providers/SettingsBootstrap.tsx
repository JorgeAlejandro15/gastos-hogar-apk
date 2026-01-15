// File: src/providers/SettingsBootstrap.tsx — Hidrata ajustes (tema, etc.) al arrancar la app.

import React, { useEffect } from "react";

import { useSettingsStore } from "@/stores/settingsStore";

export function SettingsBootstrap({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await hydrate();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  return <>{children}</>;
}
