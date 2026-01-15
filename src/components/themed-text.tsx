// File: src/components/themed-text.tsx — Componente Text con colores y variantes por tema.

import React, { useMemo } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeTokens } from "@/providers/ThemeTokensProvider";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export const ThemedText = React.memo(function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const { colors, scheme } = useThemeTokens();

  const color = useMemo(() => {
    if (lightColor && scheme === "light") return lightColor;
    if (darkColor && scheme === "dark") return darkColor;

    return type === "link" ? colors.tint : colors.text;
  }, [lightColor, darkColor, scheme, type, colors.tint, colors.text]);

  const typeStyle = useMemo(() => {
    switch (type) {
      case "title":
        return styles.title;
      case "defaultSemiBold":
        return styles.defaultSemiBold;
      case "subtitle":
        return styles.subtitle;
      case "link":
        return styles.link;
      default:
        return styles.default;
    }
  }, [type]);

  return <Text style={[{ color }, typeStyle, style]} {...rest} />;
});

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    // color viene del theme (tint)
  },
});
