import { NextResponse } from "next/server";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { getConsentCopy } from "@/app/lib/resources/consent-copy";
import { getResourceConfig } from "@/app/lib/resources/config";
import { CTA_LOCATIONS, SESSION_ID_PATTERN } from "@/app/lib/resources/events";
import { deviceTypeFromUserAgent } from "@/app/lib/resources/event-store";
import { requestMemberAccess } from "@/app/lib/resources/member-access";
import { getPublishedResourceBySlug } from "@/app/lib/resources/queries";
import { validateEmail } from "@/app/lib/resources/validation";

// Sends an email on success, so it is tighter than the analytics endpoint.
const IP_WINDOW_SECONDS = 30 * 60;
const IP_MAX_REQUESTS = 10;
const EMAIL_WINDOW_SECONDS = 60 * 60;
const EMAIL_MAX_REQUESTS = 3;

function clean(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || null;
}

/**
 * Generic member-access request for ANY configured resource ("public layer + free-member layer").
 *
 * The response is the same for every address and every state: { success: true, state: "check_inbox" }. It never
 * contains a download URL, a request id, or anything that says whether the address is new, pending, a confirmed
 * member, unsubscribed or suppressed. What actually happens (confirmation email, benefit email, or nothing) is
 * decided server-side by the member-access service. Only an email PROVIDER failure is reported as an error.
 *
 * No email address is ever logged; errors log only a generic message.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: real visitors never fill this in. Pretend success, store nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true, state: "check_inbox" });
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`member_access:${ip}`, IP_WINDOW_SECONDS, IP_MAX_REQUESTS))) {
    return NextResponse.json({ error: "Too many attempts from this connection. Please wait a little while and try again." }, { status: 429 });
  }

  const emailCheck = validateEmail(body.email);
  if (!emailCheck.ok) {
    return NextResponse.json({ error: emailCheck.message, fieldErrors: { email: emailCheck.message } }, { status: 400 });
  }

  const slug = clean(body.slug, 200);
  const config = slug ? getResourceConfig(slug) : null;
  const resource = slug ? await getPublishedResourceBySlug(slug) : null;
  if (!slug || !config || !resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const consent = getConsentCopy(config.access.consentCopyId);
  if (!consent || body.consentVersion !== consent.id) {
    // The page was loaded with different wording than the server now holds (or it predates the member-access release).
    return NextResponse.json({ error: "This form is out of date. Please reload the page and try again." }, { status: 409 });
  }

  const ctaLocation = clean(body.ctaLocation, 20);
  if (!ctaLocation || !(CTA_LOCATIONS as readonly string[]).includes(ctaLocation)) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  // Counted for every address alike (including ones that will be ignored), so it cannot be used to probe states.
  if (!(await checkRateLimit(`member_access_email:${hashEvidence(emailCheck.email)}`, EMAIL_WINDOW_SECONDS, EMAIL_MAX_REQUESTS))) {
    return NextResponse.json({ error: "That address has already been used a few times. Check your inbox, or try again in an hour." }, { status: 429 });
  }

  const sessionId = typeof body.sessionId === "string" && SESSION_ID_PATTERN.test(body.sessionId) ? body.sessionId : null;
  const pagePath = (() => {
    const raw = clean(body.pagePath, 300);
    return raw && raw.startsWith("/") ? raw.split(/[?#]/)[0] : `/resources/${slug}`;
  })();
  const userAgent = req.headers.get("user-agent");
  const attribution = (body.attribution ?? {}) as Record<string, unknown>;
  const utm = (attribution.utm ?? {}) as Record<string, unknown>;

  let result;
  try {
    result = await requestMemberAccess({
      resource,
      sourceType: config.kind,
      email: emailCheck.email,
      consent,
      sessionId,
      ctaLocation,
      pageUrl: pagePath,
      attribution: {
        source: clean(attribution.source, 200),
        medium: clean(attribution.medium, 200),
        campaign: clean(attribution.campaign, 200),
        referrer: (() => {
          const raw = clean(attribution.referrer, 500);
          try {
            return raw ? new URL(raw).hostname.replace(/^www\./, "") : null;
          } catch {
            return null;
          }
        })(),
        utm_source: clean(utm.source, 200),
        utm_medium: clean(utm.medium, 200),
        utm_campaign: clean(utm.campaign, 200),
        utm_content: clean(utm.content, 200),
      },
      evidence: { ipHash: hashEvidence(ip), userAgentHash: hashEvidence(userAgent) },
      deviceType: deviceTypeFromUserAgent(userAgent),
    });
  } catch (error) {
    console.error("Member access request failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Something went wrong on our side. Please try again in a moment." }, { status: 500 });
  }

  if (result.email === "failed") {
    console.error("Member access email failed for request", result.requestId);
    return NextResponse.json({ error: "We could not send the email just now. Please try again in a moment." }, { status: 502 });
  }
  return NextResponse.json({ success: true, state: "check_inbox" });
}
