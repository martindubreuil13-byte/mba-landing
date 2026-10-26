"use client";

import { trackingAllowed } from "@/app/lib/resources/client-events";
import { resumeOrStart, SESSION_KEY, type Entry, type StoredSession } from "./session";

/**
 * Browser side of Website Intelligence. Cookieless: the only state is a per-tab sessionStorage record (cleared when
 * the tab closes) that expires after 30 minutes of inactivity. Nothing is sent when the browser sends Global Privacy
 * Control or Do Not Track, when the page is automated (navigator.webdriver), or for /admin and /api pages.
 *
 * Events are queued and sent in one small batch (sendBeacon, falling back to fetch keepalive) 2 s after the last
 * change and whenever the tab is hidden, so collection never blocks rendering or navigation. Failures are silent.
 */

const ENDPOINT = "/api/wi";
const FLUSH_DELAY_MS = 2000;
const MAX_QUEUED_EVENTS = 40;

type QPv = { id: string; seq: number; path: string; title: string | null; at: number };
type QEv = { id: string; name: string; path: string; props?: Record<string, unknown>; at: number };
type View = { id: string; shownSince: number | null; accMs: number; rec: QPv };

let session: StoredSession | null = null;
let view: View | null = null;
let queue: { pv: QPv[]; lv: Map<string, number>; ev: QEv[] } = { pv: [], lv: new Map(), ev: [] };
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

function enabled(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return false;
  return trackingAllowed();
}

const excluded = (path: string) => path === "/admin" || path.startsWith("/admin/") || path === "/api" || path.startsWith("/api/");

function makeEntry(): Entry {
  const params = new URLSearchParams(window.location.search);
  let ref: string | null = null;
  try {
    if (document.referrer) {
      const u = new URL(document.referrer);
      // Own-site referrers are internal navigation, not a source.
      if (u.origin !== window.location.origin) ref = `${u.origin}${u.pathname}`;
    }
  } catch {
    ref = null;
  }
  return {
    ref,
    us: params.get("utm_source"),
    um: params.get("utm_medium"),
    uc: params.get("utm_campaign"),
    ut: params.get("utm_content"),
    land: window.location.pathname,
  };
}

function touchSession(): StoredSession {
  const now = Date.now();
  let stored: StoredSession | null = session;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) stored = JSON.parse(raw) as StoredSession;
  } catch {
    /* storage blocked: the in-memory copy still gives a per-page-load session */
  }
  const { session: next } = resumeOrStart(stored, now, () => `w${randomId()}`, makeEntry);
  session = next;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

/**
 * Headers for a lead-capture request, so the server can link its confirmed conversion to this visit. Empty when tracking is off
 * (GPC/DNT, automation, blocked storage): the conversion is then still counted, unattributed.
 */
export function intelligenceHeaders(): Record<string, string> {
  const id = getIntelligenceSessionId();
  return id ? { "x-wi-sid": id } : {};
}

/** The current analytics session id (for linking a server-side conversion to its session), or null. */
export function getIntelligenceSessionId(): string | null {
  return enabled() ? touchSession().id : null;
}

function viewMs(v: View, now: number) {
  return v.accMs + (v.shownSince !== null ? now - v.shownSince : 0);
}

function recordLeave() {
  if (view) queue.lv.set(view.id, Math.round(viewMs(view, Date.now())));
}

function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!session || (!queue.pv.length && !queue.lv.size && !queue.ev.length)) return;
  const now = Date.now();
  // A leave can overtake its own page view (separate requests, possibly separate servers). Re-sending the current
  // view's record with its leave is harmless (inserts are idempotent) and guarantees the row exists first.
  if (view && queue.lv.has(view.id) && !queue.pv.some((p) => p.id === view!.id)) queue.pv.push(view.rec);
  const body = JSON.stringify({
    sid: session.id,
    entry: session.entry,
    pv: queue.pv.map((p) => ({
      id: p.id,
      seq: p.seq,
      path: p.path,
      title: (view && view.id === p.id ? document.title : p.title) || null,
      age: Math.max(0, now - p.at),
    })),
    lv: [...queue.lv].map(([id, ms]) => ({ id, ms })),
    ev: queue.ev.map((e) => ({ id: e.id, name: e.name, path: e.path, props: e.props, age: Math.max(0, now - e.at) })),
  });
  queue = { pv: [], lv: new Map(), ev: [] };
  try {
    const sent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
    if (!sent) void fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* analytics must never affect the page */
  }
}

function schedule() {
  if (!timer) timer = setTimeout(() => flush(), FLUSH_DELAY_MS);
}

function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener("visibilitychange", () => {
    const now = Date.now();
    if (document.visibilityState === "hidden") {
      if (view && view.shownSince !== null) {
        view.accMs += now - view.shownSince;
        view.shownSince = null;
      }
      recordLeave();
      flush();
    } else if (view && view.shownSince === null) {
      view.shownSince = now;
      touchSession();
    }
  });
  // Any click on a Calendly link is a booking-link click. It is a click only: bookings are not confirmable (no webhook).
  document.addEventListener(
    "click",
    (event) => {
      try {
        const a = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (a && /(^|\.)calendly\.com$/i.test(new URL(a.href, window.location.href).hostname)) recordIntelligenceEvent("booking_link_click");
      } catch {
        /* never affect the click */
      }
    },
    true
  );
  window.addEventListener("pagehide", () => {
    if (view && view.shownSince !== null) {
      view.accMs += Date.now() - view.shownSince;
      view.shownSince = null;
    }
    recordLeave();
    flush();
  });
}

/** Call on every route change (initial load included). */
export function trackIntelligencePageview(path: string) {
  if (!enabled() || excluded(path)) return;
  listen();
  recordLeave(); // close the previous view in this tab
  const s = touchSession();
  s.seq += 1;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  const id = randomId();
  const rec: QPv = { id, seq: s.seq, path, title: document.title || null, at: Date.now() };
  view = { id, shownSince: document.visibilityState === "visible" ? Date.now() : null, accMs: 0, rec };
  queue.pv.push(rec);
  schedule();
}

/** Record a named interaction (shares the existing GA4 call sites through trackEvent). */
export function recordIntelligenceEvent(name: string, props?: Record<string, unknown>) {
  if (!enabled() || name === "page_view") return;
  const path = window.location.pathname;
  if (excluded(path) || queue.ev.length >= MAX_QUEUED_EVENTS) return;
  touchSession();
  queue.ev.push({ id: randomId(), name: name.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 60), path, props, at: Date.now() });
  schedule();
}
