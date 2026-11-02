import { NextResponse } from "next/server";
import { recordConversion } from "@/app/lib/intelligence/conversions";
import { createResend } from "@/app/lib/email-client";
import { classifySend, thrownSend, type SendOutcome } from "@/app/lib/service-programs/delivery";
import { inquiryNotification, prospectConfirmation } from "@/app/lib/service-programs/inquiry-emails";
import { normalizeAttribution, resolveProgram } from "@/app/lib/service-programs/inquiry";
import { inquiryStoreEnabled, refExchangeEnabled } from "@/app/lib/inquiries/config";
import { clientWithinLimit, noteGlobalVolume } from "@/app/lib/inquiries/abuse";
import { verifyFormToken } from "@/app/lib/inquiries/form-token";
import { submitInquiry } from "@/app/lib/inquiries/submit";
import { sameSite } from "@/app/lib/inquiries/same-site";

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

  // Stored path only: a form post is a few kilobytes; refuse anything far larger before reading it.
  if (inquiryStoreEnabled() && Number(req.headers.get("content-length") ?? 0) > 65_536) {
    return NextResponse.json({ success: false, code: "too_large", message: "That request is too large." }, { status: 413 });
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
  const stored = inquiryStoreEnabled();
  if (stored) {
    // A hidden field no person sees: a script that fills it gets a convincing "success" and nothing is stored or sent.
    if (typeof body.contactUrl === "string" && body.contactUrl.trim()) return NextResponse.json({ success: true, autoReply: false });
    if (!sameSite(req)) return NextResponse.json({ success: false, code: "forbidden", message: "This request is not allowed." }, { status: 403 });
  }
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = text(body?.name, 200);
  const email = text(body?.email, 254);
  const situation = text(body?.situation, 300) || "N/A";
  const message = text(body?.message, 5000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, code: "invalid_input", message: "Please include your name, a valid email address and a message." }, { status: 400 });
  }
  if (stored) {
    // Proof the form was opened by a browser a moment ago (not a script, not a day-old replay), then the per-client limit.
    const token = verifyFormToken(body.formToken);
    if (!token.ok) {
      const text = token.reason === "too_fast" ? "That was very quick. Please wait a moment and send it again." : "This page has been open too long or needs refreshing. Please reload it and try again.";
      return NextResponse.json({ success: false, code: token.reason === "too_fast" ? "too_fast" : "stale_form", message: text }, { status: 400 });
    }
    if (!(await clientWithinLimit(req))) {
      return NextResponse.json({ success: false, code: "rate_limited", message: "Too many messages from this connection. Please try again later, or email martin@mindrasolutions.com." }, { status: 429, headers: { "retry-after": "3600" } });
    }
    await noteGlobalVolume();
  }
  // Where the inquiry notification goes. Defaults to the existing address; override with INQUIRY_NOTIFY_EMAIL (e.g. for a safe local test).
  const notifyTo = process.env.INQUIRY_NOTIFY_EMAIL?.trim() || "martin@mindrasolutions.com";
  // The program is resolved from the catalog; client-supplied names or prices are ignored.
  const program = resolveProgram(body.program);
  const attribution = normalizeAttribution(body.attribution);

  console.log("INQUIRY RECEIVED:", { program: program?.slug ?? null, hasAttribution: Object.keys(attribution).length > 0 });

  if (stored) {
    // Persisted first; no saved row means no accepted inquiry and no owner notification (see app/lib/inquiries/submit.ts).
    const result = await submitInquiry(
      { name, email, situation, message, program, attribution, clientKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : null },
      {
        send: (payload, options) => resend.emails.send(payload as unknown as Parameters<typeof resend.emails.send>[0], options),
        notifyTo,
        // Server-confirmed inquiry: counted once, when the owner notification was accepted. Nothing the visitor wrote is sent to analytics.
        onAccepted: async ({ program: slug, messageId }) => { await recordConversion(req, { kind: "inquiry", refTable: "email_provider", refId: messageId, props: slug ? { program: slug } : undefined }); },
      },
    );
    if (!result.ok) return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.status });
    // The reference is handed back only when new-style links are on, and only to the person who just submitted.
    return NextResponse.json({ success: true, autoReply: result.autoReply, ...(refExchangeEnabled() ? { bookingRef: result.bookingRef } : {}) });
  }

  // The owner notification carries everything submitted; the visitor's confirmation repeats none of it.
  const owner = inquiryNotification({ name, email, message, situation, program, attribution });
  const confirmation = prospectConfirmation({ name, program });

  const adminOutcome = await safeSend(() =>
    resend.emails.send({
      from: "Martin <martin@mindrasolutions.com>",
      to: notifyTo,
      subject: owner.subject,
      html: owner.html,
      text: owner.text,
      // Replying to the notification goes straight to the prospect.
      ...(owner.replyTo ? { replyTo: owner.replyTo } : {}),
    }),
  );

  // The notification to the owner is the delivery that matters. Report success only if the provider accepted it.
  if (!adminOutcome.ok) {
    console.error(`INQUIRY NOT DELIVERED: ${adminOutcome.code}${adminOutcome.status ? ` (${adminOutcome.status})` : ""}: ${adminOutcome.detail}`);
    return NextResponse.json(
      { success: false, code: adminOutcome.code, message: FAILURE_MESSAGES[adminOutcome.code] },
      { status: adminOutcome.code === "email_disabled" ? 503 : 502 },
    );
  }
  console.log(`INQUIRY NOTIFICATION ACCEPTED by email provider: id=${adminOutcome.id}`);
  // Server-confirmed inquiry: the owner notification was accepted. Nothing the visitor wrote is sent to analytics.
  await recordConversion(req, { kind: "inquiry", refTable: "email_provider", refId: adminOutcome.id, props: program ? { program: program.slug } : undefined });

  const autoReplyOutcome = await safeSend(() =>
    resend.emails.send({
      from: "Martin <martin@mindrasolutions.com>",
      to: email,
      subject: confirmation.subject,
      html: confirmation.html,
      text: confirmation.text,
    }),
  );
  // The visitor's confirmation is a courtesy: if it fails the owner still has the inquiry, so this does not fail the request.
  if (autoReplyOutcome.ok) console.log(`INQUIRY AUTO-REPLY ACCEPTED by email provider: id=${autoReplyOutcome.id}`);
  else console.warn(`INQUIRY AUTO-REPLY NOT SENT: ${autoReplyOutcome.code}: ${autoReplyOutcome.detail}`);

  return NextResponse.json({ success: true, autoReply: autoReplyOutcome.ok });
}
