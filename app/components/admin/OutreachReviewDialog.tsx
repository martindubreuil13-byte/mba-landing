"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import { preferenceLabel } from "@/app/lib/contact-tags/preferences";
import { exceptionEvidence } from "@/app/lib/email-studio/campaign";
import type { DeliveryResult, ReviewResponse } from "@/app/lib/email-outreach/model";

export type Flow =
  | { stage: "closed" }
  | { stage: "loading" }
  | { stage: "review"; data: ReviewResponse }
  | { stage: "sending"; data: ReviewResponse }
  | { stage: "result"; data: ReviewResponse; result: DeliveryResult | null; error?: string }
  | { stage: "error"; message: string };

export type Continue = { exception?: { basis: string; reason: string; evidence: string }; acknowledgeRecent?: true };

const button = "rounded-lg border border-[#daccc1] bg-white px-4 py-2 font-medium text-[#6b1f1f] hover:bg-[#efdfd8] disabled:opacity-50";
const primary = "rounded-lg bg-[#6b1f1f] px-4 py-2 text-white disabled:opacity-50";
const field = "w-full min-w-0 rounded-lg border border-[#daccc1] bg-white px-3 py-2";

const blockedHelp = (reason: string) =>
  reason === "Unsubscribed" ? "This person unsubscribed from email. They cannot be emailed from Email Studio."
  : reason === "Suppressed" ? "This address is suppressed. It cannot be emailed from Email Studio."
  : reason.startsWith("Known bounce") ? "An earlier email to this address bounced or was reported as spam, so it is blocked."
  : reason === "Archived or unavailable" ? "This contact is archived or unavailable. Restore it in Contacts first if you want to write to them."
  : reason;

function Facts({ data }: { data: ReviewResponse }) {
  const { contact } = data;
  return <dl className="grid gap-1 rounded-lg bg-white p-3 text-sm sm:grid-cols-[7rem_1fr]">
    <dt className="font-semibold">From</dt><dd className="break-words">{data.from}</dd>
    <dt className="font-semibold">To</dt><dd className="break-words text-base font-semibold">{contact.name ? `${contact.name} <${contact.email}>` : contact.email}</dd>
    <dt className="font-semibold">Contact</dt>
    <dd>{contact.created ? "New contact, added to Contacts for this email. Not subscribed to the newsletter." : "Existing contact."}{" "}
      <span className={contact.state === "Eligible" ? "text-[#315644]" : "text-[#6b1f1f]"}>{preferenceLabel(contact.state, contact.reason)} · {contact.reason}</span></dd>
    <dt className="font-semibold">Subject</dt><dd className="break-words">{data.subject}</dd>
    <dt className="font-semibold">Preview text</dt><dd className="break-words">{data.previewText || "None"}</dd>
  </dl>;
}

type Prefill = Extract<ReviewResponse, { status: "needs_exception" }>["prefill"];

function ExceptionForm({ prefill, busy, onSubmit }: { prefill: Prefill; busy: boolean; onSubmit: (value: NonNullable<Continue["exception"]>) => void }) {
  const [error, setError] = useState("");
  return <form className="grid gap-2 rounded-lg border border-[#6b1f1f] bg-[#f8ece8] p-3 text-sm" onSubmit={(event) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const parsed = exceptionEvidence.safeParse({ basis: fields.get("basis"), reason: fields.get("reason"), evidence: fields.get("evidence") });
    if (!parsed.success) { setError("Enter a reason of at least 10 characters and evidence of at least 15 characters."); return; }
    setError("");
    onSubmit(parsed.data);
  }}>
    <p><strong>No marketing permission is recorded for this address.</strong> Requirements vary by jurisdiction. Send only if you can document a basis that applies to this email, and record it here. It is saved with the send.</p>
    <label className="grid gap-1">Basis<select className={field} name="basis" required defaultValue={prefill?.basis ?? ""}>
      <option value="">Choose a basis</option>
      <option value="express_permission">Documented express permission for this address</option>
      <option value="documented_applicable_basis">Other documented basis applicable to this email</option>
    </select></label>
    <label className="grid gap-1">Reason<input className={field} name="reason" required minLength={10} maxLength={500} defaultValue={prefill?.reason ?? ""} /></label>
    <label className="grid gap-1">Evidence and reference<textarea className={field} name="evidence" required minLength={15} maxLength={1000} defaultValue={prefill?.evidence ?? ""}
      placeholder="Record what permits this email, where the evidence is held, and any relevant dates or expiry." /></label>
    {error && <p role="alert" className="text-[#6b1f1f]">{error}</p>}
    <div><button className={primary} disabled={busy}>Use this basis and continue</button></div>
  </form>;
}

/** The final check before one email goes out: exactly who, exactly what, and everything that has to be confirmed first. */
type Handlers = { onContinue: (extra: Continue) => void; onSend: () => void; onClose: () => void; onBackToEditing: () => void; onNext: () => void; onCopy: () => void };

export default function OutreachReviewDialog({ dialog, flow, ...handlers }: { dialog: RefObject<HTMLDialogElement | null>; flow: Flow } & Handlers) {
  const busy = flow.stage === "loading" || flow.stage === "sending";
  // A new key for every review result, so no tick box or form value can carry over from an earlier review to a later one.
  const key = "data" in flow ? `${flow.data.campaignId ?? "pending"}-${flow.data.status}-${flow.data.contact.id}` : flow.stage;
  return <dialog ref={dialog} aria-labelledby="outreach-review" onCancel={(event) => { event.preventDefault(); if (!busy) handlers.onClose(); }}
    className="m-auto max-h-[90vh] w-[min(94vw,44rem)] overflow-auto rounded-2xl bg-[#fffcf9] p-5 shadow-xl backdrop:bg-black/35">
    {flow.stage !== "closed" && <Body key={key} flow={flow} {...handlers} />}
  </dialog>;
}

