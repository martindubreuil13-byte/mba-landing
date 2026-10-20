import { NextResponse } from "next/server";
import { createResend } from "@/app/lib/email-client";
import { classifySend, thrownSend, type SendOutcome } from "@/app/lib/service-programs/delivery";
import { escapeHtml as esc, normalizeAttribution, programLabel, resolveProgram } from "@/app/lib/service-programs/inquiry";

const resend = createResend();

/** Never throws: returns what actually happened to the send (accepted with an id, blocked, rejected or failed). */
async function safeSend(send: () => Promise<unknown>): Promise<SendOutcome> {
  try {
    return classifySend(await send());
  } catch (error) {
    return thrownSend(error);
  }
}

const FAILURE_MESSAGES = {
  email_disabled: "Email delivery is switched off in this environment, so your message was not sent.",
  provider_rejected: "We couldn't send your message just now.",
  provider_error: "We couldn't send your message just now.",
} as const;

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    console.error("EMAIL ERROR: Missing RESEND_API_KEY");
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500 },
    );
  }

  let body;

  try {
    body = await req.json();
  } catch {
    console.error("EMAIL ERROR: Invalid request body");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, code: "invalid_input", message: "Invalid request body." }, { status: 400 });
  }
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = text(body?.name, 200);
  const email = text(body?.email, 254);
  const situation = text(body?.situation, 300) || "N/A";
  const message = text(body?.message, 5000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, code: "invalid_input", message: "Please include your name, a valid email address and a message." }, { status: 400 });
  }
  // Where the inquiry notification goes. Defaults to the existing address; override with INQUIRY_NOTIFY_EMAIL (e.g. for a safe local test).
  const notifyTo = process.env.INQUIRY_NOTIFY_EMAIL?.trim() || "martin@mindrasolutions.com";
  // The program is resolved from the catalog; client-supplied names or prices are ignored.
  const program = resolveProgram(body.program);
  const attribution = normalizeAttribution(body.attribution);
  const attributionRows = Object.entries(attribution)
    .map(([k, v]) => `<p style="margin:0;color:#6b7280;"><strong>${esc(k)}:</strong> ${esc(v)}</p>`)
    .join("");

  console.log("EMAIL TRIGGERED:", { name, email, situation, message, program: program?.slug });

  const adminOutcome = await safeSend(() => resend.emails.send({
    from: "Martin <martin@mindrasolutions.com>",
    to: notifyTo,
    subject: program ? `New Qualification Submission: ${programLabel(program)}` : "New Qualification Submission",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 16px;">New Qualification Submission</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        ${program ? `<p><strong>Program:</strong> ${esc(programLabel(program))}</p>` : ""}
        <p><strong>Situation:</strong> ${esc(situation)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${esc(message)}</p>
        ${attributionRows ? `<hr style="margin:20px 0;border:0;border-top:1px solid #e5e7eb;" /><p style="margin:0 0 4px;"><strong>Attribution</strong></p>${attributionRows}` : ""}
      </div>
    `,
  }));

  // The notification to the owner is the delivery that matters. Report success only if the provider accepted it.
  if (!adminOutcome.ok) {
    console.error(`INQUIRY NOT DELIVERED: ${adminOutcome.code}${adminOutcome.status ? ` (${adminOutcome.status})` : ""}: ${adminOutcome.detail}`);
    return NextResponse.json(
      { success: false, code: adminOutcome.code, message: FAILURE_MESSAGES[adminOutcome.code] },
      { status: adminOutcome.code === "email_disabled" ? 503 : 502 },
    );
  }
  console.log(`INQUIRY NOTIFICATION ACCEPTED by email provider: id=${adminOutcome.id}`);

  const autoReplyOutcome = await safeSend(() => resend.emails.send({
    from: "Martin <martin@mindrasolutions.com>",
    to: email,
    subject: "Got your request",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <p>Hi ${esc(name)},</p>
        <p>Thanks for sharing your situation.</p>
        <p><strong>What you submitted:</strong></p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        ${program ? `<p><strong>Program:</strong> ${esc(programLabel(program))}</p>` : ""}
        <p><strong>Situation:</strong> ${esc(situation)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${esc(message)}</p>
        ${program ? "<p>No payment is taken at this stage. If it looks like a fit, I will confirm the scope and next steps with you.</p>" : ""}
        <p>I’ll review it and get back to you within 48 hours.</p>
        <p>If it makes sense, we’ll take the next step together.</p>
        <p>Martin</p>
      </div>
    `,
  }));
  // The visitor's confirmation is a courtesy: if it fails the owner still has the inquiry, so this does not fail the request.
  if (autoReplyOutcome.ok) console.log(`INQUIRY AUTO-REPLY ACCEPTED by email provider: id=${autoReplyOutcome.id}`);
  else console.warn(`INQUIRY AUTO-REPLY NOT SENT: ${autoReplyOutcome.code}: ${autoReplyOutcome.detail}`);

  return NextResponse.json({ success: true, autoReply: autoReplyOutcome.ok });
}
