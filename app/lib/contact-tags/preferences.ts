import { exceptionEvidence } from "@/app/lib/email-studio/campaign";

export type PreferenceRecord = { action: string; details: Record<string, string>; email: string; created_at: string };
export function activeException(rows: PreferenceRecord[], email: string, changedAt?: string | null, now = Date.now()) {
  const row = rows.find(({ action }) => action === "exception" || action === "remove");
  if (!row || row.action !== "exception" || row.email !== email ||
      (changedAt && Date.parse(row.created_at) <= Date.parse(changedAt)) ||
      !Number.isFinite(Date.parse(row.details.expiresAt)) || Date.parse(row.details.expiresAt) <= now) return null;
  const { basis, reason, evidence } = row.details;
  const parsed = exceptionEvidence.safeParse({ basis, reason, evidence });
  return parsed.success ? { ...parsed.data, expiresAt: row.details.expiresAt } : null;
}

export function preferenceLabel(state: string, reason: string) {
  if (state === "Eligible") return "Subscribed";
  if (state === "Unknown") return "Unknown";
  return reason === "Unsubscribed" ? "Unsubscribed" : "Suppressed";
}