function Body({ flow, onContinue, onSend, onBackToEditing, onNext, onCopy }: { flow: Exclude<Flow, { stage: "closed" }> } & Omit<Handlers, "onClose">) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [recentSeen, setRecentSeen] = useState(false);
  const busy = flow.stage === "loading" || flow.stage === "sending";
  const data = "data" in flow ? flow.data : null;

  return <>
    <div className="grid gap-3">
      <h2 id="outreach-review" className="font-serif text-2xl">{flow.stage === "result" ? "Result" : "Review email"}</h2>

      {flow.stage === "loading" && <p role="status">Checking this recipient…</p>}
      {flow.stage === "error" && <>
        <p role="alert" className="text-[#6b1f1f]">{flow.message}</p>
        <div><button type="button" className={button} onClick={onBackToEditing}>Back to editing</button></div>
      </>}

      {data && <Facts data={data} />}

      {flow.stage === "review" && flow.data.status === "blocked" && <>
        <p role="alert" className="rounded-lg border border-[#6b1f1f] bg-[#f8ece8] p-3 text-[#6b1f1f]"><strong>This email cannot be sent.</strong> {blockedHelp(flow.data.reason)}</p>
        <div><button type="button" className={button} onClick={onBackToEditing}>Back to editing</button></div>
      </>}

      {flow.stage === "review" && flow.data.status === "needs_exception" && <>
        <ExceptionForm prefill={flow.data.prefill} busy={false} onSubmit={(exception) => onContinue({ exception })} />
        <div><button type="button" className={button} onClick={onBackToEditing}>Back to editing</button></div>
      </>}

      {flow.stage === "review" && flow.data.status === "needs_recent_acknowledgement" && <>
        <aside role="alert" className="rounded-lg border border-[#6b1f1f] bg-[#f8ece8] p-3 text-sm text-[#6b1f1f]">
          <p><strong>You already emailed this address recently.</strong></p>
          <ul className="my-2 list-disc pl-5">{flow.data.recent.map((send) => <li key={send.sentAt + send.subject}>
            {new Date(send.sentAt).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium" })} · {send.subject || "No subject"}</li>)}</ul>
          <label className="flex items-start gap-2"><input type="checkbox" checked={recentSeen} onChange={(event) => setRecentSeen(event.target.checked)} /> I know this person was emailed recently and I want to send another email.</label>
        </aside>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={primary} disabled={!recentSeen} onClick={() => onContinue({ acknowledgeRecent: true })}>Continue to final review</button>
          <button type="button" className={button} onClick={onBackToEditing}>Back to editing</button>
        </div>
      </>}

      {(flow.stage === "review" && flow.data.status === "ready") || flow.stage === "sending" ? <>
        {data && data.exceptionCount > 0 && <aside className="rounded-lg border border-[#6b1f1f] bg-[#f8ece8] p-3 text-sm text-[#6b1f1f]">
          <p><strong>Marketing permission is unverified for this address.</strong> The basis you documented will be saved with this send.</p>
          <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={acknowledged} disabled={busy} onChange={(event) => setAcknowledged(event.target.checked)} /> I reviewed the documented basis and acknowledge this warning.</label>
        </aside>}
        {data && <div className="newsletter-preview-paper" dangerouslySetInnerHTML={{ __html: data.html }} />}
        <p className="text-sm">The unsubscribe link is personalised when the email is sent. Eligibility is checked again at that moment. <strong>This sends a real email, once.</strong></p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={primary} disabled={busy || (data !== null && data.exceptionCount > 0 && !acknowledged)} onClick={onSend}>
            {flow.stage === "sending" ? "Sending…" : `Send this email to ${data?.contact.email ?? ""}`}</button>
          <button type="button" className={button} disabled={busy} onClick={onBackToEditing}>Back to editing</button>
        </div>
        {flow.stage === "sending" && <p role="status">Sending. Keep this page open until the result appears.</p>}
      </> : null}

      {flow.stage === "result" && (() => {
        const status = flow.result?.status ?? "none";
        const email = flow.data.contact.email;
        const nothingSent = status === "none";
        const text = status === "sent" ? `Sent. The email provider accepted this email for ${email}.`
          : status === "failed" ? `The email provider rejected this email, so it was not sent to ${email}.`
          : status === "excluded" ? `Not sent to ${email}: ${flow.result?.reason ?? "no longer eligible"}.`
          : nothingSent ? `Nothing was sent. ${flow.error ?? "The send could not be started."}`
          : "The result could not be confirmed. The email may or may not have gone out. Check Campaign history before sending anything similar again.";
        return <>
          <p role={status === "sent" ? "status" : "alert"} className={`rounded-lg border p-3 ${status === "sent" ? "border-[#315644] bg-[#eef5f0] text-[#315644]" : "border-[#6b1f1f] bg-[#f8ece8] text-[#6b1f1f]"}`}><strong>{text}</strong></p>
          {!nothingSent && <p className="text-sm">This send is recorded in <Link className="underline" href="/admin/email#campaign-history">Campaign history</Link>, including delivery and bounces as the provider reports them.</p>}
          <div className="flex flex-wrap gap-3">
            {nothingSent ? <button type="button" className={primary} onClick={onBackToEditing}>Back to editing</button> : <>
              <button type="button" className={primary} onClick={onNext}>Compose next email</button>
              <button type="button" className={button} onClick={onCopy}>Copy this message into a new draft</button>
            </>}
          </div>
        </>;
      })()}

    </div>
  </>;
}
