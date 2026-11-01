"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CommunityModal from "./CommunityModal";
import { eyebrow, label, textLink } from "./ui";
import type { PublicBooking } from "@/app/lib/scheduling/service";
import { communityPromptDue } from "@/app/lib/scheduling/community";
import { DEMO_REFERENCE } from "@/app/lib/scheduling/constants";
import { formatDateLong, formatTime, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

/** While the Zoom link is being prepared: poll quickly at first, then gently, and stop after five minutes (the email follows regardless). */
const pollDelay = (n: number) => (n < 20 ? 3000 : 10000);
const POLL_GIVE_UP_MS = 5 * 60_000;

export default function ConfirmationView({ booking: initial }: { booking: PublicBooking }) {
  const [booking, setBooking] = useState(initial);
  const [replaying, setReplaying] = useState(false);
  const waiting = booking.status === "confirmed" && booking.progress !== "ready";
  useEffect(() => {
    if (!waiting) return;
    let stopped = false, timer: ReturnType<typeof setTimeout>, n = 0;
    const began = Date.now();
    const tick = async () => {
      try {
        const r = await fetch(`/api/scheduling/booking/${encodeURIComponent(initial.reference)}`, { cache: "no-store" });
        if (r.ok && !stopped) setBooking(((await r.json()) as { booking: PublicBooking }).booking);
      } catch { /* try again on the next tick */ }
      if (!stopped && Date.now() - began < POLL_GIVE_UP_MS) timer = setTimeout(tick, pollDelay(++n));
    };
    timer = setTimeout(tick, pollDelay(0));
    return () => { stopped = true; clearTimeout(timer); };
  }, [waiting, initial.reference]);
  const start = Date.parse(booking.startUtc), end = Date.parse(booking.endUtc), tz = booking.guestTimeZone;
  const canceled = booking.status === "canceled";

  const replay = async () => {
    setReplaying(true);
    await fetch("/api/scheduling/replay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reference: booking.reference }) }).catch(() => undefined);
    window.location.reload();
  };
  const spec = (name: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-4 border-t border-[#1a1816]/[.12] py-5"><dt className={label}>{name}</dt><dd className="min-w-0 break-words text-[17px] text-[#1a1816]/90">{value}</dd></div>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 pb-28 pt-14 md:px-10 lg:pt-24">
      {canceled ? (
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[.3em] text-[#8b2525]">Booking canceled</p>
          <h1 className="mt-6 text-5xl font-light tracking-tight md:text-6xl">This meeting has been canceled.</h1>
          <p className="mt-8 text-lg font-light leading-[1.8] text-[#1a1816]/70">You are welcome to <Link href={`/book/${booking.slug}`} className={textLink}>book another time</Link>.</p>
        </div>
      ) : (
        <div className="grid gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24">
          <div>
            <p className={eyebrow}>Booking confirmed</p>
            <h1 className="mt-6 text-5xl font-light leading-[1.04] tracking-[-0.025em] md:text-7xl">We’re on the calendar.</h1>
            <div aria-hidden className="my-8 h-px w-12 bg-[#6b1f1f]" />
            <p aria-live="polite" className="max-w-lg text-lg font-light leading-[1.8] text-[#1a1816]/70">{
              booking.progress === "ready" ? "Your meeting is confirmed. You’ll receive an email shortly with the details and your Zoom link."
                : booking.progress === "preparing" ? "Your time is reserved. We’re preparing your calendar invitation and Zoom link now; this page will update in a moment."
                : "Your time is reserved. Your Zoom link is taking longer than usual to set up. We’ll email it as soon as it’s ready, and you don’t need to do anything."
            }</p>
          </div>

          <div className="lg:pt-3">
            <p className={`${label} mb-4`}>{booking.meetingName} · {booking.durationMinutes} minutes</p>
            <dl className="border-b border-[#1a1816]/[.12]">
              {spec("Date", formatDateLong(start, tz))}
              {spec("Time", `${formatTime(start, tz)} – ${formatTime(end, tz)}`)}
              {spec("Time zone", <>{tz.replace(/_/g, " ")} <span className="text-[#1a1816]/45">· {zoneOffsetLabel(start, tz)}</span></>)}
              {spec("Zoom", booking.zoom.joinUrl
                ? <a href={booking.zoom.joinUrl} target="_blank" rel="noopener noreferrer" className={`break-all text-sm ${textLink}`}>{booking.zoom.joinUrl}</a>
                : <span aria-live="polite" className="text-[15px]">{booking.progress === "preparing" ? "Preparing your Zoom link…" : "We’ll email your Zoom link as soon as it’s ready."}</span>)}
            </dl>
            {booking.notice && <p role="note" className="mt-6 text-xs leading-relaxed text-[#1a1816]/45">{booking.notice}</p>}
          </div>
        </div>
      )}

      {booking.reference === DEMO_REFERENCE && (
        <p className="mt-16 text-xs text-[#1a1816]/40">Sample booking for design review. <button type="button" onClick={replay} disabled={replaying} className="underline underline-offset-2 hover:text-[#6b1f1f]">Show the community invitation again</button></p>
      )}
      {/* Offered only once the booking is confirmed AND its Zoom details are ready, and only until an answer has been recorded (yes, no, or closed). */}
      {communityPromptDue(booking) && <CommunityModal reference={booking.reference} />}
    </div>
  );
}
