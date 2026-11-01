"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SlotPicker, { type PickerSlot } from "./SlotPicker";
import TimeZoneSelect from "./TimeZoneSelect";
import { btnPrimary, eyebrow, field, focusRing, label } from "./ui";
import type { PublicMeetingType } from "@/app/lib/scheduling/service";
import { formatDateLong, formatTime, isValidTimeZone, zoneOffsetLabel } from "@/app/lib/scheduling/timezone";

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function BookingExperience({ type, invite, source }: { type: PublicMeetingType; invite?: string; source?: string }) {
  const router = useRouter();
  const [tz, setTz] = useState<string | null>(null);
  const [hour12, setHour12] = useState(true);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const key = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Detect the visitor's zone on the client only (never during render, so server and browser markup match).
  useEffect(() => {
    let detected = "UTC";
    try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; if (isValidTimeZone(z)) detected = z; } catch { /* keep UTC */ }
    setTz(detected);
  }, []);
  useEffect(() => { if (step === "details") heading.current?.focus(); }, [step]);

  const load = useCallback(async (from: string, to: string): Promise<PickerSlot[]> => {
    const q = new URLSearchParams({ type: type.slug, from, to });
    if (invite) q.set("invite", invite);
    const r = await fetch(`/api/scheduling/slots?${q}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Availability could not be loaded.");
    return j.slots as PickerSlot[];
  }, [type.slug, invite]);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Please enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length || !selected || !tz || busy) return;
    setBusy(true); setNotice("");
    key.current ??= newKey();
    try {
      const r = await fetch("/api/scheduling/book", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: type.slug, invite, startUtc: selected, name: form.name, email: form.email, message: form.message, timeZone: tz, idempotencyKey: key.current, source }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { router.push(`/book/confirmed/${j.booking.reference}`); return; }
      if (r.status === 409) { setNotice(j.error || "That time is no longer available. Please choose another."); setSelected(null); setStep("pick"); setPickerKey((k) => k + 1); key.current = null; }
      else if (r.status === 400 && j.field && ["guestName", "guestEmail"].includes(j.field)) setErrors({ [j.field === "guestName" ? "name" : "email"]: j.error });
      else setNotice(j.error || "We couldn’t complete the booking. Please try again.");
    } catch { setNotice("We couldn’t reach the server. Please check your connection and try again."); }
    finally { setBusy(false); }
  };

  const start = selected ? Date.parse(selected) : null;
  const end = start ? start + type.durationMinutes * 60_000 : null;
  const spec = (name: string, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-6 border-t border-[#1a1816]/[.12] py-4 text-[15px]"><dt className={label}>{name}</dt><dd className="text-right text-[#1a1816]/85">{value}</dd></div>
  );
  const stepLabel = (n: string, text: string, on: boolean) => (
    <li aria-current={on ? "step" : undefined} className={`flex items-baseline gap-3 border-b pb-3 transition ${on ? "border-[#6b1f1f] text-[#1a1816]" : "border-transparent text-[#1a1816]/35"}`}><span className="text-[10px] tabular-nums tracking-[.2em]">{n}</span><span className="text-[11px] uppercase tracking-[.26em]">{text}</span></li>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-32 pt-12 md:px-10 md:pb-28 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-20 lg:pt-20">
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <p className={eyebrow}>A conversation</p>
          <h1 className="mt-6 text-5xl font-light leading-[1.04] tracking-[-0.025em] md:text-6xl">{type.name}</h1>
          <div aria-hidden className="my-8 h-px w-12 bg-[#6b1f1f]" />
          <p className="max-w-md text-lg font-light leading-[1.8] text-[#1a1816]/65">{type.description}</p>
          <dl className="mt-10 max-w-md border-b border-[#1a1816]/[.12]">
            {spec("Duration", `${type.durationMinutes} minutes`)}
            {spec("Format", "Zoom, link sent after booking")}
            {type.priceLabel && spec("Fee", type.priceLabel)}
          </dl>
        </aside>

        <section aria-label="Choose a time">
          <ol className="mb-10 flex gap-10 border-b border-[#1a1816]/[.12]">
            {stepLabel("01", "Select a time", step === "pick")}
            {stepLabel("02", "Your details", step === "details")}
          </ol>
          {notice && <p role="alert" className="mb-8 border-l-2 border-[#8b2525] pl-4 text-sm text-[#1a1816]/80">{notice}</p>}

          {!tz ? (
            <div aria-busy className="space-y-6 animate-pulse"><div className="h-9 w-56 bg-[#1a1816]/[.07]" /><div className="h-72 bg-[#1a1816]/[.04]" /></div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {step === "pick" ? (
                <motion.div key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                  <SlotPicker key={`${pickerKey}-${tz}`} load={load} timeZone={tz} value={selected} onChange={setSelected} hour12={hour12} />
                  <div className="mt-12 flex flex-wrap items-end justify-between gap-x-8 gap-y-6 border-t border-[#1a1816]/[.12] pt-6">
                    <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                      <TimeZoneSelect value={tz} onChange={(z) => { setTz(z); setSelected(null); }} />
                      <button type="button" onClick={() => setHour12((v) => !v)} className={`text-[11px] uppercase tracking-[.2em] text-[#1a1816]/45 transition hover:text-[#6b1f1f] ${focusRing}`}>{hour12 ? "24-hour" : "12-hour"}</button>
                    </div>
                    <button type="button" disabled={!selected} onClick={() => { setNotice(""); setStep("details"); }} className={`max-md:hidden ${btnPrimary}`}>Continue <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} /></button>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="details" noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                  <button type="button" onClick={() => setStep("pick")} className={`mb-8 inline-flex items-center gap-2 text-sm text-[#1a1816]/55 transition hover:text-[#6b1f1f] ${focusRing}`}><ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.25} />Change time</button>
                  <h2 ref={heading} tabIndex={-1} className="text-3xl font-light tracking-tight outline-none md:text-4xl">Your details</h2>
                  {start && end && (
                    <dl className="mb-10 mt-8 border-b border-[#1a1816]/[.12]" aria-label="Your selection">
                      {spec("Meeting", type.name)}
                      {spec("Date", formatDateLong(start, tz))}
                      {spec("Time", `${formatTime(start, tz, hour12)} – ${formatTime(end, tz, hour12)}`)}
                      {spec("Time zone", `${tz} · ${zoneOffsetLabel(start, tz)}`)}
                    </dl>
                  )}
                  <div className="space-y-8">
                    <div><label htmlFor="bk-name" className={label}>Name</label>
                      <input id="bk-name" autoComplete="name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? "bk-name-e" : undefined} />
                      {errors.name && <p id="bk-name-e" role="alert" className="mt-2 text-sm text-[#8b2525]">{errors.name}</p>}</div>
                    <div><label htmlFor="bk-email" className={label}>Email</label>
                      <input id="bk-email" type="email" autoComplete="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? "bk-email-e" : undefined} />
                      {errors.email && <p id="bk-email-e" role="alert" className="mt-2 text-sm text-[#8b2525]">{errors.email}</p>}</div>
                    <div><label htmlFor="bk-msg" className={label}>Anything you’d like me to know <span className="normal-case tracking-normal text-[#1a1816]/35">(optional)</span></label>
                      <textarea id="bk-msg" rows={3} maxLength={1500} className={`${field} resize-y`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                  </div>
                  <div className="mt-12 flex flex-wrap items-center justify-between gap-6">
                    <p className="max-w-xs text-xs leading-relaxed text-[#1a1816]/45">Your details are used only to arrange this conversation.</p>
                    <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Confirming…" : "Confirm booking"}</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </section>
      </div>

      {tz && step === "pick" && selected && start && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-[#1a1816]/[.12] bg-[#f5f1ed]/95 px-6 py-4 backdrop-blur md:hidden">
          <p className="text-sm leading-snug"><span className="block text-[#1a1816]/50">{formatDateLong(start, tz).split(",").slice(0, 2).join(",")}</span>{formatTime(start, tz, hour12)}</p>
          <button type="button" onClick={() => { setNotice(""); setStep("details"); }} className={btnPrimary}>Continue</button>
        </div>
      )}
    </MotionConfig>
  );
}
