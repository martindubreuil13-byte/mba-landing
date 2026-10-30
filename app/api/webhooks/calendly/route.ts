import { NextResponse } from "next/server";
import { applyCalendlyEvent, parseCalendlyEvent, verifyCalendlySignature } from "@/app/lib/programs/calendly";

/**
 * Calendly webhook (events `invitee.created` and `invitee.canceled`) → verified bookings for Transition applications.
 *
 * Needs CALENDLY_WEBHOOK_SIGNING_KEY: the `signing_key` supplied when the webhook subscription is created through
 * Calendly's API (webhooks are a paid-plan Calendly feature). Without it this endpoint refuses everything and no booking
 * is ever recorded: nothing is marked as booked on faith.
 *
 * Events that match no application (the same Calendly event type is booked from other pages) are acknowledged and ignored.
 * A processing failure returns 500 so Calendly retries; repeated deliveries are harmless (see applyCalendlyEvent).
 */
export async function POST(req: Request) {
  const key = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const rawBody = await req.text();
  if (!verifyCalendlySignature({ key, header: req.headers.get("calendly-webhook-signature"), rawBody })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const event = parseCalendlyEvent(body);
  if (!event) return NextResponse.json({ ignored: true });

  try {
    const result = await applyCalendlyEvent(event);
    return NextResponse.json(result.matched ? { ok: true, duplicate: !!result.duplicate } : { ignored: true });
  } catch (e) {
    console.error("Calendly booking event failed:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "Could not record the booking." }, { status: 500 });
  }
}
