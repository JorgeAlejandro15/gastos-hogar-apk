// File: src/components/haptic-tab.tsx — Botón de Tab con feedback háptico (iOS).

import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          // Feedback suave al presionar tabs.
          // Lazy-load to avoid bundling issues on web.
          const Haptics =
            require("expo-haptics") as typeof import("expo-haptics");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
