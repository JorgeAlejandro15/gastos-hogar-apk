// File: src/screens/incomes/components/IncomeUpsertModal.tsx — Modal para crear/editar ingreso.

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiErrorMessage } from "@/api/api";
import type {
  CreateIncomeDto,
  IncomeItemApi,
  IncomeSourceApi,
  UpdateIncomeDto,
} from "@/api/incomes-api";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
} from "@/query/incomes";
import { a11yButton } from "@/utils/accessibility";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { toIsoStartOfDay } from "../utils/dates";
import { DateField } from "./DateField";
import { IncomeSourceChips } from "./IncomeSourceChips";

type Mode = { kind: "create" } | { kind: "edit"; income: IncomeItemApi };

export function IncomeUpsertModal({
  visible,
  onClose,
  currency,
  mode,
}: {
  visible: boolean;
  onClose: () => void;
  currency: string;
  mode: Mode;
}) {
  const createIncome = useCreateIncomeMutation();
  const updateIncome = useUpdateIncomeMutation();

  const {
    text,
    surface: cardBg,
    border,
    primary,
    onPrimary,
    background,
  } = useThemeColors();

  const initial = useMemo(() => {
    if (mode.kind === "edit") {
      return {
        amount: String(mode.income.amount),
        description: mode.income.description ?? "",
        category: mode.income.category ?? "",
        source: mode.income.source,
        occurredAtIso: mode.income.occurredAt ?? null,
      };
    }

    return {
      amount: "",
      description: "",
      category: "",
      source: "salary" as IncomeSourceApi,
      occurredAtIso: null as string | null,
    };
  }, [mode]);

  const [amount, setAmount] = useState<string>(initial.amount);
  const [description, setDescription] = useState<string>(initial.description);
  const [category, setCategory] = useState<string>(initial.category);
  const [source, setSource] = useState<IncomeSourceApi>(initial.source);
  const [occurredAtIso, setOccurredAtIso] = useState<string | null>(
    initial.occurredAtIso
  );
  const [error, setError] = useState<string | null>(null);

  // Mantener el formulario consistente entre aperturas.
  React.useEffect(() => {
    if (visible) {
      // Al abrir: sincroniza siempre con el initial del modo actual.
      setAmount(initial.amount);
      setDescription(initial.description);
      setCategory(initial.category);
      setSource(initial.source);
      setOccurredAtIso(initial.occurredAtIso);
      setError(null);
      return;
    }
    // Al cerrar: si estamos en modo create, limpia para la próxima apertura.
    if (mode.kind === "create") {
      setAmount("");
      setDescription("");
      setCategory("");
      setSource("salary");
      setOccurredAtIso(null);
      setError(null);
    }
  }, [visible, initial, mode.kind]);

  const isBusy = createIncome.isPending || updateIncome.isPending;

  const canSubmit = useMemo(() => {
    const a = Number(String(amount).replace(",", "."));
    const okAmount = Number.isFinite(a) && a >= 0;
    const okDesc =
      description.trim().length > 0 && description.trim().length <= 120;
    const okCategory = category.trim().length <= 80;
    return okAmount && okDesc && okCategory && !isBusy;
  }, [amount, category, description, isBusy]);

  function resetAndClose() {
    if (isBusy) return;
    setError(null);
    onClose();
  }

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);

    try {
      const parsed = Number(String(amount).replace(",", "."));

      if (mode.kind === "create") {
        const dto: CreateIncomeDto = {
          amount: parsed,
          source,
          description: description.trim(),
          category: category.trim() ? category.trim() : undefined,
          occurredAt: occurredAtIso ?? undefined,
        };

        await createIncome.mutateAsync(dto);
      } else {
        const dto: UpdateIncomeDto = {
          amount: parsed,
          source,
          description: description.trim(),
          category: category.trim() ? category.trim() : undefined,
          occurredAt: occurredAtIso ?? undefined,
        };

        await updateIncome.mutateAsync({ incomeId: mode.income.id, dto });
      }

      resetAndClose();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }

  const title = mode.kind === "edit" ? "Editar ingreso" : "Nuevo ingreso";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <SafeAreaView
        style={[styles.modalSafe, { backgroundColor: background }]}
        edges={["top", "bottom"]}
      >
        <ThemedView
          style={[styles.modalContainer, { backgroundColor: background }]}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="title">{title}</ThemedText>
            <Pressable
              {...a11yButton("Cerrar", "Cierra el formulario")}
              onPress={resetAndClose}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={22} color={text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.modalCard,
              { backgroundColor: cardBg, borderColor: border },
            ]}
          >
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Monto ({currency})</ThemedText>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder={`0.00 ${currency}`}
                placeholderTextColor={String(text) + "99"}
                keyboardType="decimal-pad"
                style={[styles.input, { borderColor: border, color: text }]}
                editable={!isBusy}
                accessibilityLabel="Monto"
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Descripción</ThemedText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ej: Salario diciembre"
                placeholderTextColor={String(text) + "99"}
                style={[styles.input, { borderColor: border, color: text }]}
                editable={!isBusy}
                accessibilityLabel="Descripción"
                maxLength={120}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">
                Categoría (opcional)
              </ThemedText>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Ej: Trabajo"
                placeholderTextColor={String(text) + "99"}
                style={[styles.input, { borderColor: border, color: text }]}
                editable={!isBusy}
                accessibilityLabel="Categoría"
                maxLength={80}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Origen</ThemedText>
              <IncomeSourceChips
                includeAll={false}
                value={source}
                onChange={(v) => setSource(v as IncomeSourceApi)}
                border={String(border)}
                activeBg={String(primary) + "22"}
              />
            </View>

            <DateField
              label="Fecha"
              valueIso={occurredAtIso}
              onChange={(iso) => {
                // Para el usuario es "una fecha". En backend, mandamos el ISO.
                // Si el usuario elige una fecha, la normalizamos al inicio del día.
                if (!iso) {
                  setOccurredAtIso(null);
                  return;
                }
                const d = new Date(iso);
                setOccurredAtIso(toIsoStartOfDay(d));
              }}
              border={String(border)}
              text={String(text)}
              placeholder="Hoy"
            />

            {error ? (
              <ThemedText style={styles.error}>{error}</ThemedText>
            ) : null}

            <Pressable
              {...a11yButton("Guardar ingreso", "Guarda los cambios")}
              onPress={onSubmit}
              disabled={!canSubmit}
              style={[
                styles.primaryButton,
                { backgroundColor: primary },
                !canSubmit && styles.primaryButtonDisabled,
              ]}
            >
              {isBusy ? (
                <ActivityIndicator color={onPrimary} />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: onPrimary }}>
                  Guardar
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafe: { flex: 1 },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  field: { gap: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },

  primaryButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },

  error: { color: "#B00020" },
});
