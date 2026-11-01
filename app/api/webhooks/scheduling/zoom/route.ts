import { createHash } from "node:crypto";
import { verifyZoomSignature, zoomChallengeResponse } from "@/app/lib/scheduling/adapters/webhooks";
import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, webhookRoute } from "@/app/lib/scheduling/http";

export const dynamic = "force-dynamic";

/**
 * Zoom event subscriptions. Needs SCHEDULING_ZOOM_WEBHOOK_SECRET (the app's "Secret Token"); without it every call is refused (503), and an
 * unsigned or stale request is refused (401). Handled: the endpoint-validation challenge, and meeting.deleted (the host removed a meeting by
 * hand: the booking stands and the meeting is recreated). Everything else is acknowledged and ignored.
 */
export const POST = webhookRoute(async (req) => {
  const secret = process.env.SCHEDULING_ZOOM_WEBHOOK_SECRET;
  if (!secret) return json({ error: "Webhook not configured" }, 503);
  const raw = await req.text();
  if (!verifyZoomSignature({ secret, timestamp: req.headers.get("x-zm-request-timestamp"), signature: req.headers.get("x-zm-signature"), rawBody: raw })) return json({ error: "Invalid signature" }, 401);
  let event: { event?: string; payload?: { plainToken?: string; object?: { id?: number | string } } };
  try { event = JSON.parse(raw); } catch { return json({ error: "Invalid body" }, 400); }
  if (event.event === "endpoint.url_validation" && event.payload?.plainToken) return json(zoomChallengeResponse(secret, event.payload.plainToken));
  // A verified delivery is claimed, processed, and only then marked processed. If processing fails the response is 5xx and Zoom's retry (same body) runs the
  // effect again; only a delivery that was processed counts as a replay. The key is the body itself: a retry may carry a fresh timestamp and signature.
  const key = createHash("sha256").update(raw).digest("hex");
  const svc = getScheduling();
  const out = await svc.handleWebhook("zoom", key, async () => {
    if (event.event === "meeting.deleted" && event.payload?.object?.id !== undefined) return { handled: await svc.onExternalDeleted("zoom", String(event.payload.object.id)) };
    return null;
  });
  if (out.status === "duplicate") return json({ ok: true, duplicate: true });
  if (out.status === "busy") return json({ ok: false, retry: true }, 503);
  return json(out.result ? { ok: true, handled: out.result.handled } : { ignored: true });
});
