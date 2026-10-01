import type { DeliveryStatus } from "./types";

/**
 * Email delivery state machine. "delivered" is only ever set from a provider
 * webhook (email.delivered) — never because the send API call succeeded.
 *
 *   accepted -> queued (Resend returned an id) -> sent -> delivered
 *                                                      \-> bounced | failed
 */
const RANK: Record<DeliveryStatus, number> = {
  not_tracked: 0,
  accepted: 1,
  queued: 2,
  sent: 3,
  delivered: 4,
  failed: 5,
  bounced: 5,
};

/** Webhooks can arrive out of order; never move a request backwards. */
export function canAdvanceDelivery(current: DeliveryStatus, next: DeliveryStatus): boolean {
  if (current === next || current === "bounced") return false;
  if (next === "bounced") return true; // a late bounce can follow "delivered"
  if (next === "failed") return current !== "delivered";
  return RANK[next] > RANK[current];
}

export type ProviderEventMapping = { status: DeliveryStatus | null; complaint?: boolean };

/** Maps a Resend webhook event type to our delivery status. */
export function mapProviderEvent(type: string): ProviderEventMapping {
  switch (type) {
    case "email.sent":
      return { status: "sent" };
    case "email.delivered":
      return { status: "delivered" };
    case "email.bounced":
      return { status: "bounced" };
    case "email.failed":
    case "email.suppressed":
      return { status: "failed" };
    case "email.complained":
      // Delivered, but the recipient reported spam: treat as a suppression.
      return { status: null, complaint: true };
    default:
      return { status: null };
  }
}

export const DELIVERY_EVENT_FOR_STATUS: Partial<Record<DeliveryStatus, string>> = {
  queued: "resource_delivery_queued",
  sent: "resource_delivery_sent",
  delivered: "resource_delivery_delivered",
  bounced: "resource_delivery_bounced",
  failed: "resource_delivery_failed",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  not_tracked: "Not tracked",
  accepted: "Accepted",
  queued: "Queued with provider",
  sent: "Sent",
  delivered: "Delivered",
  bounced: "Bounced",
  failed: "Failed",
};
