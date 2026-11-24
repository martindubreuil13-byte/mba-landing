"use client";

import { Monitor, Smartphone } from "lucide-react";
import type { Op } from "quill";
import { useCallback, useEffect, useRef, useState } from "react";
import type { recipientCandidates } from "@/app/lib/contact-tags/data";
import { OutreachError, callOutreach } from "@/app/lib/email-outreach/client";
import { isDirty, isEmail, type DeliveryResult, type OutreachDraft, type ReviewResponse } from "@/app/lib/email-outreach/model";
import { sendCampaignBatches } from "@/app/lib/email-studio/campaign";
import { renderNewsletterEmail } from "@/app/lib/email-studio/render";
import NewsletterEditor from "./NewsletterEditor";
import OutreachDraftList from "./OutreachDraftList";
import OutreachRecipient, { type Recipient } from "./OutreachRecipient";
import OutreachReviewDialog, { type Continue, type Flow } from "./OutreachReviewDialog";
import TestEmailDialog from "./TestEmailDialog";

type Candidate = Awaited<ReturnType<typeof recipientCandidates>>[number];
export type Content = { recipientEmail: string; recipientName: string; subject: string; previewText: string; operations: unknown[] };

const field = "w-full min-w-0 rounded-lg border border-[#daccc1] bg-white px-3 py-2";
const blank: Content = { recipientEmail: "", recipientName: "", subject: "", previewText: "", operations: [] };

