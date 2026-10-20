"use client";

import { collectAttribution } from "@/app/lib/attribution";

/**
 * First-touch attribution for the browser session. A visitor who lands on /work?utm_source=... and then
 * clicks through to /lets-talk (a client-side navigation) no longer has those parameters in the URL, so the
 * landing page's attribution is captured once, on the first page view of the session, and read back when an
 * inquiry is submitted. Storage can be unavailable (private mode, blocked): every call fails soft.
 */
const KEY = "mba_first_touch";

type FirstTouch = ReturnType<typeof collectAttribution> & { landingPage: string };

export function rememberFirstTouch() {
  try {
    if (window.sessionStorage.getItem(KEY)) return;
    const value: FirstTouch = { ...collectAttribution(), landingPage: window.location.pathname };
    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readFirstTouch(): FirstTouch | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FirstTouch) : null;
  } catch {
    return null;
  }
}
