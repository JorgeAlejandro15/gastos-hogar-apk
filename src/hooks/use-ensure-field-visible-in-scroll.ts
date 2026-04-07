import React from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type KeyboardEvent as RNKeyboardEvent,
} from "react-native";

type NullableRef<T> = {
  current: T | null;
};

export type UseEnsureFieldVisibleInScrollParams<FieldKey extends string> = {
  visible: boolean;
  scrollRef: NullableRef<ScrollView>;
  scrollViewportRef: NullableRef<View>;
  fieldRefs: Record<FieldKey, NullableRef<View>>;
  topPadding?: number;
  bottomPadding?: number;
};

const DEFAULT_TOP_PADDING = 12;
const DEFAULT_BOTTOM_PADDING = 16;

export function useEnsureFieldVisibleInScroll<FieldKey extends string>({
  visible,
  scrollRef,
  scrollViewportRef,
  fieldRefs,
  topPadding = DEFAULT_TOP_PADDING,
  bottomPadding = DEFAULT_BOTTOM_PADDING,
}: UseEnsureFieldVisibleInScrollParams<FieldKey>) {
  const { height: windowHeight } = useWindowDimensions();

  const keyboardHeightRef = React.useRef(0);
  const activeFieldRef = React.useRef<FieldKey | null>(null);
  const currentScrollYRef = React.useRef(0);

  const ensureFieldVisible = React.useCallback(
    (field: FieldKey, animated = true) => {
      const scrollNode = scrollRef.current;
      const viewportNode = scrollViewportRef.current;
      const fieldNode = fieldRefs[field]?.current;

      if (!scrollNode || !viewportNode || !fieldNode) return;

      viewportNode.measureInWindow(
        (_sx: number, scrollY: number, _sw: number, scrollHeight: number) => {
          fieldNode.measureInWindow(
            (_fx: number, fieldY: number, _fw: number, fieldHeight: number) => {
              if (
                !Number.isFinite(scrollY) ||
                !Number.isFinite(scrollHeight) ||
                !Number.isFinite(fieldY) ||
                !Number.isFinite(fieldHeight)
              ) {
                return;
              }

              const keyboardTopY =
                keyboardHeightRef.current > 0
                  ? windowHeight - keyboardHeightRef.current
                  : windowHeight;

              const visibleTop = scrollY + topPadding;
              const visibleBottom =
                Math.min(scrollY + scrollHeight, keyboardTopY) - bottomPadding;

              if (visibleBottom <= visibleTop) {
                scrollNode.scrollToEnd({ animated });
                return;
              }

              const fieldBottom = fieldY + fieldHeight;
              let delta = 0;

              if (fieldBottom > visibleBottom) {
                delta = fieldBottom - visibleBottom;
              } else if (fieldY < visibleTop) {
                delta = fieldY - visibleTop;
              }

              if (Math.abs(delta) < 1) return;

              scrollNode.scrollTo({
                y: Math.max(0, currentScrollYRef.current + delta),
                animated,
              });
            }
          );
        }
      );
    },
    [
      bottomPadding,
      fieldRefs,
      scrollRef,
      scrollViewportRef,
      topPadding,
      windowHeight,
    ]
  );

  const onFieldFocus = React.useCallback(
    (field: FieldKey) => {
      activeFieldRef.current = field;

      requestAnimationFrame(() => {
        ensureFieldVisible(field, true);
      });
    },
    [ensureFieldVisible]
  );

  const onScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentScrollYRef.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  React.useEffect(() => {
    if (visible) return;

    activeFieldRef.current = null;
    currentScrollYRef.current = 0;
    keyboardHeightRef.current = 0;
  }, [visible]);

  React.useEffect(() => {
    if (!visible) return;

    const handleKeyboardShow = (event: RNKeyboardEvent) => {
      keyboardHeightRef.current = event.endCoordinates?.height ?? 0;

      if (!activeFieldRef.current) return;

      requestAnimationFrame(() => {
        if (!activeFieldRef.current) return;
        ensureFieldVisible(activeFieldRef.current, true);
      });
    };

    const handleKeyboardHide = () => {
      keyboardHeightRef.current = 0;
    };

    const subscriptions =
      Platform.OS === "ios"
        ? [
            Keyboard.addListener("keyboardWillShow", handleKeyboardShow),
            Keyboard.addListener("keyboardWillChangeFrame", handleKeyboardShow),
            Keyboard.addListener("keyboardWillHide", handleKeyboardHide),
          ]
        : [
            Keyboard.addListener("keyboardDidShow", handleKeyboardShow),
            Keyboard.addListener("keyboardDidHide", handleKeyboardHide),
          ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [ensureFieldVisible, visible]);

  return {
    ensureFieldVisible,
    onFieldFocus,
    onScroll,
  };
}
