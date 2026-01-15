import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { a11yButton } from "@/utils/accessibility";

export type HistoryFilterFabProps = {
  visible: boolean;
  onPress: () => void;
  tint: string;
  onTintText: string;
  hasActiveFilter: boolean;
};

export const HistoryFilterFab = React.memo(function HistoryFilterFab({
  visible,
  onPress,
  tint,
  onTintText,
  hasActiveFilter,
}: HistoryFilterFabProps) {
  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Pressable
        {...a11yButton(
          hasActiveFilter ? "Filtro de fecha activo" : "Filtrar por fecha",
          "Abre el filtro de historial por rango de fechas"
        )}
        onPress={onPress}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: tint, opacity: pressed ? 0.92 : 1 },
        ]}
      >
        <ThemedView style={styles.fabInner}>
          <Ionicons name="filter" size={20} color={onTintText} />
          {hasActiveFilter ? (
            <View style={[styles.dot, { backgroundColor: onTintText }]} />
          ) : null}
        </ThemedView>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    right: 18,
    bottom: 18,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 7,
    opacity: 0.95,
  },
});
