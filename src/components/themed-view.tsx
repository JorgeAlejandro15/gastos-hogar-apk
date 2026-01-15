// File: src/components/themed-view.tsx — Componente View con background según tema.

import React, { useMemo } from "react";
import { View, type ViewProps } from "react-native";

import { useThemeTokens } from "@/providers/ThemeTokensProvider";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export const ThemedView = React.memo(function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const { colors, scheme } = useThemeTokens();

  const backgroundColor = useMemo(() => {
    if (lightColor && scheme === "light") return lightColor;
    if (darkColor && scheme === "dark") return darkColor;
    return colors.background;
  }, [lightColor, darkColor, scheme, colors.background]);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
});
