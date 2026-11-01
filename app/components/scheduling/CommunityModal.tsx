"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { COMMUNITY_DECLINE, COMMUNITY_FOOTNOTE, COMMUNITY_HEADING, COMMUNITY_INTRO, COMMUNITY_JOIN, COMMUNITY_NOTE, COMMUNITY_QUESTION } from "@/app/lib/scheduling/community";

// Both choices are equal in size and weight of consequence ("not now" costs nothing); only the emphasis differs. 48px minimum touch height, one line each.
const BUTTON = "inline-flex min-h-[48px] items-center justify-center whitespace-nowrap px-5 py-3.5 text-[11px] uppercase tracking-[.2em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]";
const PRIMARY = `${BUTTON} border border-[#6b1f1f] bg-[#6b1f1f] text-[#f5f1ed] hover:border-[#561919] hover:bg-[#561919]`;
const SECONDARY = `${BUTTON} border border-[#1a1816]/50 bg-transparent text-[#1a1816] hover:border-[#6b1f1f] hover:text-[#6b1f1f]`;

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
  return <CommunityDialog result={result} busy={busy} problem={problem} dialogRef={dialog} onChoose={choose} onClose={() => close(true)} />;
}

/** The popup's markup only. All behaviour (timing, answers, focus, closing) stays in CommunityModal above; this just shows it. */
export function CommunityDialog({ result, busy, problem, dialogRef, onChoose, onClose }: {
  result: "joined" | "verify" | "declined" | null; busy: boolean; problem: string; dialogRef?: React.Ref<HTMLDivElement>;
  onChoose: (action: "declined" | "joined") => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a1816]/45 p-0 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !result) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="community-title" className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto bg-[#f5f1ed] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7 shadow-[0_30px_80px_-30px_rgba(26,24,22,.6)] sm:px-10 sm:pb-9 sm:pt-10" style={{ animation: "mbaFadeUp .35s ease-out both" }}>
        <style>{`@keyframes mbaFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[role=dialog]{animation:none!important}}`}</style>
        {!result && <button type="button" aria-label="Close" onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center text-[#1a1816]/70 transition hover:text-[#6b1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6b1f1f]"><X aria-hidden className="h-5 w-5" /></button>}
        <h2 id="community-title" className="pr-10 text-3xl font-light leading-tight tracking-tight text-[#1a1816] md:text-4xl">{COMMUNITY_HEADING}</h2>
        <p className="mt-4 text-base leading-relaxed text-[#1a1816]/90 sm:text-lg">{COMMUNITY_INTRO}</p>
        <p className="mt-3 text-base leading-relaxed text-[#1a1816]/90 sm:text-lg">{COMMUNITY_QUESTION}</p>
        <p className="mt-3 text-base leading-relaxed text-[#1a1816]/90 sm:text-lg">{COMMUNITY_NOTE}</p>
        {result ? (
          <p role="status" className="mt-6 border-l-2 border-[#6b1f1f] pl-4 text-base leading-relaxed text-[#1a1816]/90">
            {result === "verify" ? "Thank you. Please check your inbox for a message asking you to confirm your email address. Nothing is sent to you until you do. Your booking is not affected."
              : result === "joined" ? "Thank you. You’re in the loop. Your booking is not affected." : "No problem. Your booking is not affected."}
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={busy} onClick={() => onChoose("joined")} className={`${PRIMARY} sm:flex-[3]`}>{COMMUNITY_JOIN}</button>
            <button type="button" data-first disabled={busy} onClick={() => onChoose("declined")} className={`${SECONDARY} sm:flex-[2]`}>{COMMUNITY_DECLINE}</button>
          </div>
        )}
        {problem && <p role="alert" className="mt-4 text-sm text-[#8b2525]">{problem}</p>}
        <p className="mt-4 text-sm leading-relaxed text-[#1a1816]/75">{COMMUNITY_FOOTNOTE}</p>
      </div>
    </div>
  );
}
