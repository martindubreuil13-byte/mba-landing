import type { SchedulingRepository } from "./repository";
import type { EmailProvider } from "./providers";
import type { Booking } from "./types";
import { recoveryHealth } from "./recovery-health";
import { createHash } from "node:crypto";

/**
 * Unattended alerting. A scheduled call evaluates the same aggregate health the monitor endpoint reports (plus uncertain Zoom creations and bounced
 * guest email for appointments that are close), and tells the owner by email: once when a problem appears or changes, again every six hours while it
 * lasts, and once when it clears. The message carries counts and where to look, never a guest's name, address, booking reference or any credential.
 * Runs on the server (Supabase cron calling the application); nothing depends on any person's computer.
 */
export const ALERT_REMIND_MS = 6 * 3_600_000;
const UPCOMING_MS = 7 * 86_400_000;

export type Finding = { code: string; text: string };
export type AlertState = { signature: string; sentAt: string | null };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function alertFindings(i: { bookings: Booking[]; pulse: Parameters<typeof recoveryHealth>[1]; bouncedUpcoming: number; now: number }): Finding[] {
  const h = recoveryHealth(i.bookings, i.pulse, i.now);
  const out: Finding[] = [];
  if (!h.checks.heartbeat) out.push({ code: "worker-stalled", text: "The recovery worker has not run in the last five minutes, so nothing is being synchronised, retried or cleaned up." });
  // Overdue scans are a consequence of a stalled worker, not a second problem: report them only while the worker itself is running.
  if (h.checks.heartbeat && !h.checks.zoomScan) out.push({ code: "zoom-scan-overdue", text: "The Zoom reconciliation scan is overdue." });
  if (h.checks.heartbeat && !h.checks.calendarScan) out.push({ code: "calendar-scan-overdue", text: "The calendar conflict scan is overdue." });
  if (h.attention.failed) out.push({ code: "sync-failed", text: `${plural(h.attention.failed, "booking has", "bookings have")} stopped synchronising and need${h.attention.failed === 1 ? "s" : ""} attention.` });
  if (h.attention.overdue) out.push({ code: "sync-overdue", text: `${plural(h.attention.overdue, "booking is", "bookings are")} overdue for synchronisation.` });
  if (h.attention.approachingWithoutLink) out.push({ code: "no-zoom-link", text: `${plural(h.attention.approachingWithoutLink, "appointment starts", "appointments start")} within 24 hours without a Zoom link.` });
  if (h.attention.canceledCleanup) out.push({ code: "cancel-cleanup", text: `${plural(h.attention.canceledCleanup, "canceled booking still has", "canceled bookings still have")} Zoom or calendar cleanup outstanding.` });
  const uncertain = i.bookings.filter((b) => b.zoom.uncertainSince && !b.zoom.joinUrl).length;
  if (uncertain) out.push({ code: "zoom-uncertain", text: `${plural(uncertain, "Zoom creation has", "Zoom creations have")} an unknown outcome and need${uncertain === 1 ? "s" : ""} your decision. Nothing is created again until you decide.` });
  if (i.bouncedUpcoming) out.push({ code: "email-bounced", text: `${plural(i.bouncedUpcoming, "upcoming booking has", "upcoming bookings have")} a guest email that bounced or failed, so the guest may not have their details.` });
  return out;
}

export const signatureOf = (findings: Finding[]) => findings.map((f) => f.code).sort().join(",");

/** What to do now: announce a new or changed problem, remind about a standing one, announce recovery, or stay quiet. */
export function decideAlert(findings: Finding[], state: AlertState, now: number): "alert" | "recovered" | null {
  const signature = signatureOf(findings);
  if (findings.length) return signature !== state.signature || !state.sentAt || now - Date.parse(state.sentAt) >= ALERT_REMIND_MS ? "alert" : null;
  return state.signature ? "recovered" : null;
}

export function composeAlert(kind: "alert" | "recovered", findings: Finding[], adminUrl: string | null | undefined, now: number): { subject: string; text: string } {
  const when = new Date(now).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const where = adminUrl || "the Scheduling admin pages";
  if (kind === "recovered") return { subject: "MBA Scheduling: recovered", text: `Everything MBA Scheduling was reporting is healthy again (${when}).\n\nNothing further is needed. Check ${where} if you want to confirm.\n` };
  return {
    subject: `MBA Scheduling needs attention: ${findings[0].code === "worker-stalled" ? "recovery worker stalled" : plural(findings.length, "issue", "issues")}`,
    text: [
      `MBA Scheduling reported the following at ${when}:`, "",
      ...findings.map((f) => `- ${f.text}`), "",
      `Open ${where} (Integrations and Bookings, "Needs attention") to see which bookings are affected.`,
      "A Zoom creation with an unknown outcome is never retried automatically: check Zoom for the marker shown in the booking, then choose how to resolve it.",
      "", "You will be reminded every six hours while this continues, and told once when it clears.", "This message contains no guest details.", "",
    ].join("\n"),
  };
}

type Deps = { repo: SchedulingRepository; email: EmailProvider; now: () => number; adminUrl?: string | null };

export async function runAlertCheck(d: Deps): Promise<{ findings: number; sent: "alert" | "recovered" | null; unavailable?: true }> {
  const now = d.now();
  const [bookings, pulse, state] = await Promise.all([d.repo.listBookings(), d.repo.getLastSweep(), d.repo.getAlertState()]);
  const close = bookings.filter((b) => b.status === "confirmed" && Date.parse(b.startUtc) >= now && Date.parse(b.startUtc) < now + UPCOMING_MS);
  const bounced = (await Promise.all(close.map(async (b) => (await d.repo.listEmailAttempts(b.id)).some((a) => !a.kind.startsWith("owner_") && (a.deliveryStatus === "bounced" || a.deliveryStatus === "failed")))))
    .filter(Boolean).length;
  const findings = alertFindings({ bookings, pulse, bouncedUpcoming: bounced, now });
  const decision = decideAlert(findings, state, now);
  if (!decision) return { findings: findings.length, sent: null };
  if (!d.email.alert) return { findings: findings.length, sent: null, unavailable: true };
  const message = composeAlert(decision, findings, d.adminUrl, now);
  const signature = signatureOf(findings);
  // The provider remembers this key for 24 hours: a retry of the same notice (same problem, same six-hour period) cannot send it twice.
  const idempotencyKey = `sched-alert/${decision}/${createHash("sha256").update(signature).digest("hex").slice(0, 16)}/${Math.floor(now / ALERT_REMIND_MS)}`;
  await d.email.alert({ ...message, idempotencyKey });
  await d.repo.setAlertState(decision === "alert" ? signature : "", new Date(now).toISOString());
  return { findings: findings.length, sent: decision };
}
