// File: src/components/debug/ThemePerformanceMonitor.tsx — Monitor visual de performance del tema

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type PerformanceLog = {
  timestamp: number;
  message: string;
  duration?: number;
};

let lastToggleTime: number | null = null;
let performanceLogs: PerformanceLog[] = [];

// Interceptar console.log FUERA del componente para evitar setState durante render
if (__DEV__) {
  const originalLog = console.log;
  let toggleStartTime: number | null = null;

  console.log = (...args: any[]) => {
    originalLog(...args);

    const message = args.join(" ");
    if (message.includes("[THEME]")) {
      const timestamp = Date.now();

      // Detectar inicio del toggle
      if (message.includes("Toggle iniciado")) {
        toggleStartTime = performance.now();
      }

      // Detectar fin del toggle y calcular tiempo total
      if (message.includes("Toggle completado") && toggleStartTime) {
        const totalTime = performance.now() - toggleStartTime;
        lastToggleTime = totalTime;
        toggleStartTime = null;
      }

      // Extraer duración del mensaje
      const durationMatch = message.match(/(\d+\.?\d*)ms/);
      const duration = durationMatch ? parseFloat(durationMatch[1]) : undefined;

      performanceLogs = [
        ...performanceLogs,
        { timestamp, message: message.replace("[THEME]", ""), duration },
      ].slice(-20); // Mantener solo los últimos 20
    }
  };
}

export function ThemePerformanceMonitor() {
  const [, forceUpdate] = useState(0);
  const colors = useThemeColors();

  // Forzar actualización periódica para mostrar nuevos logs
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (performanceLogs.length === 0 && !lastToggleTime) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        🔍 Theme Performance Monitor
      </Text>

      {lastToggleTime !== null && (
        <View style={styles.summaryBox}>
          <Text
            style={[
              styles.summaryText,
              {
                color:
                  lastToggleTime < 50
                    ? "#34C759"
                    : lastToggleTime < 100
                      ? "#FFD60A"
                      : "#FF3B30",
              },
            ]}
          >
            ⏱️ Último toggle: {lastToggleTime.toFixed(2)}ms
            {lastToggleTime < 50 && " ⚡ Rápido"}
            {lastToggleTime >= 50 && lastToggleTime < 100 && " ⚠️ Aceptable"}
            {lastToggleTime >= 100 && " 🐌 Lento"}
          </Text>
        </View>
      )}

      <View style={styles.logsContainer}>
        {performanceLogs.slice(-5).map((log, index) => (
          <Text
            key={`${log.timestamp}-${index}`}
            style={[styles.logText, { color: colors.text }]}
            numberOfLines={2}
          >
            {log.message}
            {log.duration !== undefined && (
              <Text
                style={{
                  color:
                    log.duration < 10
                      ? "#34C759"
                      : log.duration < 50
                        ? "#FFD60A"
                        : "#FF3B30",
                  fontWeight: "bold",
                }}
              >
                {" "}
                ({log.duration.toFixed(2)}ms)
              </Text>
            )}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
    opacity: 0.95,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryBox: {
    marginBottom: 8,
    padding: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  logsContainer: {
    gap: 4,
  },
  logText: {
    fontSize: 10,
    opacity: 0.8,
  },
});
