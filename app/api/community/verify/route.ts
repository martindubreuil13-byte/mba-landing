import { NextResponse } from "next/server";
import { verifyCommunityOptIn } from "@/app/lib/community/verification";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Verifies the email address for the MBA community invitation. POST only: the /community/verify page explains and offers a button, so opening the link
 * (or a mail scanner's prefetch, a GET) never activates anything. The token is signed, bound to one request, expires and has its effect once
 * (see app/lib/community/verification.ts). Answers never reveal anything about the contact.
 */
export async function POST(req: Request) {
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) { try { const body = await req.json(); token = typeof body?.token === "string" ? body.token : ""; } catch { /* handled as invalid */ } }
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`community-verify:${ip}`, 3600, 30))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  try {
    const { status } = await verifyCommunityOptIn(token, { ipHash: hashEvidence(ip), userAgentHash: hashEvidence(req.headers.get("user-agent")) });
    if (status === "confirmed" || status === "already_confirmed") return NextResponse.json({ success: true, status });
    if (status === "expired") return NextResponse.json({ error: "This link has expired. Nothing has been activated. You can say yes again the next time you book a conversation." }, { status: 400 });
    if (status === "invalid") return NextResponse.json({ error: "This link is not valid." }, { status: 400 });
    // not_pending (withdrawn or never requested) and suppressed: nothing is activated, and the answer does not say which.
    return NextResponse.json({ error: "This link can no longer be used. Nothing has been activated." }, { status: 409 });
  } catch (e) {
    console.error("Community verification failed:", e instanceof Error ? e.message : "unknown error");
    return NextResponse.json({ error: "We could not confirm your email just now. Please try again." }, { status: 500 });
  }
}
