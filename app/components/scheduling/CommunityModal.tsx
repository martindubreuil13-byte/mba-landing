"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { COMMUNITY_DECLINE, COMMUNITY_FOOTNOTE, COMMUNITY_HEADING, COMMUNITY_INTRO, COMMUNITY_JOIN, COMMUNITY_NOTE, COMMUNITY_QUESTION } from "@/app/lib/scheduling/community";

const CHOICE = "flex-1 border border-[#1a1816]/30 px-6 py-4 text-[11px] uppercase tracking-[.22em] text-[#1a1816] transition duration-200 hover:border-[#6b1f1f] hover:text-[#6b1f1f] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]";

type Action = "shown" | "declined" | "joined" | "dismissed";
async function record(reference: string, action: Action) {
  // keepalive: an answer given just before the visitor navigates away or reloads still reaches the server.
  const r = await fetch("/api/scheduling/community", { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ reference, action }) });
  if (!r.ok) throw new Error("not saved");
  return (await r.json().catch(() => ({}))) as { consent?: string };
}

/**
 * The post-booking community invitation. The page mounts it only once the booking is confirmed and its Zoom details are ready. Nothing is
 * preselected, "No, thanks" and "Yes, count me in" look and behave alike, and the booking is the same whatever is chosen. An answer is stored
 * once on the server (wording, time, source); closing the window by any other route records "dismissed", which is not consent, and ends the
 * prompt for this booking just the same.
 */
export default function CommunityModal({ reference }: { reference: string }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<"joined" | "verify" | "declined" | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { opener.current = document.activeElement; setOpen(true); record(reference, "shown").catch(() => undefined); }, 1100);
    return () => clearTimeout(t);
  }, [reference]);

  const close = useCallback((dismissed: boolean) => {
    setOpen(false);
    if (dismissed) record(reference, "dismissed").catch(() => undefined);
    (opener.current as HTMLElement | null)?.focus?.();
  }, [reference]);

  const choose = async (action: "declined" | "joined") => {
    if (busy) return;
    setBusy(true); setProblem("");
    try {
      const answer = await record(reference, action);
      // Say what actually happened: a "yes" that still needs the visitor to verify their address is not yet active.
      const next = action === "declined" ? "declined" : answer.consent === "pending_verification" ? "verify" : "joined";
      setResult(next); setTimeout(() => setOpen(false), next === "verify" ? 7000 : 2600);
    }
    catch { setProblem("We couldn’t save that just now. Your booking is not affected. You can try again or close this window."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLElement>("button[data-first]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !result) { e.preventDefault(); close(true); }
      if (e.key === "Tab" && dialog.current) {
        const f = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, result, close]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a1816]/45 p-0 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !result) close(true); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="community-title" className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto bg-[#f5f1ed] p-8 shadow-[0_30px_80px_-30px_rgba(26,24,22,.6)] sm:p-12" style={{ animation: "mbaFadeUp .35s ease-out both" }}>
        <style>{`@keyframes mbaFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[role=dialog]{animation:none!important}}`}</style>
        {!result && <button type="button" aria-label="Close" onClick={() => close(true)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center text-[#1a1816]/45 hover:text-[#6b1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6b1f1f]"><X aria-hidden className="h-5 w-5" /></button>}
        <h2 id="community-title" className="pr-8 text-3xl font-light leading-tight tracking-tight md:text-4xl">{COMMUNITY_HEADING}</h2>
        <p className="mt-6 text-lg font-light leading-relaxed text-[#1a1816]/70">{COMMUNITY_INTRO}</p>
        <p className="mt-4 text-lg font-light leading-relaxed text-[#1a1816]/70">{COMMUNITY_QUESTION}</p>
        <p className="mt-4 text-lg font-light leading-relaxed text-[#1a1816]/70">{COMMUNITY_NOTE}</p>
        {result ? (
          <p role="status" className="mt-8 border-l-2 border-[#6b1f1f] pl-4 text-base leading-relaxed text-[#1a1816]/80">
            {result === "verify" ? "Thank you. Please check your inbox for a message asking you to confirm your email address. Nothing is sent to you until you do. Your booking is not affected."
              : result === "joined" ? "Thank you. You’re in the loop. Your booking is not affected." : "No problem. Your booking is not affected."}
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={busy} onClick={() => choose("joined")} className={CHOICE}>{COMMUNITY_JOIN}</button>
            <button type="button" data-first disabled={busy} onClick={() => choose("declined")} className={CHOICE}>{COMMUNITY_DECLINE}</button>
          </div>
        )}
        {!result && <button type="button" disabled={busy} onClick={() => close(true)} className="mt-5 text-sm text-[#1a1816]/55 underline underline-offset-4 transition hover:text-[#6b1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f] disabled:opacity-50">Not now</button>}
        {problem && <p role="alert" className="mt-5 text-sm text-[#8b2525]">{problem}</p>}
        <p className="mt-6 text-sm italic leading-relaxed text-[#1a1816]/55">{COMMUNITY_FOOTNOTE}</p>
      </div>
    </div>
  );
}
