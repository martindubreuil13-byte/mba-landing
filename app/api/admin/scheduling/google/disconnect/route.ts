import { getGoogleOAuth } from "@/app/lib/scheduling/instance";
import { adminRoute, json } from "@/app/lib/scheduling/http";

export const dynamic = "force-dynamic";

/** Revoke the Google grant and forget the stored token. Existing bookings and their calendar events are not touched. */
export const POST = adminRoute(async () => {
  const oauth = getGoogleOAuth();
  if (!oauth) return json({ error: "Google Calendar is in mock mode." }, 409);
  await oauth.disconnect();
  return json({ success: true });
});
