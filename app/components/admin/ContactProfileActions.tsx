"use client";

import { useId, useRef } from "react";
import RelationshipForm from "./RelationshipForm";
import { saveContactProfile, setContactArchive } from "@/app/lib/contact-tags/actions";

type Profile = { id: string; firstName: string; lastName: string; email: string; archived: boolean };

const dialogStyle = "m-auto w-[min(92vw,30rem)] rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-6 text-[#27211d] shadow-xl backdrop:bg-black/35";
const field = "rounded-lg border border-[#daccc1] bg-white px-3 py-2";

export function EditContact({ contact }: { contact: Profile }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} className="mt-3 rounded-lg border border-[#b9958a] px-3 py-2 text-sm text-[#6b1f1f]">Edit Contact</button>
    <dialog ref={dialog} aria-labelledby={title} className={dialogStyle} onClose={(event) => event.currentTarget.querySelector("form")?.reset()}>
      <h2 id={title} className="mb-4 font-serif text-2xl">Edit Contact</h2>
      <RelationshipForm action={saveContactProfile} success="Contact saved." onSaved={() => dialog.current?.close()} className="grid gap-3 text-sm">
        <input type="hidden" name="lead" value={contact.id} />
        <input type="hidden" name="expected_email" value={contact.email} />
        <label className="grid gap-1">First name<input name="first_name" defaultValue={contact.firstName} maxLength={100} className={field} /></label>
        <label className="grid gap-1">Last name<input name="last_name" defaultValue={contact.lastName} maxLength={100} className={field} /></label>
        <label className="grid gap-1">Email<input name="email" type="email" required defaultValue={contact.email} maxLength={254} className={field} /></label>
        <div className="flex gap-3">
          <button className="rounded-lg bg-[#6b1f1f] px-3 py-2 text-white">Save changes</button>
          <button type="button" onClick={(event) => { event.currentTarget.form?.reset(); dialog.current?.close(); }}>Cancel</button>
        </div>
      </RelationshipForm>
    </dialog>
  </>;
}

export function ArchiveContact({ contact }: { contact: Profile }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const label = contact.archived ? "Restore Contact" : "Archive Contact";
  return <section className="mt-8 border-t border-[#e6dcd4] pt-5">
    <button type="button" onClick={() => dialog.current?.showModal()} className="rounded-lg border border-[#b9958a] px-3 py-2 text-sm text-[#6b1f1f]">{label}</button>
    <dialog ref={dialog} aria-labelledby={title} className={dialogStyle} key={label}>
      <h2 id={title} className="font-serif text-2xl">{label}</h2>
      <p className="my-3 break-words text-sm">{[contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email}<br />{contact.email}</p>
      <p className="mb-4 text-sm">{contact.archived ? "Return this contact to the active Contacts list." : "Hide this contact from active Contacts and Email Studio audiences. Their history stays available."}</p>
      <RelationshipForm action={setContactArchive} success={contact.archived ? "Contact restored." : "Contact archived."} onSaved={() => dialog.current?.close()} className="grid gap-3 text-sm">
        <input type="hidden" name="lead" value={contact.id} /><input type="hidden" name="email" value={contact.email} />
        <input type="hidden" name="operation" value={contact.archived ? "restore" : "archive"} />
        <label className="flex gap-2"><input type="checkbox" name="confirmed" value="yes" required />Confirm {contact.archived ? "restore" : "archive"}</label>
        <div className="flex gap-3">
          <button className="rounded-lg bg-[#6b1f1f] px-3 py-2 text-white">{label}</button>
          <button type="button" onClick={(event) => { event.currentTarget.form?.reset(); dialog.current?.close(); }}>Cancel</button>
        </div>
      </RelationshipForm>
    </dialog>
  </section>;
}
