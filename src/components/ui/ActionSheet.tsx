import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { a11yButton } from "@/utils/accessibility";

export type ActionSheetOption = {
  key: string;
  label: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  disabled?: boolean;
};

export type ActionSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  onSelect: (key: string) => void;
  onClose: () => void;
};

export function ActionSheet({
  visible,
  title,
  message,
  options,
  onSelect,
  onClose,
}: ActionSheetProps) {
  const { border, surface, text, primary } = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole={"button" as AccessibilityRole}
        accessibilityLabel="Cerrar menú"
      >
        <Pressable
          style={styles.sheetWrap}
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedView
            style={StyleSheet.flatten([
              styles.sheet,
              { borderColor: String(border), backgroundColor: surface },
            ])}
          >
            {(title || message) && (
              <View style={styles.header}>
                {title && <ThemedText type="subtitle">{title}</ThemedText>}
                {message && (
                  <ThemedText style={styles.message}>{message}</ThemedText>
                )}
              </View>
            )}

            <View style={styles.options}>
              {options.map((opt) => {
                const fg = opt.destructive ? "#ef4444" : String(text);
                const iconColor = opt.destructive ? "#ef4444" : primary;

                return (
                  <Pressable
                    key={opt.key}
                    {...a11yButton(opt.label, opt.hint)}
                    onPress={() => {
                      if (opt.disabled) return;
                      onSelect(opt.key);
                    }}
                    disabled={opt.disabled}
                    style={({ pressed }) => [
                      styles.optionRow,
                      {
                        borderColor: String(border),
                        opacity: opt.disabled ? 0.5 : pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    {opt.icon ? (
                      <View style={styles.optionIcon}>
                        <Ionicons name={opt.icon} size={18} color={iconColor} />
                      </View>
                    ) : null}

                    <View style={{ flex: 1 }}>
                      <ThemedText type="defaultSemiBold" style={{ color: fg }}>
                        {opt.label}
                      </ThemedText>
                      {opt.hint ? (
                        <ThemedText style={styles.optionHint}>
                          {opt.hint}
                        </ThemedText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              {...a11yButton("Cancelar", "Cierra el menú")}
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: String(border),
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheetWrap: {
    padding: 12,
  },
  sheet: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  header: {
    paddingHorizontal: 6,
    gap: 4,
  },
  message: {
    opacity: 0.75,
    fontSize: 12,
  },
  options: {
    gap: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  optionIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  optionHint: {
    opacity: 0.7,
    fontSize: 12,
    marginTop: 2,
  },
  cancelButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
