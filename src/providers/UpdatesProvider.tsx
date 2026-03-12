// File: src/providers/UpdatesProvider.tsx — Verifica y aplica actualizaciones OTA al iniciar la app.

import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import { Alert, Platform } from "react-native";

/**
 * Provider que verifica si hay OTA updates disponibles al montar.
 * Si encuentra uno, lo descarga y reinicia la app para aplicarlo.
 *
 * En desarrollo (__DEV__) o en web, se omite la verificación
 * porque expo-updates no opera en esos entornos.
 */
export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (__DEV__ || Platform.OS === "web") return;

    async function checkForOTAUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();

          Alert.alert(
            "Actualización disponible",
            "Se descargó una nueva versión. La app se reiniciará para aplicarla.",
            [
              {
                text: "Reiniciar ahora",
                onPress: () => Updates.reloadAsync(),
              },
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        // Silencioso: no interrumpir al usuario si la verificación falla
        // (sin conexión, timeout, etc.)
        console.warn("Error verificando OTA update:", error);
      }
    }

    checkForOTAUpdate();
  }, []);

  return <>{children}</>;
}
