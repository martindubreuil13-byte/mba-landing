import { NextResponse } from "next/server";
import { getPublishedResourceBySlug, captureLeadAndRequestResource } from "@/app/lib/resources/queries";
import { appBaseUrl } from "@/app/lib/resources/base-url";
import { createResend } from "@/app/lib/email-client";
import { hashEvidence } from "@/app/lib/leads/evidence";
import { getClientIp } from "@/app/lib/rateLimit";
import { isMarketingChoice, optinEvidenceText, OPTIN_VERSION, resourceNoun, validateOptinFields, type MarketingChoice } from "@/app/lib/resources/optin";

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
  let optInResult;
  try {
    ({ request, optInResult } = await captureLeadAndRequestResource({
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

  // Best-effort confirmation email — never blocks or fails the response.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = createResend();
      await resend.emails.send({
        from: "Martin <martin@mindrasolutions.com>",
        to: email,
        subject: `Your ${resourceNoun(resource.resource_type)}: ${resource.title}`,
        html: `
          <p>Hi ${firstName},</p>
          <p>Here's your copy of <strong>${resource.title}</strong>:</p>
          <p><a href="${downloadUrl}">Download the ${resourceNoun(resource.resource_type)}</a></p>
          <p>— Martin</p>
        `,
      });
    } catch (error) {
      console.error("Confirmation email failed to send:", error);
    }
  }

  return NextResponse.json({ success: true, downloadUrl, firstName, onShortlist: optInResult === "opted_in" || optInResult === "already_opted_in" });
}
