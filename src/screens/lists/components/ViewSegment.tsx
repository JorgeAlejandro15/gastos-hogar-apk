import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { a11yButton } from "@/utils/accessibility";

export type ViewMode = "pending" | "history";

export type ViewSegmentProps = {
  view: ViewMode;
  pendingCount: number;
  historyCount: number;
  tint: string;
  text: string;
  onChange: (next: ViewMode) => void;
  onTintText: string;
};

export const ViewSegment = React.memo(function ViewSegment({
  view,
  pendingCount,
  historyCount,
  tint,
  text,
  onChange,
  onTintText,
}: ViewSegmentProps) {
  return (
    <View style={[styles.segment, { borderColor: String(text) + "22" }]}>
      <Pressable
        {...a11yButton(
          `Pendientes (${pendingCount})`,
          "Muestra productos aún no comprados"
        )}
        onPress={() => onChange("pending")}
        style={StyleSheet.flatten([
          styles.segmentButton,
          view === "pending"
            ? { backgroundColor: String(tint) }
            : { backgroundColor: "transparent" },
        ])}
      >
        <ThemedText
          type="defaultSemiBold"
          style={
            view === "pending"
              ? [styles.activeText, { color: onTintText }]
              : { opacity: 0.85 }
          }
        >
          Pendientes ({pendingCount})
        </ThemedText>
      </Pressable>

      <Pressable
        {...a11yButton(
          `Historial (${historyCount})`,
          "Muestra productos ya comprados"
        )}
        onPress={() => onChange("history")}
        style={StyleSheet.flatten([
          styles.segmentButton,
          view === "history"
            ? { backgroundColor: String(tint) }
            : { backgroundColor: "transparent" },
        ])}
      >
        <ThemedText
          type="defaultSemiBold"
          style={
            view === "history"
              ? [styles.activeText, { color: onTintText }]
              : { opacity: 0.85 }
          }
        >
          Historial ({historyCount})
        </ThemedText>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  segment: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  activeText: {},
});
