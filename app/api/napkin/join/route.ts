import { NextResponse } from "next/server";
import { CONSENT_COPY_VERSION } from "@/app/lib/napkin/consent";
import { sendNapkinBreakdownEmail } from "@/app/lib/napkin/email";
import { getLeadEmailById, getNapkinSubmissionById, joinNapkinCommunity, markNapkinEmailSent } from "@/app/lib/napkin/queries";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";

// Sends an email on success — a slightly tighter budget than the plain
// submit endpoint, mirroring the reasoning behind every other
// email-triggering endpoint in this app.
const RATE_LIMIT_WINDOW_SECONDS = 30 * 60;
const RATE_LIMIT_MAX_REQUESTS = 10;

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

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const allowed = await checkRateLimit(`napkin_join:${ip}`, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a little while and try again." }, { status: 429 });
  }

  const submissionId = clean(body.submissionId, 100);
  const firstName = clean(body.firstName, 100);
  const email = clean(body.email, 200);

  const fieldErrors: Record<string, string> = {};
  if (!submissionId) fieldErrors.submissionId = "Missing submission.";
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "Enter a valid email address.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  const pending = await getNapkinSubmissionById(submissionId);
  if (!pending) {
    return NextResponse.json({ error: "We couldn't find that result. Please retake the exercise." }, { status: 404 });
  }

  if (pending.joined_at || pending.lead_id) {
    const existingEmail = pending.lead_id ? await getLeadEmailById(pending.lead_id) : null;
    if (!existingEmail || existingEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "This result has already been joined to the community." }, { status: 409 });
    }
    return NextResponse.json({ success: true, emailSent: pending.email_sent });
  }

  let lead, submission, alreadyJoined;
  try {
    ({ lead, submission, alreadyJoined } = await joinNapkinCommunity({
      submissionId,
      first_name: firstName,
      email,
      consent_copy_version: CONSENT_COPY_VERSION,
    }));
  } catch (error) {
    console.error("Napkin Principle community join failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Only send the breakdown once per submission — a double-submit (retry,
  // double click) must never trigger a second welcome/breakdown email.
  let emailSent = submission.email_sent;
  if (!alreadyJoined && !submission.email_sent) {
    const { ok, error } = await sendNapkinBreakdownEmail({
      email,
      firstName: lead.first_name,
      submissionId: submission.id,
      inputs: submission.raw_inputs,
      result: submission.calculation_result,
      completedAt: submission.created_at,
      leadId: lead.id,
    });
    await markNapkinEmailSent(submission.id, ok, error);
    emailSent = ok;
    if (!ok) console.error("Napkin Principle breakdown email failed to send:", error);
  }

  return NextResponse.json({ success: true, emailSent });
}
