import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { logClick, visitorKey } from "@/app/lib/pick-my-brain/queries";

const NO_INDEX = { "X-Robots-Tag": "noindex, nofollow" };
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sent with navigator.sendBeacon as the visitor follows a result, so the
// body may arrive as text/plain rather than JSON-typed.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400, headers: NO_INDEX });
  }

  const searchId = typeof body.searchId === "string" ? body.searchId : "";
  const href = typeof body.href === "string" ? body.href.slice(0, 300) : "";
  if (!UUID_REGEX.test(searchId) || !href.startsWith("/")) {
    return new NextResponse(null, { status: 400, headers: NO_INDEX });
  }

  const allowed = await checkRateLimit(visitorKey("pmb_click", getClientIp(req)), 60, 30);
  if (allowed) {
    try {
      await logClick(searchId, href);
    } catch (error) {
      console.error("Pick My Brain: failed to log click.", error);
    }
  }

  return new NextResponse(null, { status: 204, headers: NO_INDEX });
}
