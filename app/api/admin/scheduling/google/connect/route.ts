import { NextResponse } from "next/server";
import { getGoogleOAuth } from "@/app/lib/scheduling/instance";
import { adminRoute, json } from "@/app/lib/scheduling/http";

export const dynamic = "force-dynamic";

/** Start (or restart) the Google connection: sends the signed-in administrator to Google's consent screen. Safe to call again to reconnect. */
export const GET = adminRoute(async () => {
  const oauth = getGoogleOAuth();
  if (!oauth) return json({ error: "Google Calendar is in mock mode. Set SCHEDULING_GOOGLE=live (and the Google credentials) to connect a real account." }, 409);
  return NextResponse.redirect(await oauth.createAuthorizationUrl(), 302);
});
