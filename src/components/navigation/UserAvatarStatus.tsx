import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useMemo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type UserAvatarPresenceStatus = "online" | "syncing" | "offline";

interface UserAvatarStatusProps {
  displayName?: string | null;
  email?: string | null;
  status: UserAvatarPresenceStatus;
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function getUserInitials(
  name?: string | null,
  email?: string | null
): string {
  const cleanName = name?.trim();

  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
    return `${first}${second}`.toUpperCase() || "US";
  }

  const emailPrefix = email?.split("@")[0]?.trim() ?? "";
  if (emailPrefix.length >= 2) return emailPrefix.slice(0, 2).toUpperCase();
  if (emailPrefix.length === 1) return `${emailPrefix[0].toUpperCase()}U`;
  return "US";
}

function getStatusLabel(status: UserAvatarPresenceStatus): string {
  if (status === "offline") return "Sin conexión";
  if (status === "syncing") return "Sincronizando";
  return "En línea";
}

export const UserAvatarStatus = memo(function UserAvatarStatus({
  displayName,
  email,
  status,
  onPress,
  size = 42,
  style,
  accessibilityLabel,
  accessibilityHint,
}: UserAvatarStatusProps) {
  const { background, border, primary, text, green, yellow, red } =
    useThemeColors();

  const initials = useMemo(
    () => getUserInitials(displayName, email),
    [displayName, email]
  );
  const statusLabel = getStatusLabel(status);

  const avatarSize = Math.max(36, size);
  const badgeSize = Math.max(10, Math.round(avatarSize * 0.28));
  const badgeOffset = Math.max(-1, Math.round(avatarSize * 0.02));

  const statusColor =
    status === "offline" ? red : status === "syncing" ? yellow : green;

  const commonA11yLabel =
    accessibilityLabel ?? `Abrir perfil. Estado: ${statusLabel}`;

  const avatarNode = (
    <LinearGradient
      colors={[`${primary}38`, `${primary}14`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradientAvatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderColor: border,
        },
      ]}
    >
      <ThemedText
        type="defaultSemiBold"
        style={[
          styles.initials,
          {
            color: text,
            fontSize: Math.round(avatarSize * 0.33),
          },
        ]}
      >
        {initials}
      </ThemedText>

      <View
        style={[
          styles.statusBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            right: badgeOffset,
            bottom: badgeOffset,
            backgroundColor: statusColor,
            borderColor: background,
          },
        ]}
        accessible={false}
      />
    </LinearGradient>
  );

  if (!onPress) {
    return (
      <View
        style={style}
        accessible
        accessibilityRole="image"
        accessibilityLabel={commonA11yLabel}
      >
        {avatarNode}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={commonA11yLabel}
      accessibilityHint={accessibilityHint ?? "Abre tu cuenta y configuración"}
      style={({ pressed }) => [style, pressed && styles.pressed]}
      hitSlop={8}
    >
      {avatarNode}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  gradientAvatar: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  initials: {
    letterSpacing: 0.6,
  },
  statusBadge: {
    position: "absolute",
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
