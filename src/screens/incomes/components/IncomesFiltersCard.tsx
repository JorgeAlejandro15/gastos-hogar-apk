// File: src/screens/incomes/components/IncomesFiltersCard.tsx — Filtros pro (origen, búsqueda, rango fechas).

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import type { IncomeSourceApi } from "@/api/incomes-api";
import { ThemedText } from "@/components/themed-text";
import { a11yButton } from "@/utils/accessibility";

import { toIsoEndOfDay, toIsoStartOfDay } from "../utils/dates";
import { DateField } from "./DateField";
import { IncomeSourceChips } from "./IncomeSourceChips";

// Altura por defecto cuando el teclado está cerrado
const DEFAULT_MAX_HEIGHT = 300;
// Porcentaje máximo de la pantalla cuando el teclado está abierto
const MAX_HEIGHT_RATIO_WITH_KEYBOARD = 0.35;
// Altura mínima para que los filtros sean usables
const MIN_HEIGHT = 150;

export function IncomesFiltersCard({
  cardBg,
  border,
  text,
  primary,
  source,
  onSource,
  search,
  onSearch,
  fromIso,
  onFromIso,
  toIso,
  onToIso,
  onClear,
  expanded,
  onToggleExpanded,
}: {
  cardBg: string;
  border: string;
  text: string;
  primary: string;
  source: IncomeSourceApi | "all";
  onSource: (v: IncomeSourceApi | "all") => void;
  search: string;
  onSearch: (v: string) => void;
  fromIso: string | null;
  onFromIso: (v: string | null) => void;
  toIso: string | null;
  onToIso: (v: string | null) => void;
  onClear: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Escuchar eventos del teclado
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Altura máxima: 300 cuando el teclado está cerrado, dinámica cuando está abierto
  const dynamicMaxHeight = isKeyboardVisible
    ? Math.max(
        MIN_HEIGHT,
        Math.round(windowHeight * MAX_HEIGHT_RATIO_WITH_KEYBOARD - 120)
      )
    : DEFAULT_MAX_HEIGHT;

  // Scroll automático al input de búsqueda cuando recibe foco
  const handleSearchFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
      >
        <View style={styles.titleRow}>
          <Pressable
            {...a11yButton(
              expanded ? "Colapsar filtros" : "Expandir filtros",
              "Muestra u oculta los filtros"
            )}
            onPress={onToggleExpanded}
            style={styles.toggleBtn}
          >
            <ThemedText type="defaultSemiBold">Filtros</ThemedText>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={text}
            />
          </Pressable>
          <Pressable
            {...a11yButton("Limpiar filtros", "Borra filtros y búsqueda")}
            onPress={onClear}
            style={[styles.clearBtn, { borderColor: border }]}
          >
            <ThemedText type="link">Limpiar</ThemedText>
          </Pressable>
        </View>

        {expanded && (
          <ScrollView
            ref={scrollViewRef}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={[{ maxHeight: dynamicMaxHeight }]}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.filtersContent}>
              <View style={styles.block}>
                <ThemedText type="defaultSemiBold">Origen</ThemedText>
                <IncomeSourceChips
                  includeAll
                  value={source}
                  onChange={onSource}
                  border={border}
                  activeBg={String(primary) + "22"}
                />
              </View>

              <View style={styles.datesRow}>
                <View style={{ flex: 1 }}>
                  <DateField
                    label="Desde"
                    valueIso={fromIso}
                    onChange={(iso) => {
                      if (!iso) return onFromIso(null);
                      onFromIso(toIsoStartOfDay(new Date(iso)));
                    }}
                    border={border}
                    text={text}
                    placeholder="Inicio"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DateField
                    label="Hasta"
                    valueIso={toIso}
                    onChange={(iso) => {
                      if (!iso) return onToIso(null);
                      onToIso(toIsoEndOfDay(new Date(iso)));
                    }}
                    border={border}
                    text={text}
                    placeholder="Fin"
                  />
                </View>
              </View>

              <View style={styles.block}>
                <ThemedText type="defaultSemiBold">Buscar</ThemedText>
                <TextInput
                  ref={searchInputRef}
                  value={search}
                  onChangeText={onSearch}
                  placeholder="Descripción o categoría (local)"
                  placeholderTextColor={String(text) + "99"}
                  style={[styles.input, { borderColor: border, color: text }]}
                  accessibilityLabel="Buscar ingresos"
                  returnKeyType="search"
                  submitBehavior="blurAndSubmit"
                  onFocus={handleSearchFocus}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 999,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 8,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  filtersContent: {
    gap: 12,
    marginTop: 10,
  },
  clearBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  datesRow: {
    flexDirection: "row",
    gap: 10,
  },
  block: { gap: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
});