async function sendBatch(payload: object) {
  const response = await fetch("/api/admin/email/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((result as { error?: string }).error ?? "The send could not be completed.");
  return result as { nextOffset: number; done: boolean };
}

/**
 * Individual outreach: one email to one person, written in the same editor and template as the newsletter.
 * Nothing is sent until the exact recipient and email have been reviewed and the admin presses the send button once;
 * the send itself uses the same confirmed, once-only mechanism as a newsletter campaign.
 */
export default function OutreachComposer({ contacts, available, storageOrigin, initialDrafts, initialCopy }: {
  contacts: Candidate[]; available: boolean; storageOrigin: string; initialDrafts: OutreachDraft[] | null;
  /** An earlier individual send reopened from Campaign history: starts as an unsaved draft, keeping the recipient. */
  initialCopy?: Content;
}) {
  const unavailable = initialDrafts === null;
  const [drafts, setDrafts] = useState<OutreachDraft[]>(initialDrafts ?? []);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient>({ email: initialCopy?.recipientEmail ?? "", name: initialCopy?.recipientName ?? "", leadId: null });
  const [subject, setSubject] = useState(initialCopy?.subject ?? "");
  const [previewText, setPreviewText] = useState(initialCopy?.previewText ?? "");
  const [message, setMessage] = useState("");
  const [initialOps, setInitialOps] = useState<Op[] | undefined>(initialCopy?.operations.length ? (initialCopy.operations as Op[]) : undefined);
  const [editorKey, setEditorKey] = useState(0);
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();
  const [busy, setBusy] = useState(false);
  const [flow, setFlow] = useState<Flow>({ stage: "closed" });
  const operations = useRef<unknown[]>(initialCopy?.operations ?? []);
  const saved = useRef<Content>(blank);
  const awaitingEditor = useRef(Boolean(initialCopy?.operations.length));
  const inFlight = useRef(false);
  const sendAttempted = useRef(false);
  const pending = useRef<Continue>({});
  const createdHere = useRef(false);
  const reviewDialog = useRef<HTMLDialogElement>(null);
  const testDialog = useRef<HTMLDialogElement>(null);

  const current: Content = { recipientEmail: recipient.email, recipientName: recipient.name, subject, previewText, operations: operations.current };
  const dirty = isDirty(current, saved.current);

  const onEditorChange = useCallback((html: string, delta: unknown[]) => {
    operations.current = delta;
    // The editor reports its own normalised copy of a loaded draft once; that is not an edit.
    if (awaitingEditor.current) { saved.current = { ...saved.current, operations: delta }; awaitingEditor.current = false; }
    setMessage(html);
  }, []);

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  });

  function load(draft: OutreachDraft | null, copy?: Content) {
    const content: Content = draft
      ? { recipientEmail: draft.recipientEmail, recipientName: draft.recipientName, subject: draft.subject, previewText: draft.previewText, operations: draft.operations }
      : copy ?? blank;
    setCurrentId(draft?.id ?? null);
    setRecipient({ email: content.recipientEmail, name: content.recipientName, leadId: draft?.leadId ?? null });
    setSubject(content.subject);
    setPreviewText(content.previewText);
    operations.current = content.operations;
    setMessage("");
    awaitingEditor.current = content.operations.length > 0;
    setInitialOps(content.operations.length > 0 ? (content.operations as Op[]) : undefined);
    setEditorKey((key) => key + 1);
    // A copy starts out unsaved; a loaded draft starts out saved.
    saved.current = copy ? blank : content;
    setNotice(undefined);
  }

  const discardOk = () => !dirty || window.confirm("You have unsaved changes in this email. Discard them?");

  /** Saves the working copy as a draft (a new one, or an update to the open one). Returns its id, or null with a message shown. */
  async function save(): Promise<string | null> {
    try {
      const { draft } = await callOutreach<{ draft: OutreachDraft }>({
        op: "save",
        draft: { ...(currentId ? { id: currentId } : {}), recipientEmail: recipient.email, recipientName: recipient.name, leadId: recipient.leadId, subject, previewText, operations: operations.current },
      });
      setCurrentId(draft.id);
      setDrafts((list) => [draft, ...list.filter(({ id }) => id !== draft.id)]);
      saved.current = current;
      return draft.id;
    } catch (error) {
      if (recoverText(error)) return null;
      setNotice({ text: error instanceof Error ? error.message : "The draft could not be saved.", error: true });
      return null;
    }
  }

  /**
   * The draft was sent (or deleted) somewhere else while this window still had it open. Never lose the text, and never offer a way to send it
   * again from that draft: keep everything as a new, unsaved draft and say what happened.
   */
  function recoverText(error: unknown): boolean {
    if (!(error instanceof OutreachError) || (error.code !== "already_sent" && error.code !== "not_found")) return false;
    const content: Content = { recipientEmail: recipient.email, recipientName: recipient.name, subject, previewText, operations: operations.current };
    const gone = currentId;
    reviewDialog.current?.close();
    setFlow({ stage: "closed" });
    if (gone) setDrafts((list) => list.filter(({ id }) => id !== gone));
    load(null, content);
    setNotice({
      text: error.code === "already_sent"
        ? "This email was already sent (see Campaign history), so it cannot be sent again from this draft. Your text is kept below as a new unsaved draft."
        : "This draft no longer exists (it may have been deleted or sent in another window). Your text is kept below as a new unsaved draft.",
      error: false,
    });
    return true;
  }

  async function guarded(task: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try { await task(); } finally { inFlight.current = false; setBusy(false); }
  }

  const saveDraft = () => guarded(async () => { if (await save()) setNotice({ text: "Draft saved.", error: false }); });

  const removeDraft = (draft: OutreachDraft) => guarded(async () => {
    try {
      await callOutreach({ op: "delete", id: draft.id });
    } catch (error) {
      // Already gone elsewhere is fine; anything else is shown.
      if (!(error instanceof OutreachError && error.code === "not_found")) { setNotice({ text: error instanceof Error ? error.message : "The draft could not be deleted.", error: true }); return; }
    }
    setDrafts((list) => list.filter(({ id }) => id !== draft.id));
    if (draft.id === currentId) load(null);
    setNotice({ text: "Draft deleted.", error: false });
  });

  async function runReview(draftId: string) {
    setFlow({ stage: "loading" });
    try {
      const fetched = await callOutreach<ReviewResponse>({ op: "review", draftId, ...pending.current });
      // The contact is created by the first step; later steps find it already there, but it is still the contact created for this email.
      if (fetched.contact.created) createdHere.current = true;
      const data = createdHere.current ? { ...fetched, contact: { ...fetched.contact, created: true } } : fetched;
      if (data.campaignId) sendAttempted.current = false;
      setFlow({ stage: "review", data });
    } catch (error) {
      if (recoverText(error)) return;
      setFlow({ stage: "error", message: error instanceof Error ? error.message : "The review could not be loaded." });
    }
  }

  const startReview = () => guarded(async () => {
    setNotice(undefined);
    if (!isEmail(recipient.email)) { setNotice({ text: "Enter a valid email address for the recipient.", error: true }); return; }
    if (!subject.trim()) { setNotice({ text: "Enter a subject.", error: true }); return; }
    // The review always judges the saved draft, so save first: what you review is exactly what is stored.
    const id = dirty || !currentId ? await save() : currentId;
    if (!id) return;
    pending.current = {};
    createdHere.current = false;
    reviewDialog.current?.showModal();
    await runReview(id);
  });

  const continueReview = (extra: Continue) => guarded(async () => {
    // The server holds no state between steps, so evidence given earlier is sent again with each step.
    pending.current = { ...pending.current, ...extra };
    if (currentId) await runReview(currentId);
  });

  const confirmSend = () => guarded(async () => {
    if (flow.stage !== "review" || flow.data.status !== "ready" || !flow.data.campaignId || sendAttempted.current) return;
    const { data } = flow;
    const campaignId = data.campaignId as string;
    sendAttempted.current = true;
    setFlow({ stage: "sending", data });
    let error: string | undefined;
    try {
      await sendCampaignBatches(1, (offset) => sendBatch({
        campaignId, confirmed: true, offset, ...(data.exceptionCount > 0 ? { acknowledgeExceptions: true } : {}),
      }), () => undefined);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "The result could not be confirmed.";
    }
    let result: DeliveryResult | null = null;
    try { result = await callOutreach<DeliveryResult>({ op: "result", campaignId }); } catch { /* shown as unconfirmed below */ }
    // Once a delivery was attempted, the send record in Campaign history holds everything, so the draft (with the recipient's address) is removed.
    // A second tab that still has it open gets "no longer exists" and cannot send it again.
    if (result && result.status !== "none" && currentId) {
      setDrafts((list) => list.filter(({ id }) => id !== currentId));
      callOutreach({ op: "delete", id: currentId }).catch(() => undefined);
    }
    setFlow({ stage: "result", data, result, error });
  });

  const closeReview = () => { reviewDialog.current?.close(); setFlow({ stage: "closed" }); };
  const composeNext = () => { closeReview(); load(null); };
  const copyIntoNewDraft = () => { closeReview(); load(null, { ...blank, subject, previewText, operations: operations.current }); };
  /** After a send that did not succeed (or whose outcome is unclear): the text comes back as a new draft, with the same recipient, to review again. */
  const reopenWithRecipient = () => {
    closeReview();
    load(null, { recipientEmail: recipient.email, recipientName: recipient.name, subject, previewText, operations: operations.current });
    setNotice({ text: "Reopened as a new unsaved draft with the same recipient. The earlier attempt is in Campaign history, and you will be asked to confirm before sending again if it went out.", error: false });
  };
  /** Closing the result (Escape, or the back button): the text is discarded only after a confirmed send; otherwise it is kept. */
  const backToEditing = () => {
    const status = flow.stage === "result" ? flow.result?.status : undefined;
    if (status === "sent") composeNext();
    else if (status && status !== "none") reopenWithRecipient();
    else closeReview();
  };

  return <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <section className="grid min-w-0 gap-4 rounded-3xl border border-[#e6dcd4] bg-[#fffcf9] p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="font-serif text-2xl">Individual outreach</h2>
        <p className="text-sm text-[#655951]">One email to one person. You review the exact recipient and email, then send once. Each send is a separate, confirmed action.</p>
      </div>
      {unavailable && <p role="alert" className="rounded-lg border border-[#6b1f1f] bg-[#f8ece8] p-3 text-sm text-[#6b1f1f]">Individual outreach is not available yet: saved drafts could not be loaded. This usually means a database update has not been applied. The newsletter is not affected.</p>}
      <OutreachDraftList drafts={drafts} currentId={currentId} disabled={busy || unavailable}
        onNew={() => { if (discardOk()) load(null); }} onOpen={(draft) => { if (draft.id !== currentId && discardOk()) load(draft); }} onDelete={removeDraft} />
      <OutreachRecipient contacts={contacts} available={available} value={recipient} disabled={busy || unavailable} onChange={setRecipient} />
      <label className="grid gap-1 text-sm">Subject<input className={field} maxLength={180} value={subject} disabled={unavailable} onChange={(event) => setSubject(event.target.value)} /></label>
      <label className="grid gap-1 text-sm"><span>Preview text <span className="text-[#655951]">(optional)</span></span><input className={field} maxLength={160} value={previewText} disabled={unavailable} onChange={(event) => setPreviewText(event.target.value)} /></label>
      <NewsletterEditor key={editorKey} initialOperations={initialOps} storageOrigin={storageOrigin} onChange={onEditorChange}
        placeholder="Write your message…" label="Outreach message" />
      <TestEmailDialog dialog={testDialog} subject={subject} operations={operations} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy || unavailable || (!dirty && currentId !== null)} onClick={saveDraft}
          className="rounded-lg border border-[#daccc1] bg-white px-4 py-2 font-medium text-[#6b1f1f] hover:bg-[#efdfd8] disabled:opacity-50">Save draft</button>
        <button type="button" disabled={unavailable} onClick={() => testDialog.current?.showModal()}
          className="rounded-lg border border-[#daccc1] bg-white px-4 py-2 font-medium text-[#6b1f1f] hover:bg-[#efdfd8] disabled:opacity-50">Send Test</button>
        <button type="button" disabled={busy || unavailable || !recipient.email.trim() || !subject.trim()} onClick={startReview}
          className="rounded-lg bg-[#6b1f1f] px-4 py-2 text-white disabled:opacity-50">Review and send</button>
        {dirty && !unavailable && <span className="text-sm text-[#655951]">Unsaved changes</span>}
      </div>
      {busy && flow.stage === "closed" && <p role="status">Working…</p>}
      {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "text-[#6b1f1f]" : "text-[#315644]"}>{notice.text}</p>}
      <OutreachReviewDialog dialog={reviewDialog} flow={flow} onContinue={continueReview} onSend={confirmSend} onClose={backToEditing}
        onBackToEditing={backToEditing} onNext={composeNext} onCopy={copyIntoNewDraft} onReopen={reopenWithRecipient} />
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
