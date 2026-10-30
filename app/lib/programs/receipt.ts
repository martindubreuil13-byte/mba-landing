import "server-only";
import { introBookingUrl } from "@/app/lib/booking";
import { listInvitationSends, summarizeInvitation } from "./invitation";
import type { CommunityState } from "./community";

/**
 * What the confirmation screen needs, and nothing more: it contains no name, email, answers or application id.
 * `receiptToken` is the capability that lets the browser ask for this again after a refresh; it is never put in a URL.
 */
export type Receipt = { receiptToken: string; bookingUrl: string; invitationEmail: "sent" | "not_sent"; community: CommunityState | null };

type ReceiptApplication = { id: string; receipt_token: string; booking_ref: string | null; community_choice?: string | null };

/** `invitationSent` is passed by the request that just attempted the send; a later request reads the stored attempt log. */
export async function buildReceipt(application: ReceiptApplication, invitationSent?: boolean): Promise<Receipt> {
  let sent = invitationSent;
  if (sent === undefined) {
    const state = summarizeInvitation(await listInvitationSends([application.id]).catch(() => [])).state;
    sent = state === "sent" || state === "resent";
  }
  return { receiptToken: application.receipt_token, bookingUrl: introBookingUrl(application.booking_ref), invitationEmail: sent ? "sent" : "not_sent", community: (application.community_choice as CommunityState | null) ?? null };
}
