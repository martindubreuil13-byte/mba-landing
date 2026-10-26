import { consentRequiredFor } from "@/app/lib/consent/regions";

export const dynamic = "force-dynamic";

/**
 * Tells the browser whether Google Analytics needs opt-in for this visitor. Reads only the country / region the hosting edge
 * already attaches to the request, returns a single boolean, stores nothing and logs nothing. Unknown location -> required.
 */
export function GET(req: Request) {
  const required = consentRequiredFor(req.headers.get("x-vercel-ip-country"), req.headers.get("x-vercel-ip-country-region"));
  return Response.json({ required }, { headers: { "Cache-Control": "no-store" } });
}
