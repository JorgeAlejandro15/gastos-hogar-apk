import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  inventoryValueLabel,
  type InventoryProductApi,
} from "@/types/inventory";
import { a11yButton } from "@/utils/accessibility";

export function InventoryProductCard({
  product,
  onPurchase,
  onConsume,
  onAdjust,
  onEditProduct,
  onDelete,
}: {
  product: InventoryProductApi;
  onPurchase: () => void;
  onConsume: () => void;
  onAdjust: () => void;
  onEditProduct: () => void;
  onDelete: () => void;
}) {
  const { border, surface } = useThemeColors();
  const [notesExpanded, setNotesExpanded] = React.useState(false);

  const notes = product.notes?.trim() ?? "";
  const hasNotes = notes.length > 0;
  const hasLongNotes = notes.length > 96;

  React.useEffect(() => {
    setNotesExpanded(false);
  }, [product.id]);

  const quantity = Number(product.stock.quantity ?? 0);
  const minThreshold = Number(product.minThreshold ?? 0);
  const reorderPoint =
    typeof product.reorderPoint === "number"
      ? Number(product.reorderPoint)
      : null;

  const reorderGap =
    typeof reorderPoint === "number"
      ? Math.max(0, Number((reorderPoint - quantity).toFixed(3)))
      : 0;

  const reorderProgress =
    typeof reorderPoint === "number" && reorderPoint > 0
      ? Math.min(1, Math.max(0, quantity / reorderPoint))
      : 0;

  const reorderStatus: "ok" | "warn" | "critical" =
    typeof reorderPoint !== "number"
      ? "ok"
      : quantity <= minThreshold
        ? "critical"
        : quantity < reorderPoint
          ? "warn"
          : "ok";

  return (
    <View
      style={[
        styles.productCard,
        {
          borderColor: String(border),
          backgroundColor: String(surface),
        },
      ]}
    >
      <View style={styles.productHeader}>
        <View style={{ flex: 1 }}>
          <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
          <ThemedText style={{ opacity: 0.75 }}>
            {product.stock.quantity} {inventoryValueLabel(product.unit)}
            {product.defaultLocation ? ` · ${product.defaultLocation}` : ""}
          </ThemedText>
          <ThemedText style={{ opacity: 0.7 }}>
            {product.expiresAt
              ? `Vence: ${new Date(product.expiresAt).toLocaleDateString()}`
              : "Sin fecha de vencimiento"}
          </ThemedText>
        </View>

        <View style={styles.flagWrap}>
          {product.flags.lowStock ? <Flag label="Bajo" tone="warning" /> : null}
          {product.flags.expiringSoon ? (
            <Flag label="Por vencer" tone="warning" />
          ) : null}
          {product.flags.expired ? (
            <Flag label="Vencido" tone="danger" />
          ) : null}
        </View>
      </View>

      {typeof reorderPoint === "number" ? (
        <View style={styles.reorderSection}>
          <View style={styles.reorderHeader}>
            <ThemedText style={styles.reorderCaption}>
              Objetivo: {reorderPoint} {inventoryValueLabel(product.unit)}
            </ThemedText>
            <ReorderStatusChip status={reorderStatus} />
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(reorderProgress * 100)}%`,
                  backgroundColor:
                    reorderStatus === "critical"
                      ? "#dc2626"
                      : reorderStatus === "warn"
                        ? "#d97706"
                        : "#16a34a",
                },
              ]}
            />
          </View>

          <ThemedText style={styles.reorderHelpText}>
            {reorderGap > 0
              ? `Te faltan ${reorderGap} ${inventoryValueLabel(
                  product.unit
                )} para llegar al objetivo`
              : "Estás en objetivo de reposición"}
          </ThemedText>
        </View>
      ) : null}

      {hasNotes ? (
        <ProductNotePreview
          note={notes}
          expanded={notesExpanded}
          canExpand={hasLongNotes}
          onToggle={() => setNotesExpanded((prev) => !prev)}
        />
      ) : null}

      <View style={styles.quickActions}>
        <ActionButton label="+ Entrada" onPress={onPurchase} />
        <ActionButton label="- Consumo" onPress={onConsume} />
        <ActionButton label="Ajuste" onPress={onAdjust} />
        <ActionButton label="Editar" onPress={onEditProduct} editable />
        <ActionButton label="Eliminar" onPress={onDelete} danger />
      </View>
    </View>
  );
}

function ProductNotePreview({
  note,
  expanded,
  canExpand,
  onToggle,
}: {
  note: string;
  expanded: boolean;
  canExpand: boolean;
  onToggle: () => void;
}) {
  const { border, text } = useThemeColors();

  return (
    <View
      style={[
        styles.noteSection,
        {
          borderColor: String(border),
        },
      ]}
    >
      <View style={styles.noteHeader}>
        <ThemedText style={styles.noteCaption}>📝 Nota</ThemedText>

        {canExpand ? (
          <Pressable
            {...a11yButton(expanded ? "Ocultar nota" : "Ver nota completa")}
            onPress={onToggle}
            hitSlop={6}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.noteToggle, { color: String(text) }]}
            >
              {expanded ? "Ver menos" : "Ver más"}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <ThemedText
        style={styles.noteText}
        numberOfLines={canExpand && !expanded ? 1 : undefined}
      >
        {note}
      </ThemedText>
    </View>
  );
}

function ReorderStatusChip({ status }: { status: "ok" | "warn" | "critical" }) {
  const config =
    status === "critical"
      ? {
          label: "Crítico",
          bg: "#fee2e2",
          fg: "#991b1b",
        }
      : status === "warn"
        ? {
            label: "Por reponer",
            bg: "#fef3c7",
            fg: "#92400e",
          }
        : {
            label: "En objetivo",
            bg: "#dcfce7",
            fg: "#166534",
          };

  return (
    <View style={[styles.reorderChip, { backgroundColor: config.bg }]}>
      <ThemedText style={{ color: config.fg, fontSize: 11 }}>
        {config.label}
      </ThemedText>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  danger,
  editable,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  editable?: boolean;
}) {
  const { border, surface, text } = useThemeColors();

  return (
    <Pressable
      {...a11yButton(label)}
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          borderColor: danger
            ? "rgba(220, 38, 38, 0.45)"
            : String(border) && editable
              ? "rgba(6, 190, 16, 0.45)"
              : String(border),
          backgroundColor: danger
            ? "rgba(248, 74, 74, 0.18)"
            : String(surface) && editable
              ? "rgba(37, 241, 47, 0.16)"
              : String(surface),
        },
      ]}
    >
      <ThemedText
        type="defaultSemiBold"
        style={{
          fontSize: 12,
          color: danger
            ? "#dc2626"
            : String(text) && editable
              ? "#07b810"
              : String(text),
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Flag({ label, tone }: { label: string; tone: "warning" | "danger" }) {
  const bg = tone === "danger" ? "#fee2e2" : "#fef3c7";
  const fg = tone === "danger" ? "#991b1b" : "#92400e";

  return (
    <View style={[styles.flag, { backgroundColor: bg }]}>
      <ThemedText style={{ color: fg, fontSize: 11 }}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginVertical: 7,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  flagWrap: {
    alignItems: "flex-end",
    gap: 4,
  },
  flag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reorderSection: {
    gap: 6,
    paddingTop: 2,
  },
  reorderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reorderCaption: {
    opacity: 0.82,
    fontSize: 12,
  },
  reorderChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(148, 163, 184, 0.28)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    minWidth: 6,
  },
  reorderHelpText: {
    opacity: 0.72,
    fontSize: 12,
  },
  noteSection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: "rgba(148, 163, 184, 0.1)",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  noteCaption: {
    opacity: 0.8,
    fontSize: 12,
  },
  noteToggle: {
    fontSize: 11,
    opacity: 0.84,
  },
  noteText: {
    opacity: 0.82,
    fontSize: 12,
    lineHeight: 17,
  },
  actionButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
