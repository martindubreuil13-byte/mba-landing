"use client";

import { useState, useTransition } from "react";
import type { recipientCandidates } from "@/app/lib/contact-tags/data";
import { mutateAudience } from "@/app/lib/email-audiences/actions";
import { addMatching, exclusionCounts, matchingContacts, type SavedAudience } from "@/app/lib/email-audiences/model";

type Candidate = Awaited<ReturnType<typeof recipientCandidates>>[number];
const pageSize = 20;
const field = "min-w-0 w-full rounded-lg border border-[#daccc1] bg-white px-3 py-2";
const actionClass = "rounded-lg border border-[#daccc1] bg-white px-3 py-2 font-medium text-[#6b1f1f] hover:bg-[#efdfd8] disabled:opacity-50";

export default function RecipientPicker({ contacts, tags, available, tagsAvailable, audiences, onReview }: {
  contacts: Candidate[]; tags: { id: string; name: string }[]; available: boolean;
  tagsAvailable: boolean; audiences: SavedAudience[] | null;
  onReview?: (ids: string[], description: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [limit, setLimit] = useState(pageSize);
  const [audienceId, setAudienceId] = useState("");
  const [operation, setOperation] = useState<"create" | "rename" | "delete" | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const idSet = new Set(ids);
  const picked = contacts.filter((contact) => idSet.has(contact.id));
  const eligible = picked.filter((contact) => contact.state === "Eligible");
  const excluded = exclusionCounts(picked);
  const matching = matchingContacts(contacts, { search_query: query, tag_ids: tagIds });
  const current = audiences?.find(({ id }) => id === audienceId);
  const unknownTags = tagIds.filter((id) => !tags.some((tag) => tag.id === id));

  function toggle(id: string) {
    setIds((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]);
  }

  function load(id: string) {
    const audience = audiences?.find((item) => item.id === id);
    setAudienceId(id);
    setQuery(audience?.search_query ?? "");
    setTagIds(audience?.tag_ids ?? []);
    setLimit(pageSize);
    setOperation(null);
    setError("");
    setNotice("");
  }

  function edit(next: typeof operation) {
    setOperation(next);
    setName(next === "rename" ? current?.name ?? "" : "");
    setError("");
    setNotice("");
  }

  function save() {
    if (!operation || (operation !== "create" && !current)) return;
    const input = operation === "create"
      ? { op: operation, name, search_query: query, tag_ids: tagIds }
      : { op: operation, name, id: current?.id };
    setError("");
    startTransition(async () => {
      try {
        const result = await mutateAudience(input);
        if ("error" in result && result.error) { setError(result.error); return; }
        setAudienceId(operation === "delete" ? "" : result.id ?? "");
        setOperation(null);
        setNotice(operation === "delete" ? "Audience deleted." : "Audience saved.");
      } catch {
        setError("The audience could not be saved. Try again.");
      }
    });
  }

  return <section aria-label="Recipients" className="min-w-0 space-y-3 rounded-2xl border border-[#e6dcd4] bg-[#f8f1eb] p-3 text-sm shadow-sm">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-serif text-xl text-[#6b1f1f]">Recipients</h2>
      {available && <span>{contacts.filter(({ state }) => state === "Eligible").length} recorded opt-ins</span>}
    </div>
    <fieldset disabled={pending} className="space-y-2">
      <label className="grid gap-1">Saved audience
        <select className={field} value={audienceId} disabled={!audiences} onChange={(event) => load(event.target.value)}>
          <option value="">Choose an audience</option>
          {audiences?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {audiences ? <div className="flex flex-wrap gap-2">
        <button type="button" className={actionClass} disabled={!available || !tagsAvailable || !!unknownTags.length} onClick={() => edit("create")}>Save current filters</button>
        {current && <>
          <button type="button" className={actionClass} onClick={() => edit("rename")}>Rename audience</button>
          <button type="button" className={actionClass} onClick={() => edit("delete")}>Delete audience</button>
        </>}
      </div> : <p role="status">Saved audiences are unavailable.</p>}
      {operation && <div className="space-y-2 rounded-lg bg-white p-3">
        {operation === "delete" ? <p>Delete “{current?.name}”?</p> : <label className="grid gap-1">Audience name
          <input className={field} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
        </label>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={actionClass} onClick={save} disabled={operation !== "delete" && !name.trim()}>
            {pending ? "Saving…" : operation === "delete" ? "Confirm delete" : "Save audience"}
          </button>
          <button type="button" className={actionClass} onClick={() => edit(null)}>Cancel</button>
        </div>
      </div>}
      {error && <p role="alert" className="text-[#6b1f1f]">{error}</p>}
      <p role="status" className={notice ? "text-[#315644]" : "sr-only"}>{notice}</p>
    </fieldset>
    {!available ? <p role="status">Recipient eligibility is unavailable.</p> : <>
      <label className="grid gap-1">Search contacts<input type="search" className={field} value={query} placeholder="Name or email" maxLength={254}
        onChange={(event) => { setQuery(event.target.value); setLimit(pageSize); }} /></label>
      <details className="rounded-lg border border-[#daccc1] bg-white p-3">
        <summary className="cursor-pointer font-medium text-[#6b1f1f]">Filter by Tag{tagIds.length ? ` (${tagIds.length} selected)` : ""}</summary>
        <p className="my-2 text-[#655951]">Contacts must have every selected tag.</p>
        <div className="grid max-h-40 gap-2 overflow-auto sm:grid-cols-2">
          {tags.map((tag) => <label key={tag.id} className="flex items-center gap-2">
            <input type="checkbox" className="accent-[#6b1f1f]" checked={tagIds.includes(tag.id)}
              onChange={() => { setTagIds((values) => values.includes(tag.id) ? values.filter((id) => id !== tag.id) : [...values, tag.id]); setLimit(pageSize); }} />
            <span className="break-words">{tag.name}</span>
          </label>)}
        </div>
        {!tagsAvailable ? <p>Tags could not be loaded.</p> : !tags.length && <p>No contact tags yet.</p>}
        {unknownTags.length > 0 && <p>Some saved tags are unavailable. Clear filters to start again.</p>}
      </details>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={actionClass} disabled={!query && !tagIds.length}
          onClick={() => { setQuery(""); setTagIds([]); setLimit(pageSize); }}>Clear filters</button>
        <button type="button" className={actionClass} disabled={!matching.some(({ id }) => !idSet.has(id))}
          onClick={() => setIds((previous) => addMatching(previous, matching))}>Select All Matching</button>
        <button type="button" className={actionClass} disabled={!ids.length} onClick={() => setIds([])}>Deselect All</button>
      </div>
      {onReview && <button type="button" className={actionClass} disabled={!picked.length} onClick={() => {
        const names = tags.filter((tag) => tagIds.includes(tag.id)).map((tag) => tag.name);
        const filters = [query.trim() && `Search: ${query.trim()}`, names.length && names.join(" + ")].filter(Boolean);
        onReview(picked.map(({ id }) => id), filters.join(" · ") || "No active filters");
      }}>Review campaign</button>}
      <p role="status"><strong>{matching.length}</strong> matching · <strong>{picked.length}</strong> selected · <strong>{eligible.length}</strong> eligible for marketing · <strong>{picked.length - eligible.length}</strong> excluded</p>
      {excluded.size > 0 && <ul aria-label="Exclusion reasons" className="text-[#6b1f1f]">{[...excluded].map(([reason, count]) =>
        <li key={reason}>{count} · {reason}</li>)}</ul>}
      <ul className="max-h-64 divide-y divide-[#e6dcd4] overflow-auto rounded-lg bg-white px-3">
        {matching.slice(0, limit).map((contact) => <li key={contact.id} className="py-2">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 accent-[#6b1f1f]" checked={idSet.has(contact.id)} onChange={() => toggle(contact.id)} />
            <span className="min-w-0 break-words"><strong>{contact.name || contact.email}</strong><br />{contact.email}<br />
              <span className={contact.state === "Eligible" ? "text-[#315644]" : "text-[#6b1f1f]"}>{contact.state} · {contact.reason}</span>
            </span>
          </label>
        </li>)}
      </ul>
      {!matching.length && <p>No matching contacts.</p>}
      {matching.length > limit && <button type="button" onClick={() => setLimit(limit + pageSize)} className={actionClass}>Show more contacts</button>}
      <details className="rounded-lg border border-[#daccc1] bg-white p-3">
        <summary className="cursor-pointer font-medium text-[#6b1f1f]">Review selected contacts</summary>
        {picked.length ? <ul className="mt-2 max-h-48 divide-y divide-[#e6dcd4] overflow-auto">
          {picked.map((contact) => <li key={contact.id} className="flex items-center justify-between gap-2 py-2">
            <span className="min-w-0 break-words">{contact.name || contact.email} · {contact.state}</span>
            <button type="button" className={actionClass} onClick={() => toggle(contact.id)} aria-label={`Remove ${contact.email}`}>Remove</button>
          </li>)}
        </ul> : <p className="mt-2">No contacts selected.</p>}
      </details>
    </>}
  </section>;
}
