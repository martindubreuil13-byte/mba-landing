"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CopyLinkButton from "./CopyLinkButton";
import { postJson, useToasts } from "./Toast";
import { useAdminBase } from "./AdminContext";
import { btnPrimary, field, label, textLink } from "@/app/components/scheduling/ui";
import { BUFFER_OPTIONS, DEFAULT_BUFFER_AFTER, DEFAULT_BUFFER_BEFORE } from "@/app/lib/scheduling/constants";
import type { MeetingType } from "@/app/lib/scheduling/types";
import { typeLinkPath } from "@/app/lib/scheduling/admin-views";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const HELP = "mt-2 text-xs leading-relaxed text-[#1a1816]/45";

type Draft = { id?: string; name: string; slug: string; description: string; durationMinutes: string; priceLabel: string; visibility: "public" | "invitation"; inviteCode: string; minNoticeHours: string; bufferBeforeMinutes: string; bufferAfterMinutes: string; maxPerDay: string; slotIntervalMinutes: string; active: boolean };

const toDraft = (t?: MeetingType): Draft => t ? {
  id: t.id, name: t.name, slug: t.slug, description: t.description, durationMinutes: String(t.durationMinutes), priceLabel: t.priceLabel ?? "", visibility: t.visibility, inviteCode: t.inviteCode ?? "",
  minNoticeHours: String(t.minNoticeHours), bufferBeforeMinutes: String(t.bufferBeforeMinutes), bufferAfterMinutes: String(t.bufferAfterMinutes), maxPerDay: t.maxPerDay === null ? "" : String(t.maxPerDay), slotIntervalMinutes: String(t.slotIntervalMinutes), active: t.active,
} : { name: "", slug: "", description: "", durationMinutes: "30", priceLabel: "", visibility: "public", inviteCode: "", minNoticeHours: "24", bufferBeforeMinutes: String(DEFAULT_BUFFER_BEFORE), bufferAfterMinutes: String(DEFAULT_BUFFER_AFTER), maxPerDay: "", slotIntervalMinutes: "30", active: true };

