import { NextResponse } from "next/server";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { getConsentCopy } from "@/app/lib/resources/consent-copy";
import { requestRejoin } from "@/app/lib/resources/member-access";
import { validateEmail } from "@/app/lib/resources/validation";

const REJOIN_CONSENT_ID = "membership-rejoin-v1.0";

/**
 * The explicit rejoin flow for people who unsubscribed. Separate from every resource form on purpose: a standard form
 * never reactivates an unsubscribed address. Rejoining is only a REQUEST; membership resumes when the recipient presses
 * the button on the confirmation page (POST), like any other signup.
 *
 * The answer is identical for every address (unknown, active, pending, unsubscribed, suppressed), so this endpoint
 * cannot be used to learn anything about an address. Rate-limited per connection and per address.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.trim() !== "") return NextResponse.json({ success: true, state: "check_inbox" });

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`rejoin:${ip}`, 30 * 60, 6))) {
    return NextResponse.json({ error: "Too many attempts from this connection. Please wait a little while and try again." }, { status: 429 });
  }
  const emailCheck = validateEmail(body.email);
  if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.message, fieldErrors: { email: emailCheck.message } }, { status: 400 });

  const consent = getConsentCopy(REJOIN_CONSENT_ID);
  if (!consent || body.consentVersion !== consent.id) {
    return NextResponse.json({ error: "This form is out of date. Please reload the page and try again." }, { status: 409 });
  }
  if (!(await checkRateLimit(`rejoin_email:${hashEvidence(emailCheck.email)}`, 60 * 60, 2))) {
    return NextResponse.json({ error: "That address has already been used a few times. Check your inbox, or try again in an hour." }, { status: 429 });
  }

  try {
    const outcome = await requestRejoin({
      email: emailCheck.email,
      consent,
      evidence: { ipHash: hashEvidence(ip), userAgentHash: hashEvidence(req.headers.get("user-agent")) },
      pageUrl: "/rejoin",
    });
    if (outcome === "email_failed") return NextResponse.json({ error: "We could not send the email just now. Please try again in a moment." }, { status: 502 });
  } catch (error) {
    console.error("Rejoin request failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Something went wrong on our side. Please try again in a moment." }, { status: 500 });
  }
  return NextResponse.json({ success: true, state: "check_inbox" });
}
