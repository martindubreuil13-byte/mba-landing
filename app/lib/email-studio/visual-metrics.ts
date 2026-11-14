export function reachMetrics(recipients: { id: string; delivery?: { status: string; provider_block?: string | null } }[],
  events: { lead_id: string; event_type: string }[]) {
  const accepted = recipients.filter(({ delivery }) => delivery?.status === "sent");
  const types = new Map<string, Set<string>>();
  for (const event of events) {
    if (!types.has(event.lead_id)) types.set(event.lead_id, new Set());
    types.get(event.lead_id)!.add(event.event_type);
  }
  let delivered = 0;
  let rejected = 0;
  for (const { id, delivery } of accepted) {
    const recorded = types.get(id);
    if (delivery?.provider_block === "email.bounced" || delivery?.provider_block === "email.suppressed" ||
        recorded?.has("email.bounced") || recorded?.has("email.suppressed")) rejected++;
    else if (recorded?.has("email.delivered")) delivered++;
    else if (recorded?.has("email.failed")) rejected++;
  }
  return { accepted: accepted.length, delivered, rejected, unconfirmed: accepted.length - delivered - rejected };
}

export function bookingConversion(bookings: number | undefined, uniqueCopies: number | undefined) {
  // A forwarded copy can lead to multiple bookings, so this is a ratio, not a person-level funnel.
  return bookings !== undefined && uniqueCopies ? bookings / uniqueCopies : null;
}
