import { NextResponse } from "next/server";
import { confirmOptIn } from "@/app/lib/leads/consent";
import { verifyConfirmationToken } from "@/app/lib/leads/confirmation-token";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";

/**
 * Confirms a community signup (confirmed opt-in). POST only: the /confirm page
 * shows a button, so email security scanners that merely open the link cannot
 * confirm anyone's address.
 */
export async function POST(req: Request) {
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    try {
      const body = await req.json();
      token = typeof body?.token === "string" ? body.token : "";
    } catch {
      /* fall through */
    }
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`confirm:${ip}`, 60 * 60, 30))) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const check = verifyConfirmationToken(token);
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason === "expired" ? "This confirmation link has expired. Reply to the email you received and Martin will send a new one." : "This confirmation link is invalid." },
      { status: 400 }
    );
  }

  try {
    const result = await confirmOptIn(check.leadId, { ipHash: hashEvidence(ip), userAgentHash: hashEvidence(req.headers.get("user-agent")) });

    if (result.status === "confirmed") {
      // The append-only consent_records row written by confirmOptIn is the evidence. Feature-specific
      // analytics are deliberately not recorded here.
      return NextResponse.json({ success: true, status: "confirmed" });
    }
    if (result.status === "already_confirmed") return NextResponse.json({ success: true, status: "already_confirmed" });
    if (result.status === "not_pending") {
      return NextResponse.json({ error: "This confirmation is no longer needed or was withdrawn. If you would still like to hear from Martin, you can sign up again." }, { status: 409 });
    }
    // suppressed / not_found: do not reveal why
    return NextResponse.json({ error: "This confirmation link can no longer be used." }, { status: 400 });
  } catch (error) {
    console.error("Confirmation failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "We could not confirm your email. Please try again." }, { status: 500 });
  }
}
