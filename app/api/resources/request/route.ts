import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getPublishedResourceBySlug, captureLeadAndRequestResource } from "@/app/lib/resources/queries";
import { SITE_URL } from "@/app/lib/seo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const firstName = clean(body.firstName, 100);
  const email = clean(body.email, 200);
  const country = clean(body.country, 100);
  const resourceSlug = clean(body.resourceSlug, 200);
  const ongoingContentOptIn = body.ongoingContentOptIn === true;

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!resourceSlug) fieldErrors.resourceSlug = "Missing resource.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  const resource = await getPublishedResourceBySlug(resourceSlug);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const utm = (body.utm ?? {}) as Record<string, unknown>;

  let request;
  try {
    ({ request } = await captureLeadAndRequestResource({
      first_name: firstName,
      email,
      country: country || null,
      ongoing_content_opt_in: ongoingContentOptIn,
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

  const downloadUrl = `${SITE_URL}/api/resources/download?token=${request.id}`;

  // Best-effort confirmation email — never blocks or fails the response.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Martin <martin@mindrasolutions.com>",
        to: email,
        subject: `Your guide: ${resource.title}`,
        html: `
          <p>Hi ${firstName},</p>
          <p>Here's your copy of <strong>${resource.title}</strong>:</p>
          <p><a href="${downloadUrl}">Download the guide</a></p>
          <p>— Martin</p>
        `,
      });
    } catch (error) {
      console.error("Confirmation email failed to send:", error);
    }
  }

  return NextResponse.json({ success: true, downloadUrl, firstName });
}
