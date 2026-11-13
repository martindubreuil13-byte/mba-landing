export const REVIEW_LABELS = {
  new: "New",
  reviewed: "Reviewed",
  follow_up: "Follow-up Needed",
  closed: "Closed",
} as const;

export type ReviewState = keyof typeof REVIEW_LABELS;

export function isReviewState(value: unknown): value is ReviewState {
  return typeof value === "string" && Object.hasOwn(REVIEW_LABELS, value);
}

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function taskDateState(due: string | null, completed: string | null, today: string) {
  if (completed) return "Completed";
  if (!due) return "No due date";
  if (due < today) return "Overdue";
  return due === today ? "Due today" : "Upcoming";
}

export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function workspaceToday(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone, dateStyle: "short" }).format(now);
}

export function workspaceStamp(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(iso));
}

export function inquiryHref(id: string) {
  return "/admin/inquiries?inquiry=" + encodeURIComponent(id) + "#inquiry:" + encodeURIComponent(id);
}

export type ExceptionState = "Recovering" | "Action Required" | "Resolved";

export function mailException(current: {
  status: string; delivery_status: string | null; kind: string;
}, earlierFailure: boolean, retryScheduled: boolean): ExceptionState | null {
  if (current.delivery_status === "bounced" || current.delivery_status === "failed") return "Action Required";
  if (current.status === "failed") return retryScheduled && current.kind !== "confirmation_resend" ? "Recovering" : "Action Required";
  return earlierFailure && current.status === "accepted" ? "Resolved" : null;
}
