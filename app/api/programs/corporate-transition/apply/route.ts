import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { classifyTransition, REVIEW_FALLBACK } from "@/app/lib/programs/classify";
import { cleanText, effectiveRoute, validateApplication, type Attribution } from "@/app/lib/programs/corporate-transition";
import { createApplication, updateMailState } from "@/app/lib/programs/queries";
import { adminMessage, applicantMessage, sendApplicantAck, sendInternalNotification } from "@/app/lib/programs/email";
import { sendConsentConfirmationEmail } from "@/app/lib/leads/confirmation-email";
import { hashEvidence } from "@/app/lib/leads/evidence";

const hash = (s: string) => s ? createHash("sha256").update(s).digest("hex") : null;
export async function POST(req: Request) {
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (cleanText(body.website, 100)) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const ip = getClientIp(req); if (!(await checkRateLimit(`transition:${hash(ip)}`, 3600, 8))) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  const parsed = validateApplication(body.answers); if (!parsed.data) return NextResponse.json({ error: "Please check your answers.", fieldErrors: parsed.errors }, { status: 400 });
  const attribution = (body.attribution && typeof body.attribution === "object" ? body.attribution : {}) as Attribution;
  const idempotencyKey = cleanText(body.idempotencyKey, 100) || randomUUID();
  let qualification = REVIEW_FALLBACK; try { qualification = await classifyTransition(parsed.data); } catch (e) { console.error("Transition qualification failed; routing to review:", e instanceof Error ? e.message : "unknown"); }
  // What the applicant is given. The AI's own route is still stored untouched for private review.
  const route = effectiveRoute(qualification.route, parsed.data);
  let application; let reused; let lead; let consent; try { ({ application, reused, lead, consent } = await createApplication(parsed.data, attribution, qualification, idempotencyKey, { ipHash: hashEvidence(ip), userAgentHash: hashEvidence(req.headers.get("user-agent")) }, route)); } catch (e) { console.error("Transition application persistence failed:", e instanceof Error ? e.message : "unknown"); return NextResponse.json({ error: "We couldn’t save your application. Please try again." }, { status: 500 }); }
  if (!reused) {
    const msg = applicantMessage(route, parsed.data.firstName);
    try { await sendApplicantAck(parsed.data.email, msg); await updateMailState(application.id, { applicant_email_status: "queued", applicant_email_error: null }); } catch (e) { await updateMailState(application.id, { applicant_email_status: "failed", applicant_email_error: e instanceof Error ? e.message.slice(0, 500) : "Unknown email error" }); }
    const msg2 = adminMessage(application.id, `${parsed.data.firstName} ${parsed.data.lastName}`, route, route === qualification.route ? qualification.preCallSummary : `${qualification.preCallSummary}\n\n(AI suggested ${qualification.route}; automatic qualification is disabled, so this was routed to manual review.)`, parsed.data.email);
    try { await sendInternalNotification(msg2, parsed.data.email); await updateMailState(application.id, { admin_notification_status: "queued", admin_notification_error: null }); } catch (e) { await updateMailState(application.id, { admin_notification_status: "failed", admin_notification_error: e instanceof Error ? e.message.slice(0, 500) : "Unknown email error" }); }
  }

  // Confirmed opt-in: a NEW marketing request gets exactly one confirmation email; marketing starts only after the
  // applicant confirms. The outcome is recorded on the application and reported truthfully to the page.
  let consentEmail: "queued" | "failed" | null = null;
  if (!reused && consent === "confirmation_requested" && lead) {
    const sent = await sendConsentConfirmationEmail({ to: parsed.data.email, leadId: lead.id, firstName: parsed.data.firstName });
    consentEmail = sent.ok ? "queued" : "failed";
    if (!sent.ok) console.error("Transition consent confirmation email failed:", sent.error);
    try { await updateMailState(application.id, { consent_email_status: consentEmail, consent_email_error: sent.ok ? null : sent.error }); } catch (e) { console.error("Could not record the confirmation email state:", e instanceof Error ? e.message : "unknown"); }
  }
  return NextResponse.json({ success: true, applicationId: application.id, route, consentEmail });
}
