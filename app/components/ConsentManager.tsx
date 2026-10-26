"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONSENT_KEY, decide, parseStored, serializeChoice, type Choice, type StoredConsent } from "@/app/lib/consent/policy";
import { disableGa, enableGa } from "@/app/lib/consent/ga";
import { hasAdminSessionCookie, hasPrivacySignal, isAdminPath } from "@/app/lib/consent/signals";

/** Event the footer / privacy-page link dispatches to reopen the choices. */
export const OPEN_CONSENT_EVENT = "mba:open-analytics-preferences";
/** Google Analytics exists only in production deployments; elsewhere there is nothing to consent to. */
export const GA_AVAILABLE = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === "production";

type View = "hidden" | "banner" | "panel";
type Status = "unknown" | "signal" | "granted" | "denied" | "running";

const readStored = (): StoredConsent | null => {
  try {
    return parseStored(window.localStorage.getItem(CONSENT_KEY), Date.now());
  } catch {
    return null; // storage blocked: the choice lasts for this page only
  }
};
const writeStored = (choice: Choice) => {
  try {
    window.localStorage.setItem(CONSENT_KEY, serializeChoice(choice, Date.now()));
  } catch {
    /* ignore */
  }
};

/**
 * Decides whether Google Analytics may start, shows the choice where consent is required, and lets visitors change their mind.
 * Website Intelligence is NOT controlled here: it needs no consent decision and only honours GPC/DNT on its own.
 * The only thing stored for this feature is the visitor's choice, in localStorage (key `mba_analytics_consent`, 12 months).
 */
export default function ConsentManager() {
  const pathname = usePathname();
  const [view, setView] = useState<View>("hidden");
  const [status, setStatus] = useState<Status>("unknown");
  const [signal, setSignal] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const resolved = useRef(false);
  const admin = isAdminPath(pathname);

  const apply = useCallback((choice: Choice | "signal") => {
    if (choice === "granted") {
      enableGa();
      setStatus("running");
    } else {
      disableGa();
      setStatus(choice === "signal" ? "signal" : "denied");
    }
  }, []);

  // Resolve the decision once per page load, never on admin pages or for the signed-in admin.
  useEffect(() => {
    if (!GA_AVAILABLE || admin || resolved.current || hasAdminSessionCookie(document.cookie)) return;
    resolved.current = true;
    const sig = hasPrivacySignal(navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }, (window as unknown as { doNotTrack?: string }).doNotTrack);
    const stored = readStored();
    const first = decide({ signal: sig, stored, required: null });
    // Everything below runs in a promise callback (not synchronously in the effect body).
    // With no stored choice, ask the edge whether this visitor's location requires opt-in. Nothing is loaded meanwhile; a failure means "required".
    const region: Promise<{ required?: boolean }> =
      first === "pending"
        ? fetch("/api/consent/region", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { required: true })).catch(() => ({ required: true }))
        : Promise.resolve({});
    void region.then((j) => {
      setSignal(sig);
      const d = first === "pending" ? decide({ signal: false, stored: null, required: j.required !== false }) : first;
      if (d === "blocked_signal") apply("signal");
      else if (d === "blocked_declined") apply("denied");
      else if (d === "ask") setView("banner");
      else apply("granted");
    });
  }, [admin, apply]);

  // Reopen from the footer / privacy page.
  useEffect(() => {
    if (!GA_AVAILABLE) return;
    const open = () => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setView("panel");
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  useEffect(() => {
    if (view === "panel") panelRef.current?.focus(); // user asked for it: move focus; the banner never steals focus
  }, [view]);

  const close = useCallback(() => {
    setView("hidden");
    returnFocus.current?.focus();
  }, []);

  useEffect(() => {
    if (view !== "panel") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, close]);

  if (!GA_AVAILABLE || admin) return null;

  const choose = (choice: Choice) => {
    writeStored(choice);
    apply(choice);
    close();
  };
  const isPanel = view === "panel";
  const statusText: Record<Status, string> = {
    unknown: "No choice has been recorded on this device.",
    signal: "Your browser is sending a privacy signal (Global Privacy Control or Do Not Track), so Google Analytics is off and stays off.",
    granted: "You allowed Google Analytics.",
    denied: "You declined Google Analytics.",
    running: "Google Analytics is on for this visit.",
  };

  return (
    <div aria-live="polite">
      {view !== "hidden" ? (
        <section
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-labelledby="analytics-choice-title"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#1a1816]/20 bg-[#f5f1ed] px-5 py-5 text-[#1a1816] shadow-[0_-8px_30px_rgba(26,24,22,0.12)] focus:outline-none md:px-12"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-10">
            <div className="max-w-2xl text-sm leading-relaxed">
              <h2 id="analytics-choice-title" className="text-base font-semibold">{isPanel ? "Analytics preferences" : "Can we use Google Analytics?"}</h2>
              <p className="mt-1 text-[#1a1816]/80">
                Google Analytics sets cookies to help us understand how this site is used. You can say no and still use everything.
                We also count visits with our own analytics, which uses no cookies and does not depend on this choice.{" "}
                <Link href="/privacy#analytics" className="underline underline-offset-2 hover:text-[#6b1f1f]">Privacy notice</Link>
              </p>
              {isPanel ? <p className="mt-2 font-medium">{statusText[status]}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => choose("granted")}
                disabled={signal}
                className="min-h-11 min-w-28 border-2 border-[#1a1816] px-5 text-sm font-medium transition-colors hover:bg-[#1a1816] hover:text-[#f5f1ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#1a1816]"
              >
                Allow
              </button>
              <button
                type="button"
                onClick={() => choose("denied")}
                className="min-h-11 min-w-28 border-2 border-[#1a1816] px-5 text-sm font-medium transition-colors hover:bg-[#1a1816] hover:text-[#f5f1ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]"
              >
                Decline
              </button>
              {isPanel ? (
                <button type="button" onClick={close} className="min-h-11 px-3 text-sm underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]">
                  Close
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