export default function MeetingTypeForm({ type }: { type?: MeetingType }) {
  const router = useRouter();
  const { api, routes } = useAdminBase();
  const { push, node } = useToasts();
  const [d, setD] = useState<Draft>(() => toDraft(type));
  const [slugTouched, setSlugTouched] = useState(!!type);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const body = {
      id: d.id, name: d.name, slug: d.slug, description: d.description, durationMinutes: Number(d.durationMinutes), priceLabel: d.priceLabel || undefined, visibility: d.visibility, inviteCode: d.visibility === "invitation" ? d.inviteCode || undefined : undefined,
      minNoticeHours: Number(d.minNoticeHours), bufferBeforeMinutes: Number(d.bufferBeforeMinutes), bufferAfterMinutes: Number(d.bufferAfterMinutes), maxPerDay: d.maxPerDay.trim() === "" ? null : Number(d.maxPerDay), slotIntervalMinutes: Number(d.slotIntervalMinutes), active: d.active,
    };
    const r = await postJson(`${api}/meeting-types`, body);
    setBusy(false);
    if (!r.ok) { setError(String(r.data.error ?? "Could not save.")); return; }
    const saved = r.data.meetingType as MeetingType;
    push(type ? `Saved “${saved.name}”.` : `Created “${saved.name}”. Next: set its availability.`);
    if (!type) router.push(`${routes}/availability?type=${saved.id}`); else { setD(toDraft(saved)); router.refresh(); }
  };

  const link = typeLinkPath({ slug: d.slug || "your-link", visibility: d.visibility, inviteCode: d.inviteCode || (d.visibility === "invitation" ? "…" : undefined) });
  return (
    <form onSubmit={save} className="max-w-3xl space-y-10" noValidate>
      {node}
      <div className="grid gap-8 md:grid-cols-2">
        <div><label className={label} htmlFor="mt-name">Meeting name</label>
          <input id="mt-name" className={field} value={d.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></div>
        <div><label className={label} htmlFor="mt-slug">Booking link</label>
          <div className="flex items-baseline border-b border-[#1a1816]/25 focus-within:border-[#6b1f1f]"><span className="text-sm text-[#1a1816]/40">/book/</span><input id="mt-slug" className="w-full bg-transparent py-3 pl-1 text-base focus:outline-none" value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div>
          {type && <p className={HELP}>Changing this changes the public link. Share the new one.</p>}</div>
      </div>
      <div><label className={label} htmlFor="mt-desc">Description <span className="normal-case tracking-normal">(shown to visitors)</span></label>
        <textarea id="mt-desc" rows={3} className={`${field} resize-y`} value={d.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="grid gap-8 md:grid-cols-3">
        <div><label className={label} htmlFor="mt-dur">Duration (minutes)</label><input id="mt-dur" inputMode="numeric" className={field} value={d.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} /></div>
        <div><label className={label} htmlFor="mt-format">Format</label><select id="mt-format" className={field} value="zoom" disabled onChange={() => undefined}><option value="zoom">Zoom</option></select><p className={HELP}>Zoom is the only format in Phase 1.</p></div>
        <div><label className={label} htmlFor="mt-price">Price label <span className="normal-case tracking-normal">(optional)</span></label><input id="mt-price" className={field} placeholder="Complimentary" value={d.priceLabel} onChange={(e) => set("priceLabel", e.target.value)} /></div>
      </div>

      <div>
        <p className={label}>Buffers</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#1a1816]/55">Free time kept clear around this meeting. It applies against every other meeting type and against Google Calendar, so two meetings are never booked too close together.</p>
        <div className="mt-4 grid gap-8 md:grid-cols-3">
          <div><label className={label} htmlFor="mt-bb">Buffer before</label>
            <select id="mt-bb" className={field} value={d.bufferBeforeMinutes} onChange={(e) => set("bufferBeforeMinutes", e.target.value)}>{BUFFER_OPTIONS.map((m) => <option key={m} value={m}>{m === 0 ? "None" : `${m} minutes`}</option>)}</select></div>
          <div><label className={label} htmlFor="mt-ba">Buffer after</label>
            <select id="mt-ba" className={field} value={d.bufferAfterMinutes} onChange={(e) => set("bufferAfterMinutes", e.target.value)}>{BUFFER_OPTIONS.map((m) => <option key={m} value={m}>{m === 0 ? "None" : `${m} minutes`}{m === DEFAULT_BUFFER_AFTER ? " (default)" : ""}</option>)}</select></div>
        </div>
      </div>

      <fieldset>
        <legend className={`${label} mb-4`}>Who can book</legend>
        <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="vis" checked={d.visibility === "public"} onChange={() => set("visibility", "public")} className="accent-[#6b1f1f]" />Anyone with the link</label>
          <label className="flex items-center gap-2"><input type="radio" name="vis" checked={d.visibility === "invitation"} onChange={() => set("visibility", "invitation")} className="accent-[#6b1f1f]" />Invitation only (the link carries a private code)</label>
        </div>
        {d.visibility === "invitation" && <div className="mt-5 max-w-xs"><label className={label} htmlFor="mt-code">Invitation code</label><input id="mt-code" className={field} placeholder="Generated if left empty" value={d.inviteCode} onChange={(e) => set("inviteCode", e.target.value)} /></div>}
      </fieldset>

      <details className="group border-y border-[#1a1816]/[.12] py-4">
        <summary className="cursor-pointer text-sm tracking-wide text-[#1a1816]/75 marker:text-[#6b1f1f]">Booking rules <span className="text-[#1a1816]/40">· notice, daily limit, start spacing</span></summary>
        <div className="mt-6 grid gap-8 md:grid-cols-3">
          <div><label className={label} htmlFor="mt-notice">Minimum notice (hours)</label><input id="mt-notice" inputMode="numeric" className={field} value={d.minNoticeHours} onChange={(e) => set("minNoticeHours", e.target.value)} /></div>
          <div><label className={label} htmlFor="mt-max">Max bookings per day</label><input id="mt-max" inputMode="numeric" placeholder="Unlimited" className={field} value={d.maxPerDay} onChange={(e) => set("maxPerDay", e.target.value)} /></div>
          <div><label className={label} htmlFor="mt-step">Start times every (min)</label><input id="mt-step" inputMode="numeric" className={field} value={d.slotIntervalMinutes} onChange={(e) => set("slotIntervalMinutes", e.target.value)} /></div>
        </div>
      </details>

      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} className="mt-1 accent-[#6b1f1f]" /><span>Active<span className="block text-xs text-[#1a1816]/45">Inactive meeting types have no public page; existing bookings are kept.</span></span></label>

      <div className="border-l-2 border-[#6b1f1f] pl-5 text-sm"><p className={label}>Booking link</p><p className="mt-2 break-all font-mono text-xs text-[#1a1816]/70">{link}</p>
        <p className="mt-3 flex gap-5"><CopyLinkButton path={link} onCopied={(u) => push(`Copied: ${u}`)} />{type && <a className={textLink} href={link} target="_blank" rel="noreferrer">Open page ↗</a>}</p></div>

      {error && <p role="alert" className="border-l-2 border-[#8b2525] pl-3 text-sm text-[#8b2525]">{error}</p>}
      <div className="flex flex-wrap items-center gap-8">
        <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : type ? "Save changes" : "Create meeting type"}</button>
        <Link href={`${routes}/meeting-types`} className={textLink}>Back to list</Link>
        {type && <Link href={`${routes}/availability?type=${type.id}`} className={textLink}>Edit availability →</Link>}
      </div>
    </form>
  );
}
