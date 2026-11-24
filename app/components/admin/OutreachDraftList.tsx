"use client";

import { useState } from "react";
import { draftLabel, type OutreachDraft } from "@/app/lib/email-outreach/model";

const action = "rounded-lg border border-[#daccc1] bg-white px-3 py-1.5 text-sm font-medium text-[#6b1f1f] hover:bg-[#efdfd8] disabled:opacity-50";

/** The saved outreach drafts: open one to keep working, start another, or delete one. */
export default function OutreachDraftList({ drafts, currentId, onOpen, onNew, onDelete, disabled }: {
  drafts: OutreachDraft[]; currentId: string | null; onOpen: (draft: OutreachDraft) => void; onNew: () => void;
  onDelete: (draft: OutreachDraft) => void; disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  return <section aria-labelledby="outreach-drafts" className="grid gap-3 rounded-2xl border border-[#e6dcd4] bg-[#f8f1eb] p-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 id="outreach-drafts" className="font-serif text-lg text-[#6b1f1f]">Drafts <span className="font-sans text-sm text-[#655951]">({drafts.length})</span></h3>
      <button type="button" className={action} disabled={disabled} onClick={onNew}>New draft</button>
    </div>
    {!drafts.length ? <p className="text-[#655951]">No saved drafts. Write an email below and choose Save draft to keep it for later.</p> :
      <ul className="max-h-60 divide-y divide-[#e6dcd4] overflow-auto rounded-lg bg-white px-3">
        {drafts.map((draft) => {
          const { who, subject } = draftLabel(draft);
          const open = draft.id === currentId;
          return <li key={draft.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <button type="button" disabled={disabled} aria-current={open ? "true" : undefined} onClick={() => onOpen(draft)}
              className={`min-w-0 flex-1 break-words text-left ${open ? "font-semibold text-[#6b1f1f]" : ""} hover:underline`}>
              {who}<br /><span className="font-normal text-[#655951]">{subject}</span><br />
              <span className="text-xs font-normal text-[#655951]">Saved {new Date(draft.updatedAt).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" })} (Bangkok)</span>
            </button>
            {confirming === draft.id ? <span className="flex items-center gap-2" role="group" aria-label={`Delete draft to ${who}?`}>
              <span>Delete?</span>
              <button type="button" className={action} disabled={disabled} onClick={() => { setConfirming(null); onDelete(draft); }}>Yes, delete</button>
              <button type="button" className={action} onClick={() => setConfirming(null)}>Keep</button>
            </span> : <button type="button" className={action} disabled={disabled} aria-label={`Delete draft to ${who}`} onClick={() => setConfirming(draft.id)}>Delete</button>}
          </li>;
        })}
      </ul>}
  </section>;
}
