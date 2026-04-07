// File: src/screens/incomes/components/IncomeRow.tsx — Item de lista.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { IncomeItemApi, IncomeSourceApi } from "@/api/incomes-api";
import { ThemedText } from "@/components/themed-text";
import { a11yButton } from "@/utils/accessibility";

import { formatShortDate } from "../utils/dates";
import { formatMoney } from "../utils/money";
import { SOURCE_LABEL } from "./IncomeSourceChips";

const SOURCE_ICON: Record<IncomeSourceApi, keyof typeof Ionicons.glyphMap> = {
  salary: "wallet-outline",
  gift: "gift-outline",
  refund: "refresh-outline",
  other: "sparkles-outline",
};

const SOURCE_ACCENT: Record<IncomeSourceApi, { bg: string; fg: string }> = {
  salary: { bg: "rgba(34, 197, 94, 0.18)", fg: "#15803D" },
  gift: { bg: "rgba(168, 85, 247, 0.18)", fg: "#7E22CE" },
  refund: { bg: "rgba(59, 130, 246, 0.18)", fg: "#1D4ED8" },
  other: { bg: "rgba(251, 191, 36, 0.18)", fg: "#B45309" },
};

function MetaChip({
  label,
  border,
  muted,
  icon,
}: {
  label: string;
  border: string;
  muted: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.metaChip, { borderColor: border }]}>
      {icon ? <Ionicons name={icon} size={12} color={muted} /> : null}
      <ThemedText
        style={[styles.metaChipText, { color: muted }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </View>
  );
}

function RowActionButton({
  label,
  hint,
  icon,
  onPress,
  borderColor,
  bg,
  textColor,
}: {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  borderColor: string;
  bg: string;
  textColor: string;
}) {
  return (
    <Pressable
      {...a11yButton(label, hint)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          borderColor,
          backgroundColor: bg,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={textColor} />
      <ThemedText
        type="defaultSemiBold"
        style={[styles.actionBtnLabel, { color: textColor }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function IncomeRow({
  item,
  currency,
  border,
  cardBg,
  text,
  muted,
  positive,
  danger,
  onEdit,
  onDelete,
}: {
  item: IncomeItemApi;
  currency: string;
  border: string;
  cardBg: string;
  text: string;
  muted: string;
  positive: string;
  danger: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [descriptionCanExpand, setDescriptionCanExpand] = React.useState(false);

  React.useEffect(() => {
    setDescriptionExpanded(false);
    setDescriptionCanExpand(false);
  }, [item.id, item.description]);

  const dateLabel = formatShortDate(item.occurredAt ?? item.createdAt);
  const sourceAccent = SOURCE_ACCENT[item.source];

  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: cardBg,
          borderColor: border,
          borderLeftColor: sourceAccent.fg,
        },
      ]}
    >
      <View style={styles.mainRow}>
        <View
          style={[styles.sourceBadge, { backgroundColor: sourceAccent.bg }]}
        >
          <Ionicons
            name={SOURCE_ICON[item.source]}
            size={18}
            color={sourceAccent.fg}
          />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.titleRow}>
            <View style={styles.descriptionBlock}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.descriptionMeasure}
                accessible={false}
                onTextLayout={(e) => {
                  const nextCanExpand = e.nativeEvent.lines.length > 1;

                  if (nextCanExpand !== descriptionCanExpand) {
                    setDescriptionCanExpand(nextCanExpand);
                  }
                }}
              >
                {item.description}
              </ThemedText>

              <ThemedText
                type="defaultSemiBold"
                numberOfLines={descriptionExpanded ? undefined : 1}
                style={styles.description}
              >
                {item.description}
              </ThemedText>

              {descriptionCanExpand ? (
                <Pressable
                  {...a11yButton(
                    descriptionExpanded
                      ? "Contraer descripción"
                      : "Expandir descripción",
                    descriptionExpanded
                      ? `Oculta la descripción completa de ${item.description}`
                      : `Muestra la descripción completa de ${item.description}`
                  )}
                  onPress={() => setDescriptionExpanded((prev) => !prev)}
                  style={styles.expandBtn}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.expandBtnLabel, { color: text }]}
                  >
                    {descriptionExpanded ? "Ver menos" : "Ver más"}
                  </ThemedText>
                  <Ionicons
                    name={descriptionExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={text}
                  />
                </Pressable>
              ) : null}
            </View>

            <ThemedText
              type="defaultSemiBold"
              style={[styles.amount, { color: positive }]}
            >
              +{formatMoney(item.amount, currency)}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            <MetaChip
              label={SOURCE_LABEL[item.source]}
              border={border}
              muted={muted}
              icon="pricetag-outline"
            />
            {item.category ? (
              <MetaChip label={item.category} border={border} muted={muted} />
            ) : null}
            {dateLabel ? (
              <MetaChip
                label={dateLabel}
                border={border}
                muted={muted}
                icon="calendar-outline"
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={[styles.actionsRow, { borderTopColor: border }]}>
        <RowActionButton
          label="Editar"
          hint={`Edita el ingreso ${item.description}`}
          icon="create-outline"
          onPress={onEdit}
          borderColor={border}
          bg={String(text) + "10"}
          textColor={text}
        />

        <RowActionButton
          label="Eliminar"
          hint={`Elimina el ingreso ${item.description}`}
          icon="trash-outline"
          onPress={onDelete}
          borderColor={danger + "66"}
          bg={danger + "1A"}
          textColor={danger}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sourceBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  descriptionBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  description: {
    flexShrink: 1,
  },
  descriptionMeasure: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
  expandBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 2,
  },
  expandBtnLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  amount: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 26,
  },
  metaChipText: {
    fontSize: 11,
    lineHeight: 14,
  },
  actionsRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
});
