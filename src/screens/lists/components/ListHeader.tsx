import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { a11yButton } from "@/utils/accessibility";
import { formatCurrency } from "@/utils/format";

export type ListHeaderProps = {
  title: string;
  subtitleTotal: number;
  currency: string;
  tint: string;
  text: string;
  icon: string;
  onBack: () => void;
  onOpenMenu: () => void;
  onShare?: () => void;
};

export const ListHeader = React.memo(function ListHeader({
  title,
  subtitleTotal,
  currency,
  tint,
  text,
  icon,
  onBack,
  onOpenMenu,
  onShare,
}: ListHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        {...a11yButton("Volver", "Regresar a la lista de listas")}
        onPress={onBack}
        style={[styles.headerButton, { borderColor: String(text) + "22" }]}
      >
        <Ionicons name="arrow-back" size={20} color={icon} />
      </Pressable>

      <View style={styles.headerTitle}>
        <ThemedText type="subtitle" accessibilityRole="header">
          {title}
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Pendiente: {formatCurrency(subtitleTotal, currency)}
        </ThemedText>
      </View>

      <View style={styles.headerRight}>
        {onShare ? (
          <Pressable
            {...a11yButton(
              "Compartir",
              "Invitar personas para compartir esta lista"
            )}
            onPress={onShare}
            style={[styles.headerButton, { borderColor: String(text) + "22" }]}
          >
            <Ionicons name="person-add" size={18} color={icon} />
          </Pressable>
        ) : null}

        <Pressable
          {...a11yButton("Menú", "Acciones de la lista")}
          onPress={onOpenMenu}
          style={[styles.headerButton, { borderColor: String(text) + "22" }]}
        >
          <ThemedText style={{ color: String(tint) }}>⋯</ThemedText>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerSubtitle: {
    opacity: 0.75,
    fontSize: 13,
  },
});
