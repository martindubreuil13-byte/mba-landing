import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { recordConversion } from "@/app/lib/intelligence/conversions";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { cleanText, validateApplication, type Attribution } from "@/app/lib/programs/corporate-transition";
import { createApplication, updateMailState } from "@/app/lib/programs/queries";
import { adminMessage, sendInternalNotification } from "@/app/lib/programs/email";
import { deliverInvitation } from "@/app/lib/programs/invitation";
import { buildReceipt } from "@/app/lib/programs/receipt";

const hash = (s: string) => s ? createHash("sha256").update(s).digest("hex") : null;

/**
 * Saves a Transition application and offers the booking link. There is NO screening: every valid application is saved,
 * invited and booked-for the same way. The response carries the booking link regardless of whether the invitation email
 * could be sent; the email outcome is reported truthfully so the page never claims a message that was not sent.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (cleanText(body.website, 100)) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const ip = getClientIp(req); if (!(await checkRateLimit(`transition:${hash(ip)}`, 3600, 8))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const parsed = validateApplication(body.answers); if (!parsed.data) return NextResponse.json({ error: "Please check your answers.", fieldErrors: parsed.errors }, { status: 400 });
  const answers = parsed.data;
  const attribution = (body.attribution && typeof body.attribution === "object" ? body.attribution : {}) as Attribution;
  const idempotencyKey = cleanText(body.idempotencyKey, 100) || randomUUID();

  let application; let reused; try { ({ application, reused } = await createApplication(answers, attribution, idempotencyKey)); } catch (e) { console.error("Transition application persistence failed:", e instanceof Error ? e.message : "unknown"); return NextResponse.json({ error: "We couldn’t save your application. Please try again." }, { status: 500 }); }

  // Only the request that actually created the application sends anything, so a retry or repeated event never emails twice.
  let invitationSent: boolean | undefined;
  if (!reused) {
    const notify = async () => {
      const msg = adminMessage(application.id, `${answers.firstName} ${answers.lastName}`, answers.email, answers.country);
      try { await sendInternalNotification(msg, answers.email); await updateMailState(application.id, { admin_notification_status: "queued", admin_notification_error: null }); } catch (e) { await updateMailState(application.id, { admin_notification_status: "failed", admin_notification_error: e instanceof Error ? e.message.slice(0, 500) : "Unknown email error" }).catch(() => undefined); }
    };
    const [invitation] = await Promise.all([deliverInvitation(application), notify()]);
    invitationSent = invitation.ok;
    if (!invitation.ok) console.error("Transition invitation email failed:", invitation.error);
    await recordConversion(req, { kind: "program_application", refTable: "program_applications", refId: application.id });
  }
  return NextResponse.json({ success: true, ...(await buildReceipt(application, invitationSent)) });
}
