// File: src/components/ui/icon-symbol.tsx — Icono cross-platform (SF Symbols en iOS, Material Icons fallback).

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import {
  type OpaqueColorValue,
  type StyleProp,
  type TextStyle,
} from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;

type IconSymbolName = keyof typeof MAPPING;

/**
 * Mapea SF Symbols -> Material Icons.
 * - Material Icons: https://icons.expo.fyi
 */
const MAPPING = {
  "house.fill": "home",
  "list.bullet": "format-list-bulleted",
  "banknote.fill": "attach-money",
  "chart.bar": "bar-chart",
  "person.fill": "person",
  "gearshape.fill": "settings",
  "plus.circle.fill": "add-circle",
  "chevron.right": "chevron-right",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
