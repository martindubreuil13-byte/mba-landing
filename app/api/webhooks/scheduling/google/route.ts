import { verifyGoogleChannelToken } from "@/app/lib/scheduling/adapters/webhooks";
import { getScheduling } from "@/app/lib/scheduling/instance";
import { json, webhookRoute } from "@/app/lib/scheduling/http";

export const dynamic = "force-dynamic";

/**
 * Google Calendar push notifications. The channel is created with a shared token (SCHEDULING_GOOGLE_CHANNEL_TOKEN) that Google echoes in
 * X-Goog-Channel-Token; anything without it is refused. Availability is read live from Google at booking time, so a notification needs no
 * action here beyond being acknowledged (Google retries unacknowledged ones). Reconciling events edited in Google is a Phase 2B item.
 */
export const POST = webhookRoute(async (req) => {
  const token = process.env.SCHEDULING_GOOGLE_CHANNEL_TOKEN;
  if (!token) return json({ error: "Webhook not configured" }, 503);
  if (!verifyGoogleChannelToken(token, req.headers.get("x-goog-channel-token"))) return json({ error: "Invalid token" }, 401);
  const channel = req.headers.get("x-goog-channel-id"), message = req.headers.get("x-goog-message-number");
  const state = req.headers.get("x-goog-resource-state") ?? "unknown";
  if (channel && message) {
    const out = await getScheduling().handleWebhook("google", `${channel}:${message}`, async () => state);
    if (out.status === "duplicate") return json({ ok: true, duplicate: true });
    if (out.status === "busy") return json({ ok: false, retry: true }, 503);
  }
  return json({ ok: true, state });
});
