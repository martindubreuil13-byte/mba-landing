/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/app/components/admin/AdminShell";
import ProgramResponseForm from "@/app/components/admin/ProgramResponseForm";
import ResendInvitationButton from "@/app/components/admin/ResendInvitationButton";
import { requireAdmin } from "@/app/lib/supabase/admin-session";
import { getApplication } from "@/app/lib/programs/queries";
import { CONVERSATION_INVITE_SUBJECT, conversationInviteDraft } from "@/app/lib/programs/corporate-transition";
import { CONSENT_STATUS_LABELS, consentStatusOf } from "@/app/lib/leads/consent";
import { INVITATION_LABELS, listInvitationSends, summarizeInvitation } from "@/app/lib/programs/invitation";
import { calendlyTrackingConfigured, listBookings } from "@/app/lib/programs/calendly";
import { formatDateTimeUtc } from "@/app/lib/programs/format";
export const metadata: Metadata = { robots: { index: false, follow: false } }; export const dynamic = "force-dynamic";

const row = (label: string, value: unknown) => <div className="border-b border-[#1a1816]/10 py-4"><p className="text-xs uppercase tracking-widest text-[#1a1816]/45">{label}</p><p className="mt-2 whitespace-pre-wrap leading-relaxed">{Array.isArray(value) ? value.join("\n") : String(value || "—")}</p></div>;
const COMMUNITY_LABELS: Record<string, string> = { declined: "Declined", joined: "Joined", confirmation_sent: "Asked to confirm by email", confirmation_failed: "Chose to join; confirmation email failed", not_applied: "Chose to join; not applied (address is suppressed)" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a: any = await getApplication(id);
  if (!a) notFound();
  const x = a.answers;
  const sends = await listInvitationSends([id]), inv = summarizeInvitation(sends), bookings = await listBookings(id);
  const connected = calendlyTrackingConfigured(), legacy = !a.booking_ref, canResend = a.status === "INVITED" && a.booking_status !== "booked";
  const calendly = a.booking_status === "booked" ? "Booked" : a.booking_status === "not_booked" ? (connected ? "Pending" : "Not connected") : "—";
  const leadStatus = a.lead ? CONSENT_STATUS_LABELS[consentStatusOf({ ongoing_content_opt_in: a.lead.ongoing_content_opt_in, ongoing_content_opt_in_at: a.lead.ongoing_content_opt_in_at, ongoing_content_opt_out_at: a.lead.ongoing_content_opt_out_at, suppressed_at: a.lead.suppressed_at, consent_requested_at: a.lead.consent_requested_at })] : "Unknown";

  // Templates for applications that were held for a personal reply under the earlier review flow.
  const concern = `Hi ${x.firstName},\n\nBased on what you’ve shared, I’m not convinced my process is the right fit for your situation right now. Building a credible path into entrepreneurship can take several months and may require financial investment along the way.\n\nThat said, a questionnaire doesn’t tell me everything. If you believe there’s more context I should understand, I’m happy to have a conversation.\n\n— Martin`;
  const decline = `Hi ${x.firstName},\n\nThank you for taking the time to share your situation. Based on what you’ve told me, I don’t think this particular pathway is the right fit right now. You may find a useful next step in the free resources and answers on my website.\n\n— Martin`;
  const initial = a.response_draft || `Hi ${x.firstName},\n\nBased on what you’ve shared, I think it would be useful for us to talk. I’d like to invite you to a 30-minute conversation.\n\n— Martin`;

  return <AdminShell>
    <Link href="/admin/programs/corporate-transition" className="text-xs uppercase tracking-widest text-[#1a1816]/50">← Corporate Transition</Link>
    <div className="mt-6 flex flex-wrap justify-between gap-5">
      <div><h1 className="text-3xl font-light">{x.firstName} {x.lastName}</h1><p className="mt-1 text-sm text-[#1a1816]/55">{x.email} · {x.country}</p></div>
      <div className="text-sm"><p>{a.status.replaceAll("_", " ")}</p></div>
    </div>

    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest">Application</h2>
        {row("Professional situation", x.employment + (x.employmentOther ? ` — ${x.employmentOther}` : ""))}
        {row("Experience", x.experience)}{row("Stage", x.stage)}{row("Timing", x.timing)}
        {row("Motivation", x.motivation)}{row("Wants help with", x.help)}{row("LinkedIn", x.linkedin)}
        {row("Submitted", formatDateTimeUtc(a.submitted_at))}
        {row("Community invitation", a.community_choice ? `${COMMUNITY_LABELS[a.community_choice] ?? a.community_choice} (${formatDateTimeUtc(a.community_choice_at)})\nMarketing consent now: ${leadStatus}` : "No choice made")}
        {a.marketing_consent_requested && row("Earlier checkbox: marketing consent requested", `Yes — confirmation required. Status now: ${leadStatus}\nConfirmation email: ${a.consent_email_status}${a.consent_email_error ? `: ${a.consent_email_error}` : ""}`)}
        {row("Attribution", JSON.stringify(a.attribution, null, 2))}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest">Invitation</h2>
        {row("Status", legacy ? "Submitted before direct booking (no booking invitation was sent)" : INVITATION_LABELS[inv.state])}
        {!legacy && row("First sent", formatDateTimeUtc(inv.firstSentAt))}
        {!legacy && inv.state === "resent" && row("Last sent", formatDateTimeUtc(inv.lastSentAt))}
        {inv.lastError && row("Last problem", inv.lastError)}
        {sends.length > 0 && <div className="border-b border-[#1a1816]/10 py-4"><p className="text-xs uppercase tracking-widest text-[#1a1816]/45">Attempts</p>
          <ul className="mt-2 space-y-2 text-sm">{[...sends].reverse().map((s) => <li key={s.id}><b>{s.kind === "resend" ? "Resend" : s.status === "accepted" ? "First send" : "Attempt"}</b> · {s.status === "accepted" ? (s.delivery_status === "bounced" || s.delivery_status === "failed" ? `accepted, then ${s.delivery_status}` : s.delivery_status === "delivered" ? "delivered" : "accepted by the email provider") : s.status === "pending" ? "in progress / outcome unconfirmed — check provider before retrying" : "failed"} · {formatDateTimeUtc(s.attempted_at)}{s.provider_message_id ? <span className="block break-all text-xs text-[#1a1816]/50">Resend message ID {s.provider_message_id}</span> : null}{s.error ? <span className="block text-xs text-[#8b2525]">{s.error}</span> : null}</li>)}</ul></div>}
        {canResend && <ResendInvitationButton id={id} label={legacy ? "Send booking invitation" : "Resend invitation"} />}

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest">Calendly</h2>
        {row("Status", calendly)}
        {a.booking_status === "booked" && row("Meeting date", formatDateTimeUtc(a.meeting_at))}
        {a.booking_status === "booked" && row("Booked", formatDateTimeUtc(a.booked_at))}
        {!connected && row("Tracking", "Not connected. Bookings cannot be confirmed automatically until the Calendly webhook is set up (see docs/transition-booking-flow/README.md).")}
        {bookings.length > 0 && <div className="border-b border-[#1a1816]/10 py-4"><p className="text-xs uppercase tracking-widest text-[#1a1816]/45">Booking history</p>
          <ul className="mt-2 space-y-2 text-sm">{bookings.map((b) => <li key={b.id}><b>{b.status === "active" ? "Booked" : b.rescheduled ? "Rescheduled (moved to a new time)" : "Cancelled"}</b> · meeting {formatDateTimeUtc(b.start_time)}{b.canceled_at ? ` · cancelled ${formatDateTimeUtc(b.canceled_at)}` : ""}</li>)}</ul></div>}

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest">Notifications</h2>
        {row("Booking invitation email (latest state)", `${a.applicant_email_status}${a.applicant_email_error ? `: ${a.applicant_email_error}` : ""}`)}
        {row("Admin notification", `${a.admin_notification_status}${a.admin_notification_error ? `: ${a.admin_notification_error}` : ""}`)}
        {a.response_sent && row("Response sent", `${a.response_sent}\n\n${a.response_sent_at || ""}`)}

        {a.ai_route && <>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest">Earlier assessment (historical)</h2>
          <p className="mt-2 text-xs text-[#1a1816]/50">Produced when applications were screened. Kept for the record; new applications are not assessed.</p>
          {row("Suggested route", `${a.ai_route}${a.ai_confidence ? ` · ${a.ai_confidence} confidence` : ""}`)}
          {row("Pre-call summary", a.ai_pre_call_summary)}{row("Reasoning", a.ai_reasoning)}{row("Concerns / signals", a.ai_concerns)}
        </>}

        {a.status === "UNDER_REVIEW" && <ProgramResponseForm id={id} initial={initial} templates={[{ id: "conversation", label: "Conversation invitation (outside the original criteria)", kind: "INVITE", subject: CONVERSATION_INVITE_SUBJECT, message: conversationInviteDraft(x.firstName) }]} />}
        {a.status === "UNDER_REVIEW" && <details className="mt-4 text-xs"><summary>Suggested alternate drafts</summary><p className="mt-3 whitespace-pre-wrap"><b>Concern:</b>{"\n"}{concern}{"\n\n"}<b>Decline:</b>{"\n"}{decline}</p></details>}
      </section>
    </div>
  </AdminShell>;
}
