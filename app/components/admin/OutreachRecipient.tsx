"use client";

import { useState } from "react";
import type { recipientCandidates } from "@/app/lib/contact-tags/data";
import { preferenceLabel } from "@/app/lib/contact-tags/preferences";
import { matchingContacts } from "@/app/lib/email-audiences/model";

type Candidate = Awaited<ReturnType<typeof recipientCandidates>>[number];
export type Recipient = { email: string; name: string; leadId: string | null };

const field = "w-full min-w-0 rounded-lg border border-[#daccc1] bg-white px-3 py-2";
const segment = "min-h-10 px-3 py-1.5 text-sm";
const SHOWN = 8;

/** Who the email goes to: type an address (and optionally a name), or pick someone already in Contacts. */
export default function OutreachRecipient({ contacts, available, value, onChange, disabled }: {
  contacts: Candidate[]; available: boolean; value: Recipient; onChange: (next: Recipient) => void; disabled?: boolean;
}) {
  const [mode, setMode] = useState<"address" | "contact">("address");
  const [query, setQuery] = useState("");
  const linked = value.leadId ? contacts.find(({ id }) => id === value.leadId) : undefined;
  const results = mode === "contact" && query.trim().length >= 2 ? matchingContacts(contacts, { search_query: query, tag_ids: [] }).slice(0, SHOWN) : [];

  return <fieldset disabled={disabled} className="grid gap-3 rounded-2xl border border-[#e6dcd4] bg-[#f8f1eb] p-3 text-sm">
    <legend className="px-1 font-serif text-lg text-[#6b1f1f]">To</legend>
    <div role="group" aria-label="How to choose the recipient" className="inline-flex w-fit overflow-hidden rounded-lg border border-[#daccc1] bg-white">
      <button type="button" aria-pressed={mode === "address"} onClick={() => setMode("address")}
        className={`${segment} ${mode === "address" ? "bg-[#6b1f1f] text-white" : "text-[#6b1f1f] hover:bg-[#efdfd8]"}`}>Enter an email</button>
      <button type="button" aria-pressed={mode === "contact"} onClick={() => setMode("contact")} disabled={!available}
        className={`${segment} border-l border-[#daccc1] ${mode === "contact" ? "bg-[#6b1f1f] text-white" : "text-[#6b1f1f] hover:bg-[#efdfd8]"} disabled:opacity-50`}>Choose a contact</button>
    </div>

    {mode === "address" ? <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1">Email address
        <input type="email" inputMode="email" autoComplete="off" className={field} maxLength={254} value={value.email} placeholder="name@company.com"
          onChange={(event) => onChange({ ...value, email: event.target.value, leadId: null })} />
      </label>
      <label className="grid gap-1"><span>Name <span className="text-[#655951]">(optional)</span></span>
        <input autoComplete="off" className={field} maxLength={120} value={value.name} placeholder="First and last name"
          onChange={(event) => onChange({ ...value, name: event.target.value })} />
      </label>
    </div> : <div className="grid gap-2">
      {value.leadId && linked ? <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3">
        <span className="min-w-0 break-words"><strong>{linked.name || linked.email}</strong><br />{linked.email}<br />
          <span className={linked.state === "Eligible" ? "text-[#315644]" : "text-[#6b1f1f]"}>{preferenceLabel(linked.state, linked.reason)} · {linked.reason}</span></span>
        <button type="button" className="rounded-lg border border-[#daccc1] px-3 py-1.5 text-[#6b1f1f] hover:bg-[#efdfd8]"
          onClick={() => { onChange({ email: "", name: "", leadId: null }); setQuery(""); }}>Change contact</button>
      </div> : <>
        <label className="grid gap-1">Search contacts
          <input type="search" className={field} value={query} placeholder="Type at least 2 letters of a name or email" maxLength={254} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {query.trim().length >= 2 && !results.length && <p role="status">No contact matches. Use “Enter an email” to write to a new address.</p>}
        {results.length > 0 && <ul aria-label="Matching contacts" className="divide-y divide-[#e6dcd4] rounded-lg bg-white px-3">
          {results.map((contact) => <li key={contact.id}>
            <button type="button" className="block w-full min-w-0 break-words py-2 text-left hover:bg-[#f8f1eb]"
              onClick={() => { onChange({ email: contact.email.trim(), name: contact.name, leadId: contact.id }); setQuery(""); }}>
              <strong>{contact.name || contact.email}</strong><br />{contact.email}<br />
              <span className={contact.state === "Eligible" ? "text-[#315644]" : "text-[#6b1f1f]"}>{preferenceLabel(contact.state, contact.reason)} · {contact.reason}</span>
            </button>
          </li>)}
        </ul>}
        {!available && <p role="status">Contacts are unavailable. Enter an email address instead.</p>}
      </>}
    </div>}
    <p className="text-[#655951]">Writing to someone here does not subscribe them to the newsletter. Each email includes an unsubscribe link, and anyone who has unsubscribed or is suppressed is blocked.</p>
  </fieldset>;
}
