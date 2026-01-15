import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColors } from "@/hooks/use-theme-colors";

export type ToastVariant = "success" | "error" | "info";

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
};

type ToastApi = {
  show: (
    message: string,
    opts?: { variant?: ToastVariant; durationMs?: number }
  ) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { border, surface, primary, text } = useThemeColors();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<ToastState>({
    visible: false,
    message: "",
    variant: "info",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const show = useCallback<ToastApi["show"]>((message, opts) => {
    const variant = opts?.variant ?? "info";
    const durationMs = opts?.durationMs ?? 2800;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setState({ visible: true, message, variant });

    timerRef.current = setTimeout(() => {
      setState((s) => ({ ...s, visible: false }));
      timerRef.current = null;
    }, durationMs);
  }, []);

  const api = useMemo(() => ({ show, hide }), [hide, show]);

  const accent =
    state.variant === "success"
      ? "#22c55e"
      : state.variant === "error"
      ? "#ef4444"
      : primary;

  // Keep the toast above the OS navigation/gesture bar + add extra breathing room.
  const bottomOffset = Math.max(insets.bottom, 12) + 16;

  return (
    <ToastContext.Provider value={api}>
      <View style={styles.root}>
        {children}

        {state.visible && state.message ? (
          <View
            pointerEvents="box-none"
            style={StyleSheet.flatten([
              styles.toastLayer,
              { bottom: bottomOffset },
            ])}
          >
            <Pressable onPress={hide} style={styles.toastPressable}>
              <ThemedView
                style={StyleSheet.flatten([
                  styles.toast,
                  {
                    borderColor: String(border),
                    backgroundColor: surface,
                  },
                ])}
              >
                <View style={[styles.accent, { backgroundColor: accent }]} />
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    color: state.variant === "error" ? "#ef4444" : String(text),
                  }}
                >
                  {state.message}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toastLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  toastPressable: {
    width: "100%",
    maxWidth: 520,
  },
  toast: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accent: {
    width: 6,
    height: 28,
    borderRadius: 999,
  },
});
