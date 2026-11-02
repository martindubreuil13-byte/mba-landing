/**
 * Inquiry storage settings and limits. The switch is OFF unless the variable is exactly "true", so a release that contains this code behaves like the
 * previous one until someone turns it on deliberately (and turning it off again restores the previous behaviour).
 */
const on = (name: string) => process.env[name] === "true";

/**
 * The ONE switch for the whole feature: accepted inquiries are stored before the owner is notified, new booking links carry the visitor's reference
 * in the URL fragment, the booking page exchanges it for their own details, and a booking made from such a link is linked to its inquiry or
 * application. Off (the default), the site behaves exactly as it did before.
 */
export const inquiryStoreEnabled = () => on("PROGRAM_INQUIRY_STORE_ENABLED");

/** Fragment links and the reference exchange are part of the same switch. */
export const refExchangeEnabled = inquiryStoreEnabled;

/** The longest an inquiry message is kept. Configurable downwards only. */
export const MAX_RETENTION_MONTHS = 24;

/** INQUIRY_RETENTION_MONTHS, clamped to 1-24; unset or unreadable means the 24-month maximum. */
export function retentionMonths(env: Record<string, string | undefined> = process.env): number {
  const n = Number.parseInt(env.INQUIRY_RETENTION_MONTHS ?? "", 10);
  if (!Number.isFinite(n)) return MAX_RETENTION_MONTHS;
  return Math.min(MAX_RETENTION_MONTHS, Math.max(1, n));
}

/** Messages created before this instant are past retention. Calendar-month arithmetic in UTC. */
export function retentionCutoff(now: number = Date.now(), months: number = retentionMonths()): Date {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

/** How long a booking reference may pre-fill the visitor's own name and e-mail. Expiry never stops an ordinary booking. */
export const REF_PREFILL_DAYS = 60;

/** The thresholds: 5 submissions/hour per client, 3 new inquiries/day per address. The global figure only raises a log warning; it never refuses anyone. */
export const INQUIRY_LIMITS = {
  client: { windowSeconds: 3600, limit: 5 },
  email: { windowSeconds: 86_400, limit: 3 },
  globalSoft: { windowSeconds: 3600, limit: 60 },
} as const;

/** A human cannot complete the form faster than this; the form's signed token must be at least this old and at most a day old. */
export const FORM_MIN_AGE_MS = 2_000;
export const FORM_MAX_AGE_MS = 24 * 3_600_000;
