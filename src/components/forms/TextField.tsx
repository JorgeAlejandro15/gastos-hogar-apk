// File: src/components/forms/TextField.tsx — Campo de texto accesible y consistente para formularios.

import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type TextFieldProps = TextInputProps & {
  label?: string;
  errorText?: string | null;
  helperText?: string | null;
};

export const TextField = React.memo(function TextField({
  label,
  errorText,
  helperText,
  style,
  ...props
}: TextFieldProps) {
  const { text, background, tint } = useThemeColors();

  const borderColor = errorText ? "#D14343" : String(text) + "22";
  const messageText = errorText ?? helperText;
  const hasError = !!errorText;

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

      {messageText ? (
        <ThemedText
          style={[
            styles.message,
            {
              color: hasError ? "#D14343" : String(text) + "B3",
            },
          ]}
        >
          {messageText}
        </ThemedText>
      ) : null}
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
  message: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 7,
  },
});
