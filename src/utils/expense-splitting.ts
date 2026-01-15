// File: src/utils/expense-splitting.ts — Lógica de división de gastos entre miembros.

import type { ExpenseItemApi } from "@/api/expenses-api";

export type SplitMember = {
  userId: string;
  displayName: string;
};

/**
 * Pesos (participación) por usuario.
 * - 1 = participación estándar
 * - 2 = doble participación
 * - 0 = excluido de la división
 */
export type SplitWeights = Record<string, number | undefined>;

export type SplitConfig = {
  /**
   * Miembros del hogar que participan en la división.
   * Nota: en Fase 1 asumimos división igualitaria entre todos.
   */
  members: SplitMember[];

  /**
   * Si es true, ignora gastos sin pagador (defensivo ante datos incompletos).
   */
  ignoreMissingPayer?: boolean;

  /**
   * Máximo de items a procesar (protección para rangos enormes).
   */
  maxItems?: number;
};

export type MemberPosition = {
  userId: string;
  displayName: string;
  paid: number;
  owed: number;
  net: number; // paid - owed
};

export type Settlement = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
};

function round2(n: number): number {
  // Evita ruido de punto flotante típico al sumar muchos items.
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function clampWeight(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function getMemberWeight(userId: string, weights?: SplitWeights): number {
  const raw = weights?.[userId];
  if (typeof raw !== "number") return 1;
  return clampWeight(raw);
}

function totalWeight(members: SplitMember[], weights?: SplitWeights): number {
  return members.reduce(
    (acc, m) => acc + getMemberWeight(m.userId, weights),
    0
  );
}

/**
 * Calcula posiciones netas asumiendo división igualitaria.
 *
 * Intención:
 * - Cada gasto lo paga 1 persona (payer) y beneficia a TODOS los miembros.
 * - Cada miembro debe $amount / N$.
 * - La posición neta es: $net = paid - owed$.
 */
export function computeEvenSplitPositions(
  expenses: ExpenseItemApi[],
  cfg: SplitConfig
): {
  positions: MemberPosition[];
  processedItems: number;
  skippedItems: number;
} {
  const members = cfg.members;
  const maxItems = cfg.maxItems ?? Infinity;

  const byId = new Map<string, MemberPosition>();
  for (const m of members) {
    byId.set(m.userId, {
      userId: m.userId,
      displayName: m.displayName,
      paid: 0,
      owed: 0,
      net: 0,
    });
  }

  if (members.length === 0) {
    return { positions: [], processedItems: 0, skippedItems: expenses.length };
  }

  let processed = 0;
  let skipped = 0;

  for (const e of expenses) {
    if (processed >= maxItems) break;

    const payerId = e.payer?.id ?? null;
    const amount = Number(e.total ?? e.amount ?? 0);

    // Defensivo: si amount no es usable, lo ignoramos.
    if (!Number.isFinite(amount) || amount <= 0) {
      skipped++;
      continue;
    }

    // Si no hay pagador, no podemos imputar "paid" a nadie.
    if (!payerId) {
      if (!cfg.ignoreMissingPayer) skipped++;
      continue;
    }

    // Si el pagador no está dentro de los miembros (ej: invitado eliminado), lo ignoramos.
    const payerPos = byId.get(payerId);
    if (!payerPos) {
      skipped++;
      continue;
    }

    const share = amount / members.length;

    payerPos.paid = round2(payerPos.paid + amount);

    // Todos los miembros deben su parte.
    for (const m of members) {
      const pos = byId.get(m.userId);
      if (!pos) continue;
      pos.owed = round2(pos.owed + share);
    }

    processed++;
  }

  const positions = Array.from(byId.values()).map((p) => {
    const net = round2(p.paid - p.owed);
    return { ...p, net };
  });

  // Ordena para UX: acreedores arriba, deudores abajo.
  positions.sort((a, b) => b.net - a.net);

  return { positions, processedItems: processed, skippedItems: skipped };
}

/**
 * Calcula posiciones netas con división ponderada por usuario.
 *
 * Intención:
 * - Permite que cada miembro tenga distinta "participación" (peso).
 * - Si un miembro tiene peso 0, queda excluido de la división.
 */
export function computeWeightedSplitPositionsFromHistory(
  expenses: ExpenseItemApi[],
  cfg: SplitConfig,
  weights?: SplitWeights
): {
  positions: MemberPosition[];
  processedItems: number;
  skippedItems: number;
  totalWeights: number;
} {
  const members = cfg.members;
  const maxItems = cfg.maxItems ?? Infinity;

  const byId = new Map<string, MemberPosition>();
  for (const m of members) {
    byId.set(m.userId, {
      userId: m.userId,
      displayName: m.displayName,
      paid: 0,
      owed: 0,
      net: 0,
    });
  }

  const wTotal = totalWeight(members, weights);
  if (members.length === 0 || wTotal <= 0) {
    return {
      positions: Array.from(byId.values()),
      processedItems: 0,
      skippedItems: expenses.length,
      totalWeights: wTotal,
    };
  }

  let processed = 0;
  let skipped = 0;

  for (const e of expenses) {
    if (processed >= maxItems) break;

    const payerId = e.payer?.id ?? null;
    const amount = Number(e.total ?? e.amount ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      skipped++;
      continue;
    }

    if (!payerId) {
      if (!cfg.ignoreMissingPayer) skipped++;
      continue;
    }

    const payerPos = byId.get(payerId);
    if (!payerPos) {
      skipped++;
      continue;
    }

    payerPos.paid = round2(payerPos.paid + amount);

    // Cada miembro debe según su participación.
    for (const m of members) {
      const w = getMemberWeight(m.userId, weights);
      if (w <= 0) continue;
      const pos = byId.get(m.userId);
      if (!pos) continue;
      pos.owed = round2(pos.owed + (amount * w) / wTotal);
    }

    processed++;
  }

  const positions = Array.from(byId.values()).map((p) => {
    const net = round2(p.paid - p.owed);
    return { ...p, net };
  });

  positions.sort((a, b) => b.net - a.net);

  return {
    positions,
    processedItems: processed,
    skippedItems: skipped,
    totalWeights: wTotal,
  };
}

/**
 * Modo rápido: calcula posiciones usando totales agregados (sin iterar gastos individuales).
 *
 * Útil cuando el rango es grande y no queremos descargar miles de items.
 */
export function computeWeightedSplitPositionsFromTotals({
  members,
  paidByUserId,
  totalAmount,
  weights,
}: {
  members: SplitMember[];
  paidByUserId: Record<string, number | undefined>;
  totalAmount: number;
  weights?: SplitWeights;
}): { positions: MemberPosition[]; totalWeights: number } {
  const wTotal = totalWeight(members, weights);
  const safeTotal = Number.isFinite(totalAmount) ? totalAmount : 0;

  const positions: MemberPosition[] = members.map((m) => {
    const paid = round2(Number(paidByUserId[m.userId] ?? 0));
    const w = getMemberWeight(m.userId, weights);
    const owed = wTotal > 0 ? round2((safeTotal * w) / wTotal) : 0;
    const net = round2(paid - owed);
    return { userId: m.userId, displayName: m.displayName, paid, owed, net };
  });

  positions.sort((a, b) => b.net - a.net);
  return { positions, totalWeights: wTotal };
}

/**
 * Genera transferencias sugeridas para "saldar" entre deudores y acreedores.
 *
 * Nota:
 * - Esto NO es una optimización financiera; es un algoritmo voraz simple.
 * - Produce un conjunto de pagos que cubre la mayoría de casos de forma clara.
 */
export function computeSettlements(
  positions: MemberPosition[],
  epsilon = 0.01
): Settlement[] {
  const creditors = positions
    .filter((p) => p.net > epsilon)
    .map((p) => ({ ...p }));

  const debtors = positions
    .filter((p) => p.net < -epsilon)
    .map((p) => ({ ...p, net: Math.abs(p.net) })); // net = deuda positiva

  const settlements: Settlement[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];

    const pay = Math.min(d.net, c.net);
    const amount = round2(pay);

    if (amount > epsilon) {
      settlements.push({
        fromUserId: d.userId,
        fromName: d.displayName,
        toUserId: c.userId,
        toName: c.displayName,
        amount,
      });
    }

    d.net = round2(d.net - pay);
    c.net = round2(c.net - pay);

    if (d.net <= epsilon) i++;
    if (c.net <= epsilon) j++;
  }

  return settlements;
}
