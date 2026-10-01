import { NextResponse } from "next/server";
import { applyOptOut } from "@/app/lib/leads/consent";
import { verifyUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";

/**
 * Neutral unsubscribe for every Modern Business Architect email.
 *  - POST JSON { token }                         (the /unsubscribe page button)
 *  - POST ?token=… with form body                (RFC 8058 one-click, List-Unsubscribe-Post)
 * GET never changes anything, so link scanners cannot unsubscribe anyone.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("token") ?? "";

  if (!token) {
    try {
      const body = await req.json();
      token = typeof body?.token === "string" ? body.token : "";
    } catch {
      /* fall through to invalid */
    }
  }

  const leadId = verifyUnsubscribeToken(token);
  if (!leadId) return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 });

  try {
    const result = await applyOptOut(leadId, { method: "unsubscribe_link", wordingVersion: "unsubscribe-v1" });
    if (result === "not_found") return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 404 });
    return NextResponse.json({ success: true, alreadyUnsubscribed: result === "already_opted_out" });
  } catch (error) {
    console.error("Unsubscribe failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "We could not update your preference. Please try again." }, { status: 500 });
  }
}
