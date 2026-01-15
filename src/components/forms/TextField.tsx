// File: src/components/forms/TextField.tsx — Campo de texto accesible y consistente para formularios.

import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

export type TextFieldProps = TextInputProps & {
  label?: string;
  errorText?: string | null;
};

export const TextField = React.memo(function TextField({
  label,
  errorText,
  style,
  ...props
}: TextFieldProps) {
  const { text, background, tint } = useThemeColors();

  const borderColor = errorText ? "#D14343" : String(text) + "22";

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={StyleSheet.flatten([
          styles.input,
          {
            color: text,
            borderColor,
            backgroundColor: Platform.OS === "web" ? background : "transparent",
          },
          style,
        ])}
        placeholderTextColor={String(text) + "66"}
        selectionColor={String(tint)}
        accessibilityLabel={
          props.accessibilityLabel ?? label ?? props.placeholder ?? "Campo"
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
