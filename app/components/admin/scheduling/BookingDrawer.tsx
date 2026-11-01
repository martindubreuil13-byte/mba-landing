"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";
import RescheduleDialog from "./RescheduleDialog";
import ZoomResolvePanel from "./ZoomResolvePanel";
import { postJson, useToasts } from "./Toast";
import { useAdminBase } from "./AdminContext";
import { btnDanger, btnPrimary, btnQuiet, eyebrow, label, textLink } from "@/app/components/scheduling/ui";
import type { BookingRow } from "@/app/lib/scheduling/admin-views";
import { formatDateShort, formatTime, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

const COMMUNITY: Record<string, string> = { unseen: "Not shown yet", shown: "Shown, no answer", joined: "Said yes (simulated)", declined: "Said no", dismissed: "Closed without answering" };

/**
 * One panel for everything you can do with a booking. Used identically from the agenda, the calendar and the bookings list,
 * so a booking is managed the same way wherever you find it.
 */
export function useBookingDrawer(rows: BookingRow[], homeTimeZone: string) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { push, node: toasts } = useToasts();
  const booking = rows.find((r) => r.id === openId) ?? null;
  const node = <>{toasts}{booking && <BookingDrawer key={booking.id} booking={booking} homeTimeZone={homeTimeZone} onClose={() => setOpenId(null)} push={push} />}</>;
  return { open: setOpenId, node };
}

