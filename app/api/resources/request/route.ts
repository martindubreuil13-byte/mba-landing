import { NextResponse } from "next/server";
import { getPublishedResourceBySlug, captureLeadAndRequestResource } from "@/app/lib/resources/queries";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { createResend } from "@/app/lib/email-client";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { DEFAULT_RESOURCE_FROM } from "@/app/lib/resources/delivery-email";
import { buildStandardDeliveryEmail } from "@/app/lib/resources/standard-delivery-email";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { getClientIp } from "@/app/lib/rateLimit";
import { isMarketingChoice, optinEvidenceText, OPTIN_VERSION, validateOptinFields, type MarketingChoice } from "@/app/lib/resources/optin";

function clean(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: a hidden field real visitors never fill in. Bots that fill
  // every field trip it — we pretend success without creating a lead.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true, downloadUrl: null });
  }

  const country = clean(body.country, 100);
  const resourceSlug = clean(body.resourceSlug, 200);

  // The visitor's explicit choice. A page that was open before this release can still post the old checkbox
  // boolean; it maps to the same two outcomes (true = the box was ticked), so nobody is locked out mid-deploy.
  const choice: MarketingChoice | null = isMarketingChoice(body.marketingChoice)
    ? body.marketingChoice
    : typeof body.ongoingContentOptIn === "boolean"
      ? body.ongoingContentOptIn
        ? "join"
        : "resource_only"
      : null;
  const legacyCheckbox = !isMarketingChoice(body.marketingChoice);

  const fieldErrors: Record<string, string> = {};
  const checked = validateOptinFields({ firstName: body.firstName, email: body.email });
  if (!checked.ok) Object.assign(fieldErrors, checked.errors);
  if (!choice) fieldErrors.marketingChoice = "Please choose how you would like to receive it.";
  if (!resourceSlug) fieldErrors.resourceSlug = "Missing resource.";

  if (Object.keys(fieldErrors).length > 0 || !checked.ok || !choice) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 400 });
  }
  const { firstName, email } = checked;

  const resource = await getPublishedResourceBySlug(resourceSlug);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const utm = (body.utm ?? {}) as Record<string, unknown>;

  let request;
  let lead;
  let optInResult;
  try {
    ({ lead, request, optInResult } = await captureLeadAndRequestResource({
      first_name: firstName,
      email,
      country: country || null,
      marketing_choice: choice,
      consent_evidence: {
        wordingVersion: legacyCheckbox ? "resource_checkbox_legacy" : OPTIN_VERSION,
        wordingText: legacyCheckbox ? "[checkbox] Keep me on Martin's shortlist for useful stuff. (page loaded before resource_optin_v2)" : optinEvidenceText(resource.resource_type),
        method: legacyCheckbox ? "checkbox" : "button_disclosure",
        sourceType: "resource",
        sourceResourceId: resource.id,
        sourceUrl: `${appBaseUrl()}/resources/${resource.slug}`,
        ctaLocation: "resource_form",
        ipHash: hashEvidence(getClientIp(req)),
        userAgentHash: hashEvidence(req.headers.get("user-agent")),
      },
      resource_id: resource.id,
      source: clean(body.source, 200) || null,
      campaign: clean(body.campaign, 200) || null,
      medium: clean(body.medium, 200) || null,
      referrer: clean(body.referrer, 500) || null,
      utm_source: clean(utm.source, 200) || null,
      utm_medium: clean(utm.medium, 200) || null,
      utm_campaign: clean(utm.campaign, 200) || null,
      utm_content: clean(utm.content, 200) || null,
    }));
  } catch (error) {
    console.error("Resource request capture failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const downloadUrl = `${appBaseUrl()}/api/resources/download?token=${request.id}`;

  // Best-effort delivery email — never blocks or fails the response. Transactional: sent whatever marketing
  // choice was made; it only reads the lead's consent state (to decide whether to show an unsubscribe link).
  if (process.env.RESEND_API_KEY) {
    try {
      const base = appBaseUrl();
      const subscribed = Boolean(lead.ongoing_content_opt_in) && !lead.suppressed_at;
      const unsubscribeToken = subscribed ? encodeURIComponent(createUnsubscribeToken(lead.id)) : null;
      const built = buildStandardDeliveryEmail({
        resource,
        firstName: firstName || lead.first_name,
        downloadUrl,
        privacyUrl: `${base}/privacy`,
        unsubscribeUrl: unsubscribeToken ? `${base}/unsubscribe?token=${unsubscribeToken}` : null,
      });
      const resend = createResend();
      await resend.emails.send({
        from: DEFAULT_RESOURCE_FROM,
        to: email,
        replyTo: "martin@mindrasolutions.com",
        subject: built.subject,
        html: built.html,
        text: built.text,
        ...(unsubscribeToken
          ? { headers: { "List-Unsubscribe": `<${base}/api/unsubscribe?token=${unsubscribeToken}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
          : {}),
      });
    } catch (error) {
      console.error("Resource delivery email failed to send:", error);
    }
  }

  return NextResponse.json({ success: true, downloadUrl, firstName, onShortlist: optInResult === "opted_in" || optInResult === "already_opted_in" });
}
