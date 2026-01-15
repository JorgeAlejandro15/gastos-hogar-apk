export type IsoRange = { from?: string; to?: string };

function startOfLocalDay(d: Date) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function endOfLocalDay(d: Date) {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

/**
 * Exact day filter in local time:
 * from = 00:00, to = 23:59:59.999, sent as ISO.
 */
export function isoRangeForExactLocalDay(day: Date): IsoRange {
  return {
    from: startOfLocalDay(day).toISOString(),
    to: endOfLocalDay(day).toISOString(),
  };
}

/**
 * Last N days (inclusive) in local time.
 */
export function isoRangeLastNDays(n: number, now: Date = new Date()): IsoRange {
  const safeN = Math.max(1, Math.floor(n));
  const end = endOfLocalDay(now);
  const start = startOfLocalDay(end);
  start.setDate(start.getDate() - (safeN - 1));
  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * Current month to today (inclusive) in local time.
 */
export function isoRangeThisMonth(now: Date = new Date()): IsoRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = endOfLocalDay(now);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function isEmptyRange(r?: IsoRange | null) {
  return !r?.from && !r?.to;
}
