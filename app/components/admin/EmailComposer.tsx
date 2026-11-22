"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import NewsletterEditor from "./NewsletterEditor";
import { renderNewsletterEmail } from "@/app/lib/email-studio/render";
import RecipientPicker from "./RecipientPicker";
import type { ComponentProps } from "react";
import TestEmailDialog from "./TestEmailDialog";

import { campaignBatchSize, sendCampaignBatches, type ExceptionReview } from "@/app/lib/email-studio/campaign";

type Review = { campaignId: string | null; subject: string; previewText: string; selected: number; eligible: number; exceptionCount: number; exclusions: Record<string, number>; html: string; filters: string };

export default function EmailComposer({ recipients, storageOrigin, draft }: { recipients: ComponentProps<typeof RecipientPicker>; storageOrigin: string; draft?: { subject: string; previewText: string; operations: import("quill").Op[] } }) {
  const router = useRouter();
  const [previewText, setPreviewText] = useState(draft?.previewText ?? "");
  const [acknowledge, setAcknowledge] = useState(false);
  const [review, setReview] = useState<Review>();
  const [busy, setBusy] = useState(false);
  const [sendProgress, setSendProgress] = useState("");
  const inFlight = useRef(false);
  const attempted = useRef(false);
  const [notice, setNotice] = useState("");
  const reviewDialog = useRef<HTMLDialogElement>(null);
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const [message, setMessage] = useState("");
  const operations = useRef<unknown[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const onChange = useCallback((html: string, delta: unknown[]) => {
    operations.current = delta;
    setMessage(html);
  }, []);
  async function campaign(payload: object) {
    const response = await fetch("/api/admin/email/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  }

  async function openReview(ids: string[], filters: string, exceptions: ExceptionReview[]) {
    if (inFlight.current || attempted.current) return;
    inFlight.current = true;
    setBusy(true);
    setSendProgress("");
    setNotice("");
    try {
      const result = await campaign({ ids, subject, previewText, operations: operations.current, exceptions });
      setAcknowledge(false);
      setReview({ ...result, filters });
      reviewDialog.current?.showModal();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Review could not be loaded.");
    } finally { inFlight.current = false; setBusy(false); }
  }

  async function send() {
    if (!review?.campaignId || (review.exceptionCount > 0 && !acknowledge) || inFlight.current || attempted.current) return;
    attempted.current = true;
    inFlight.current = true;
    setBusy(true);
    try {
      await sendCampaignBatches(review.eligible, (offset) => campaign({
        campaignId: review.campaignId, confirmed: true, offset,
        ...(review.exceptionCount > 0 ? { acknowledgeExceptions: true } : {}),
      }), (processed, total) => setSendProgress(`${processed} of ${total} recipients processed. Keep this page open until sending finishes.`));
      setNotice("Sending finished. Review the result in Campaign history.");
    } catch {
      setNotice("The result could not be confirmed. Check Campaign history before composing another campaign.");
    } finally {
      inFlight.current = false;
      setBusy(false);
      reviewDialog.current?.close();
      router.refresh();
    }
  }

  const field = "w-full rounded-lg border border-[#daccc1] bg-white px-3 py-2";
  return <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <section className="grid gap-4 min-w-0 rounded-3xl border border-[#e6dcd4] bg-[#fffcf9] p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-2xl">Compose</h2>
      <label className="grid gap-1 text-sm">Subject<input className={field} maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
      <label className="grid gap-1 text-sm">Preview text<input className={field} maxLength={160} value={previewText} onChange={(event) => setPreviewText(event.target.value)} /></label>
      <NewsletterEditor initialOperations={draft?.operations} storageOrigin={storageOrigin} onChange={onChange} />
      <TestEmailDialog dialog={dialog} subject={subject} operations={operations} />
      <div><button type="button" onClick={() => dialog.current?.showModal()} className="rounded-lg bg-[#6b1f1f] px-4 py-2 text-white">Send Test</button></div>
      <RecipientPicker {...recipients} onReview={openReview} />
      {busy && <p role="status">Working…</p>}
      {notice && <p role="status">{notice}</p>}
      <dialog ref={reviewDialog} aria-labelledby="campaign-review" className="m-auto max-h-[90vh] w-[min(94vw,44rem)] overflow-auto rounded-2xl bg-[#fffcf9] p-5 shadow-xl backdrop:bg-black/35" onCancel={(event) => { if (busy) event.preventDefault(); }}>
        {review && <div className="grid gap-3">
          <h2 id="campaign-review" className="font-serif text-2xl">Review campaign</h2>
          <p><strong>Subject</strong> · {review.subject}</p>
          <p><strong>Preview text</strong> · {review.previewText || "None"}</p>
          <p><strong>Filters at review</strong> · {review.filters}. Selection may include contacts chosen under other filters.</p>
          <p>{review.selected} selected · {review.eligible - review.exceptionCount} subscribed · {review.exceptionCount} additional by exception · {review.selected - review.eligible} excluded</p>
          <ul>{Object.entries(review.exclusions).map(([reason, count]) => <li key={reason}>{count} · {reason}</li>)}</ul>
          <div className="newsletter-preview-paper" dangerouslySetInnerHTML={{ __html: review.html }} />
          {!review.campaignId && <p role="status">No eligible recipients remain. Check the exclusion reasons and selection.</p>}
          {review.exceptionCount > 0 && <aside className="rounded-lg border border-[#6b1f1f] bg-[#f8ece8] p-3 text-[#6b1f1f]">
            <p><strong>Marketing permission is unverified for {review.exceptionCount} additional recipients.</strong> Requirements vary by jurisdiction. Send only if the evidence you recorded supports this campaign.</p>
            <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={acknowledge} onChange={(event) => setAcknowledge(event.target.checked)} /> I reviewed the documented basis for these recipients and acknowledge this warning.</label>
          </aside>}
          <p className="text-sm">Eligibility is checked again at send time. This action sends real email.</p>
          <p className="text-sm">The campaign is processed in batches of {campaignBatchSize}, with a delay between emails.</p>
          {sendProgress && <p role="status">{sendProgress}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!review.campaignId || busy || (review.exceptionCount > 0 && !acknowledge)} onClick={send} className="rounded-lg bg-[#6b1f1f] px-4 py-2 text-white disabled:opacity-50">{busy ? "Sending…" : `Confirm and send to up to ${review.eligible} recipients`}</button>
            <button type="button" disabled={busy} onClick={() => reviewDialog.current?.close()}>Back to compose</button>
          </div>
        </div>}
      </dialog>
    </section>
    <section className="min-w-0 rounded-3xl border border-[#e6dcd4] bg-[#fffcf9] p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Preview</h2>
        <div role="group" aria-label="Preview width" className="newsletter-segment">
          <button type="button" aria-pressed={mode === "desktop"} onClick={() => setMode("desktop")}><Monitor size={15} aria-hidden /> Desktop</button>
          <button type="button" aria-pressed={mode === "mobile"} onClick={() => setMode("mobile")}><Smartphone size={15} aria-hidden /> Mobile</button>
        </div>
      </div>
      <div className="newsletter-preview-stage">
      <article className="newsletter-preview-paper" style={{ maxWidth: mode === "mobile" ? 375 : 600 }}
        dangerouslySetInnerHTML={{ __html: renderNewsletterEmail(subject, message, { previewText }) }} />
      </div>
    </section>
  </div>;
}
