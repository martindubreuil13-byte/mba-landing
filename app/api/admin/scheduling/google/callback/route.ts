import { NextResponse } from "next/server";
import { GoogleOAuthError } from "@/app/lib/scheduling/adapters/google-oauth";
import { getGoogleOAuth } from "@/app/lib/scheduling/instance";
import { adminRoute, json } from "@/app/lib/scheduling/http";

export const dynamic = "force-dynamic";

const back = (req: Request, query: string) => NextResponse.redirect(new URL(`/admin/scheduling/integrations?${query}`, req.url), 302);

/** Google sends the administrator's browser back here with `code` and `state`. Requires the admin session, like every admin route. */
export const GET = adminRoute(async (req) => {
  const oauth = getGoogleOAuth();
  if (!oauth) return json({ error: "Google Calendar is in mock mode." }, 409);
  const q = new URL(req.url).searchParams;
  try {
    await oauth.completeAuthorization({ code: q.get("code"), state: q.get("state"), error: q.get("error") });
    return back(req, "google=connected");
  } catch (e) {
    // Only a short, safe reason code goes in the URL; the detail is shown from the stored status, never from a query string.
    const reason = e instanceof GoogleOAuthError ? e.code : "failed";
    if (!(e instanceof GoogleOAuthError)) console.error("Google connection failed:", e instanceof Error ? e.message : e);
    return back(req, `google=error&reason=${reason}`);
  }
});