function BookingDrawer({ booking: b, homeTimeZone: tz, onClose, push }: { booking: BookingRow; homeTimeZone: string; onClose: () => void; push: (t: string, tone?: "ok" | "error") => void }) {
  const router = useRouter();
  const { api } = useAdminBase();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [moving, setMoving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const canceled = b.status === "canceled";
  const start = Date.parse(b.startUtc), end = Date.parse(b.endUtc);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !moving) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, moving]);

  const call = async (action: string, body: unknown, success: (d: Record<string, unknown>) => string): Promise<string | null> => {
    setBusy(action);
    const r = await postJson(`${api}/bookings/${b.id}/${action}`, body ?? {});
    setBusy(null);
    if (r.ok) { push(success(r.data)); router.refresh(); return null; }
    const msg = String(r.data.error ?? "That did not work.");
    push(msg, "error");
    return msg;
  };

  const row = (name: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[110px_1fr] gap-4 border-t border-[#1a1816]/[.12] py-3.5 text-sm"><dt className={label}>{name}</dt><dd className="min-w-0 break-words text-[#1a1816]/85">{value}</dd></div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1a1816]/40" onMouseDown={(e) => { if (e.target === e.currentTarget && !moving) onClose(); }}>
      <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="relative h-full w-full max-w-[460px] overflow-y-auto bg-[#f5f1ed] p-8 outline-none shadow-[-24px_0_60px_-30px_rgba(26,24,22,.5)] sm:p-10">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center text-[#1a1816]/45 hover:text-[#6b1f1f]"><X aria-hidden className="h-5 w-5" /></button>
        <p className={eyebrow}>{b.typeName} · {b.durationMinutes} min</p>
        <h2 id="drawer-title" className="mt-3 text-3xl font-light leading-tight tracking-tight">{b.guestName}</h2>
        <p className="mt-1 text-[#1a1816]/60"><a className={textLink} href={`mailto:${b.guestEmail}`}>{b.guestEmail}</a></p>
        <p className="mt-4 flex items-center gap-2 text-sm"><span aria-hidden className={`h-2 w-2 rounded-full ${canceled ? "bg-[#8b2525]" : "bg-[#2f5d3a]"}`} />{canceled ? "Canceled" : "Confirmed"}{b.rescheduled && !canceled ? " · rescheduled" : ""}</p>

        {!canceled && (
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" disabled={!!busy} onClick={() => setMoving(true)} className={btnPrimary}>Reschedule</button>
            <button type="button" disabled={!!busy} onClick={() => call("resend", {}, (d) => `Confirmation resent to ${d.to}${d.simulated ? " (simulated: see the outbox on the Overview)." : "."}`)} className={btnQuiet}>{busy === "resend" ? "Sending…" : "Resend confirmation"}</button>
          </div>
        )}

        <dl className="mt-8 border-b border-[#1a1816]/[.12]">
          {row("When", <>{formatDateShort(start, tz)} · {formatTime(start, tz)} – {formatTime(end, tz)} <span className="text-[#1a1816]/45">{zoneOffsetLabel(start, tz)}</span></>)}
          {row("Guest’s time", <>{formatTime(start, b.guestTimeZone)} <span className="text-[#1a1816]/45">{b.guestTimeZone.replace(/_/g, " ")}</span></>)}
          {row("Zoom", b.zoom.joinUrl ? <span>{b.zoom.joinUrl}{b.zoom.joinUrl.includes("simulated-zoom") && <span className="text-[#1a1816]/45"> (simulated)</span>}</span> : b.recovery.state === "syncing" ? <span className="text-[#1a1816]/60">Being created…</span> : b.zoom.uncertainSince ? <span className="text-[#8b2525]">Creation outcome unknown: Zoom may already have created it. See below.</span> : b.recovery.state === "failed" ? <span className="text-[#8b2525]">Not created: gave up. Fix the cause, then Retry now.</span> : <span className="text-[#8b2525]">Pending: will be retried automatically</span>)}
          {row("Sync", b.sync.status === "ok" ? "Up to date with Zoom, Google Calendar and email" : (
            <span className={b.sync.status === "failed" ? "text-[#8b2525]" : ""}>
              {b.sync.status === "failed" ? (b.zoom.uncertainSince ? "Stopped: the Zoom meeting needs your decision." : "Gave up after repeated failures.") : b.recovery.state === "syncing" ? "Syncing with Zoom, Google Calendar and email…" : b.recovery.state === "stuck" ? "Waiting for the recovery worker, which has not picked this up. Retry now, and check Integrations." : `Retrying (attempt ${b.sync.attempts}${b.sync.nextAttemptAt ? `, next ${formatDateShort(Date.parse(b.sync.nextAttemptAt), tz)} ${formatTime(Date.parse(b.sync.nextAttemptAt), tz)}` : ""}).`}
              {b.sync.lastError && <span className="block text-[#1a1816]/55">{b.sync.lastError}</span>}
              <button type="button" disabled={!!busy} onClick={() => call("retry-sync", {}, (d) => (d.synced ? "Synced." : `Still failing: ${String((d.errors as string[])?.[0] ?? "see the booking history")}`))} className={`mt-2 block ${textLink}`}>{busy === "retry-sync" ? "Checking…" : b.zoom.uncertainSince ? "Check Zoom again" : "Retry now"}</button>
            </span>))}
          {b.zoom.uncertainSince && !b.zoom.joinUrl && (
            <ZoomResolvePanel marker={b.zoomMarker} since={b.zoom.uncertainSince} tz={tz} busy={!!busy}
              onAdopt={(meetingId) => call("resolve-zoom", { action: "adopt", meetingId, intentAt: b.zoom.uncertainSince }, (d) => (d.synced ? "Meeting adopted and checked." : "Meeting adopted. The check is still pending."))}
              onNone={() => call("resolve-zoom", { action: "none-exists", acknowledgeDuplicateRisk: true, intentAt: b.zoom.uncertainSince }, (d) => (d.synced ? "A new meeting was created." : "Decision recorded. A new meeting will be created."))} />
          )}
          {b.conflict && b.status === "confirmed" && row("Calendar", <span className="text-[#8b2525]">Overlaps another event on your Google Calendar. The booking stands; review it and reschedule one of them if needed.</span>)}
          {row("Source", b.source ?? "Unknown")}
          {row("Message", b.guestMessage ? <span className="whitespace-pre-wrap">{b.guestMessage}</span> : "—")}
          {row("Community", COMMUNITY[b.community] ?? b.community)}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <CopyLinkButton path={b.typeLink} label="Copy booking link" onCopied={(u) => push(`Copied: ${u}`)} />
          <a className={textLink} href={`/book/confirmed/${b.reference}`} target="_blank" rel="noreferrer">Guest confirmation ↗</a>
        </div>

        <section aria-label="History" className="mt-10">
          <h3 className={label}>History</h3>
          <ul className="mt-3 space-y-2 text-sm">{[...b.events].reverse().map((e, i) => <li key={i}><span className="text-[#1a1816]/45">{formatDateShort(Date.parse(e.at), tz)} {formatTime(Date.parse(e.at), tz)}</span> · {e.detail}</li>)}</ul>
        </section>

        {!canceled && (
          <section className="mt-10 border-t border-[#1a1816]/[.12] pt-6">
            {!confirmCancel ? (
              <button type="button" disabled={!!busy} onClick={() => setConfirmCancel(true)} className={btnDanger}>Cancel booking</button>
            ) : (
              <div role="alertdialog" aria-label="Confirm cancellation">
                <p className="text-sm text-[#1a1816]/75">Cancel {b.guestName}’s {b.typeName}? The time is released and a cancellation message is queued in the simulated outbox.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" disabled={!!busy} onClick={async () => { const p = await call("cancel", {}, () => `Canceled ${b.guestName}’s booking. Cancellation message queued in the simulated outbox.`); if (!p) onClose(); }} className={btnDanger}>{busy === "cancel" ? "Canceling…" : "Yes, cancel it"}</button>
                  <button type="button" onClick={() => setConfirmCancel(false)} className={btnQuiet}>Keep booking</button>
                </div>
              </div>
            )}
          </section>
        )}
      </aside>

      {moving && <RescheduleDialog booking={b} homeTimeZone={tz} onClose={() => setMoving(false)}
        onConfirm={async (startUtc) => { const p = await call("reschedule", { startUtc }, () => `Moved ${b.guestName}’s booking. A reschedule message is queued in the simulated outbox.`); if (!p) setMoving(false); return p; }} />}
    </div>
  );
}
