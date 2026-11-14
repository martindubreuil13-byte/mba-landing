"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import NewsletterEditor from "./NewsletterEditor";
import { renderNewsletterEmail } from "@/app/lib/email-studio/render";
import RecipientPicker from "./RecipientPicker";
import type { ComponentProps } from "react";
import TestEmailDialog from "./TestEmailDialog";

export default function EmailComposer({ recipients, storageOrigin }: { recipients: ComponentProps<typeof RecipientPicker>; storageOrigin: string }) {
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const [message, setMessage] = useState("");
  const operations = useRef<unknown[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const onChange = useCallback((html: string, delta: unknown[]) => {
    operations.current = delta;
    setMessage(html);
  }, []);
  const field = "w-full rounded-lg border border-[#daccc1] bg-white px-3 py-2";
  return <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <section className="grid gap-4 min-w-0 rounded-3xl border border-[#e6dcd4] bg-[#fffcf9] p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-2xl">Compose</h2>
      <RecipientPicker {...recipients} />
      <label className="grid gap-1 text-sm">Subject<input className={field} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
      <NewsletterEditor storageOrigin={storageOrigin} onChange={onChange} />
      <TestEmailDialog dialog={dialog} subject={subject} operations={operations} />
      <div><button type="button" onClick={() => dialog.current?.showModal()} className="mr-2 rounded-lg bg-[#6b1f1f] px-4 py-2 text-white">Send Test</button><button type="button" disabled className="rounded-lg bg-[#eee4db] px-4 py-2 text-[#655951]">Send email</button>
        <p className="mt-2 text-xs text-[#655951]">Sending requires verified recipient consent, suppression reconciliation and sending authorization.</p></div>
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
        dangerouslySetInnerHTML={{ __html: renderNewsletterEmail(subject, message) }} />
      </div>
    </section>
  </div>;
}
