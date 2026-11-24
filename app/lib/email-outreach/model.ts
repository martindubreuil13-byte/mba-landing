import { z } from "zod";
import { exceptionEvidence } from "@/app/lib/email-studio/campaign";

/** Pure rules for individual outreach (one email to one person). No database, no network: everything here is unit-tested. */

/** An earlier individual email to the same address inside this window makes the admin confirm they mean to write again. */
export const RECENT_SEND_DAYS = 30;
export const MAX_DRAFT_BYTES = 400_000;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const isEmail = (value: string) => z.email().max(254).safeParse(value.trim()).success;

/** "Ada Lovelace" -> first "Ada", last "Lovelace". A name is optional; with none, the contact is stored with an empty first name and shown by email. */
export function splitName(full: string): { first: string; last: string | null } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { first: (parts[0] ?? "").slice(0, 60), last: parts.length > 1 ? parts.slice(1).join(" ").slice(0, 80) : null };
}

const oneLine = (max: number) => z.string().max(max).refine((value) => !/[\r\n]/.test(value), "Must be on one line.");

/**
 * A draft may be incomplete (no subject yet, no recipient yet), so this only enforces sizes and shape. The full send-time checks (valid address,
 * subject, supported formatting, safe links) run again, on the saved draft, when it is reviewed.
 */
export const draftInput = z.strictObject({
  id: z.uuid().optional(),
  recipientEmail: oneLine(254),
  recipientName: oneLine(120),
  leadId: z.uuid().nullable(),
  subject: oneLine(180),
  previewText: oneLine(160),
  operations: z.array(z.unknown()).max(1500),
}).refine((draft) => JSON.stringify(draft.operations).length <= MAX_DRAFT_BYTES, "The message is too large.");
export type DraftInput = z.infer<typeof draftInput>;

export type OutreachDraft = {
  id: string; recipientEmail: string; recipientName: string; leadId: string | null;
  subject: string; previewText: string; operations: unknown[]; updatedAt: string;
};

export const reviewInput = z.strictObject({
  draftId: z.uuid(),
  /** Documented basis, only when the contact has no recorded marketing permission (the same evidence the newsletter picker asks for). */
  exception: exceptionEvidence.optional(),
  /** The admin has seen that an individual email already went to this address recently. */
  acknowledgeRecent: z.literal(true).optional(),
});

export type RecentSend = { sentAt: string; subject: string };
export type ContactSummary = { id: string; name: string; email: string; state: string; reason: string; created: boolean };

type Candidate = { state: string; reason: string; administrativeException?: { basis: string; reason: string; evidence: string } | null };

export type ReviewDecision =
  | { status: "blocked"; reason: string }
  | { status: "needs_exception"; prefill: Candidate["administrativeException"] | null }
  | { status: "needs_recent_acknowledgement" }
  | { status: "ready" };

/**
 * What the admin must do before this one email can be sent, in order:
 *  1. A contact that cannot be mailed at all (unsubscribed, suppressed, bounced, archived) is blocked. There is no override.
 *  2. A contact with no recorded marketing permission needs a documented basis and evidence (the existing documented-exception rule).
 *  3. An earlier individual email to the same address recently needs an explicit "yes, write again".
 * `recipientCount` is how many recipients survived the shared eligibility review (0 or 1).
 */
export function decideReview(input: {
  candidate: Candidate | null; recipientCount: number; exclusionReason: string | null;
  hasException: boolean; recent: RecentSend[]; acknowledgeRecent: boolean;
}): ReviewDecision {
  const { candidate } = input;
  if (!candidate) return { status: "blocked", reason: input.exclusionReason ?? "Archived or unavailable" };
  if (candidate.state === "Unknown" && !input.hasException) return { status: "needs_exception", prefill: candidate.administrativeException ?? null };
  if (input.recipientCount === 0) return { status: "blocked", reason: input.exclusionReason ?? candidate.reason };
  if (input.recent.length > 0 && !input.acknowledgeRecent) return { status: "needs_recent_acknowledgement" };
  return { status: "ready" };
}

/** The draft's label in lists: the person if known, else the address, else a placeholder. */
export function draftLabel(draft: Pick<OutreachDraft, "recipientEmail" | "recipientName" | "subject">) {
  const who = draft.recipientName.trim() || draft.recipientEmail.trim() || "No recipient yet";
  return { who, subject: draft.subject.trim() || "No subject yet" };
}

/** Has the working copy changed since it was last saved? Used to warn before navigating away from unsaved work. */
export function isDirty(a: Omit<DraftInput, "id" | "leadId">, b: Omit<DraftInput, "id" | "leadId">) {
  return a.recipientEmail !== b.recipientEmail || a.recipientName !== b.recipientName || a.subject !== b.subject
    || a.previewText !== b.previewText || JSON.stringify(a.operations) !== JSON.stringify(b.operations);
}

/** What the review step answers (see /api/admin/email/outreach). `campaignId` is set only when the email is ready to be confirmed and sent. */
export type ReviewResponse = {
  contact: ContactSummary; recent: RecentSend[]; subject: string; previewText: string; html: string; from: string;
  exceptionCount: number; campaignId: string | null;
} & ReviewDecision;

/** What happened to the one email of an individual send ("none" means no delivery was attempted, for example the review had expired). */
export type DeliveryResult = { status: "attempting" | "sent" | "failed" | "unknown" | "excluded" | "none"; reason: string | null; providerAccepted: boolean };
