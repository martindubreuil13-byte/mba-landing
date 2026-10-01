import { NextResponse } from "next/server";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { getConsentCopy } from "@/app/lib/resources/consent-copy";
import { getResourceConfig } from "@/app/lib/resources/config";
import { prepareDeliveryRetry, sendDeliveryEmail } from "@/app/lib/resources/delivery-email";
import { CTA_LOCATIONS, SESSION_ID_PATTERN } from "@/app/lib/resources/events";
import { deviceTypeFromUserAgent } from "@/app/lib/resources/event-store";
import { requestPrintableGuide } from "@/app/lib/resources/guide-request";
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
 * Printable-resource request: validates, records consent + lead + request +
 * events, then sends the delivery email. The PDF is NOT gated on the email
 * succeeding — the response always carries the download URL.
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
    return NextResponse.json({ success: true, downloadUrl: null, emailStatus: "queued" });
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(`printable_guide:${ip}`, IP_WINDOW_SECONDS, IP_MAX_REQUESTS))) {
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

  const consent = getConsentCopy(config.consentCopyId);
  if (!consent || body.consentVersion !== consent.id) {
    // The page was loaded with different wording than the server now holds.
    return NextResponse.json({ error: "This form is out of date. Please reload the page and try again." }, { status: 409 });
  }

  const ctaLocation = clean(body.ctaLocation, 20);
  if (!ctaLocation || !(CTA_LOCATIONS as readonly string[]).includes(ctaLocation)) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  if (!(await checkRateLimit(`printable_guide_email:${hashEvidence(emailCheck.email)}`, EMAIL_WINDOW_SECONDS, EMAIL_MAX_REQUESTS))) {
    return NextResponse.json({ error: "That address has already requested this a few times. Check your inbox, or try again in an hour." }, { status: 429 });
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
    result = await requestPrintableGuide({
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
    console.error("Printable guide request failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Something went wrong on our side. Please try again in a moment." }, { status: 500 });
  }

  const downloadUrl = `/api/resources/download?token=${result.request.id}&via=form`;
  const backupUrl = `/api/resources/download?token=${result.request.id}&via=backup`;

  // A re-used request already has (or is getting) its email, so never send twice. But if that earlier email
  // never went out (failed, blocked by the environment's email policy, or never attempted), "already sent"
  // would be false: try again and report what actually happens.
  const previous = result.request.delivery_status ?? "not_tracked";
  const earlierEmailNeverWent = result.reused && (previous === "failed" || previous === "not_tracked");
  let emailStatus: "queued" | "failed" | "already_sent" = "already_sent";
  if (!result.reused || earlierEmailNeverWent) {
    if (earlierEmailNeverWent) await prepareDeliveryRetry(result.request.id);
    const sent = await sendDeliveryEmail({
      to: emailCheck.email,
      config,
      resource,
      requestId: result.request.id,
      leadId: result.lead.id,
      consent: result.consentOutcome === "pending_confirmation" ? "pending" : result.consentOutcome === "existing" ? "active" : "none",
      retry: earlierEmailNeverWent,
    });
    emailStatus = sent.status;
    if (sent.status === "failed") console.error("Delivery email failed:", sent.error);
  }

  return NextResponse.json({ success: true, downloadUrl, backupUrl, emailStatus, consent: result.consentOutcome });
}
