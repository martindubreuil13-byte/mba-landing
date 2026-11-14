"use client";

import { useSyncExternalStore, useState } from "react";
import type { recipientCandidates } from "@/app/lib/contact-tags/data";

type Candidate = Awaited<ReturnType<typeof recipientCandidates>>[number];
const key = "mba-email-selected-contact-ids";
const empty = "[]";

function subscribe(notify: () => void) {
  window.addEventListener(key, notify);
  return () => window.removeEventListener(key, notify);
}

function snapshot() {
  try { return sessionStorage.getItem(key) ?? empty; } catch { return empty; }
}

export default function RecipientPicker({ contacts, tags, available }: {
  contacts: Candidate[]; tags: { id: string; name: string }[]; available: boolean;
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [fallback, setFallback] = useState<string[]>([]);
  const [limit, setLimit] = useState(20);
  const stored = useSyncExternalStore(subscribe, snapshot, () => empty);
  const [chosenMode, setMode] = useState<string>();
  const mode = chosenMode ?? (stored !== empty ? "manual" : "recorded");
  let ids = fallback;
  try { const decoded: unknown = JSON.parse(stored); if (Array.isArray(decoded) && decoded.length) ids = decoded.filter((id): id is string => typeof id === "string"); } catch {}
  const selected = contacts.filter((contact) => ids.includes(contact.id));
  const picked = mode === "recorded" ? contacts.filter((contact) => contact.state === "Eligible") : selected;
  const eligible = picked.filter((contact) => contact.state === "Eligible");
  const excluded = picked.filter((contact) => contact.state !== "Eligible");
  const missing = mode === "manual" && available ? new Set(ids.filter((id) => !contacts.some((contact) => contact.id === id))).size : 0;
  const matching = contacts.filter((contact) => (!tag || contact.tags.includes(tag)) &&
    (contact.name + " " + contact.email).toLowerCase().includes(query.trim().toLowerCase()));
  function toggle(id: string) {
    const next = ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
    setFallback(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event(key)); } catch {}
  }

  const field = "w-full rounded-lg border border-[#daccc1] bg-white px-3 py-2";
  return <div className="min-w-0 space-y-3 rounded-2xl border border-[#e6dcd4] bg-[#f8f1eb] p-3 text-sm shadow-sm">
    <label className="grid gap-1">Audience
      <select className={field} value={mode} onChange={(event) => setMode(event.target.value)}>
        <option value="recorded">Recorded Opt-ins</option><option value="manual">Select Contacts</option>
      </select>
    </label>
    {!available ? <p role="status">Recipient eligibility is unavailable.</p> : <>
      <p role="status"><strong>{picked.length + missing}</strong> selected · <strong>{eligible.length}</strong> eligible · <strong>{excluded.length + missing}</strong> excluded</p>
      {mode === "manual" && <>
        <div className="flex flex-wrap gap-2">
          {selected.map((contact) => <button type="button" key={contact.id} onClick={() => toggle(contact.id)}
            className="rounded-full bg-[#efdfd8] px-3 py-1 text-[#6b1f1f]" aria-label={"Remove " + contact.email}>
            {contact.name || contact.email} ×
          </button>)}
        </div>
        {excluded.length > 0 && <ul className="text-[#6b1f1f]">{excluded.map((contact) =>
          <li key={contact.id}>{contact.name || contact.email} · {contact.reason}</li>)}</ul>}
        {missing > 0 && <p>{missing} previous selections are no longer available.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1">Search contacts<input type="search" className={field} value={query} placeholder="Name or email"
            onChange={(event) => { setQuery(event.target.value); setLimit(20); }} /></label>
          <label className="grid gap-1">Filter by tag<select className={field} value={tag} onChange={(event) => { setTag(event.target.value); setLimit(20); }}>
            <option value="">All tags</option>{tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
        </div>
        <ul className="max-h-64 divide-y divide-[#e6dcd4] overflow-auto rounded-lg bg-white px-3">
          {matching.slice(0, limit).map((contact) => <li key={contact.id} className="py-2">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-[#6b1f1f]" checked={ids.includes(contact.id)} onChange={() => toggle(contact.id)} />
              <span className="min-w-0 break-all"><strong>{contact.name || contact.email}</strong><br />{contact.email}<br />
                <span className={contact.state === "Eligible" ? "text-[#315644]" : "text-[#6b1f1f]"}>{contact.state} · {contact.reason}</span>
              </span>
            </label>
          </li>)}
        </ul>
        {!matching.length && <p>No matching contacts.</p>}
        {matching.length > limit && <button type="button" onClick={() => setLimit(limit + 20)} className="text-[#6b1f1f] underline">Show more contacts</button>}
      </>}
      <details><summary className="cursor-pointer text-[#6b1f1f]">Review eligible recipients</summary>
        <ul className="mt-2 max-h-40 overflow-auto">{eligible.map((contact) => <li key={contact.id} className="break-all">{contact.name} · {contact.email}</li>)}</ul>
        {!eligible.length && <p>No eligible recipients.</p>}
      </details>
    </>}
  </div>;
}
