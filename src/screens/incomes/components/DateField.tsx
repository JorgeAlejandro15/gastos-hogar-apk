// File: src/screens/incomes/components/DateField.tsx — Campo de fecha con DateTimePicker.

import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { formatShortDate, parseIsoOrNull } from "../utils/dates";

export function DateField({
  label,
  valueIso,
  onChange,
  border,
  text,
  placeholder,
}: {
  label: string;
  valueIso: string | null;
  onChange: (nextIso: string | null) => void;
  border: string;
  text: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const valueDate = useMemo(
    () => parseIsoOrNull(valueIso) ?? new Date(),
    [valueIso]
  );
  const shown = valueIso ? formatShortDate(valueIso) : "";

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${shown ? `: ${shown}` : ""}`}
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: border }]}
      >
        <ThemedText style={{ color: shown ? text : String(text) + "99" }}>
          {shown || placeholder || "Seleccionar"}
        </ThemedText>
      </Pressable>

      {valueIso ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Limpiar ${label}`}
          onPress={() => onChange(null)}
          style={[styles.done, { borderColor: border }]}
        >
          <ThemedText type="link">Limpiar</ThemedText>
        </Pressable>
      ) : null}

      {open ? (
        <DateTimePicker
          value={valueDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event: DateTimePickerEvent, date) => {
            if (Platform.OS !== "ios") {
              setOpen(false);
            }
            if (event.type === "dismissed") {
              return;
            }
            if (event.type !== "set") {
              return;
            }
            if (!date) return;
            onChange(date.toISOString());
          }}
        />
      ) : null}

      {Platform.OS === "ios" && open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Cerrar selector ${label}`}
          onPress={() => setOpen(false)}
          style={[styles.done, { borderColor: border }]}
        >
          <ThemedText type="defaultSemiBold">Listo</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  field: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  done: {
    marginTop: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});
