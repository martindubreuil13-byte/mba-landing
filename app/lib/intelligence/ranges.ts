/**
 * Date ranges for Website Intelligence. Everything is UTC so a "day" means the same thing in the database, the cron
 * rollup and the admin. Ranges are half-open [from, to): `to` is the start of the day AFTER the last day shown.
 */
export const RANGE_PRESETS = ["today", "yesterday", "7d", "30d", "90d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export type ResolvedRange = {
  key: RangePreset | "custom";
  label: string;
  from: Date;
  to: Date;
  /** Number of whole UTC days covered. */
  days: number;
  /** The immediately preceding period of equal length. */
  previous: { from: Date; to: Date };
  /** True when the range includes the current, still-incomplete UTC day. */
  includesToday: boolean;
};

const DAY = 86_400_000;
const MAX_CUSTOM_DAYS = 366;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export const startOfUtcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function parseDay(value: string | undefined): Date | null {
  if (!value || !ISO_DAY.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || isoDay(d) !== value ? null : d;
}

function build(key: ResolvedRange["key"], label: string, from: Date, to: Date, now: Date): ResolvedRange {
  const days = Math.round((to.getTime() - from.getTime()) / DAY);
  return {
    key,
    label,
    from,
    to,
    days,
    previous: { from: new Date(from.getTime() - days * DAY), to: from },
    includesToday: to.getTime() > startOfUtcDay(now).getTime(),
  };
}

/** Invalid, inverted or oversized input falls back to the last 30 days rather than erroring. */
export function resolveRange(params: { range?: string; from?: string; to?: string }, now = new Date()): ResolvedRange {
  const today = startOfUtcDay(now);
  const tomorrow = new Date(today.getTime() + DAY);
  const last = (n: number) => new Date(tomorrow.getTime() - n * DAY);

  const from = parseDay(params.from);
  const to = parseDay(params.to);
  if (from && to && to >= from) {
    const end = new Date(to.getTime() + DAY);
    const days = Math.round((end.getTime() - from.getTime()) / DAY);
    if (days <= MAX_CUSTOM_DAYS && from <= today) {
      return build("custom", `${isoDay(from)} → ${isoDay(to)}`, from, end > tomorrow ? tomorrow : end, now);
    }
  }
  switch (params.range) {
    case "today":
      return build("today", PRESET_LABELS.today, today, tomorrow, now);
    case "yesterday":
      return build("yesterday", PRESET_LABELS.yesterday, new Date(today.getTime() - DAY), today, now);
    case "7d":
      return build("7d", PRESET_LABELS["7d"], last(7), tomorrow, now);
    case "90d":
      return build("90d", PRESET_LABELS["90d"], last(90), tomorrow, now);
    default:
      return build("30d", PRESET_LABELS["30d"], last(30), tomorrow, now);
  }
}

/** Percentage change vs. the previous period; null when there is no previous value to compare with (never invented). */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** Rate as a percentage string; "—" when the denominator is zero (not 0%). */
export function formatRate(numerator: number, denominator: number): string {
  return denominator > 0 ? `${((numerator / denominator) * 100).toFixed(1)}%` : "—";
}
