"use client";

import { hasAdminSessionCookie, isAdminPath } from "./signals";

/**
 * The ONLY place Google Analytics 4 is loaded, configured or sent to. Nothing about GA exists in the server-rendered HTML any
 * more: gtag.js is requested only after the consent decision (see policy.ts), so no GA request is made and no GA cookie is
 * set before consent where consent is required.
 *
 * What is preserved from the previous setup: GA4 measurement id, manual `page_view` events with `send_page_view: false`, and
 * the redaction of UUID-shaped path segments before anything is sent. What is added: Consent Mode defaults (ad storage and
 * ad personalization always denied), Google signals / ad personalization off, and a hard stop for admin activity.
 *
 * Operational note: GA4's stream setting "Enhanced measurement -> Page changes based on browser history events" must be OFF in
 * the GA admin, otherwise GA4 adds its own page_view next to each manual one (see docs/website-intelligence/ga4-coexistence.md).
 */
export const GA_MEASUREMENT_ID = "G-VWKDNXD9JD";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [flag: `ga-disable-${string}`]: boolean | undefined;
  }
}

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replaces UUID-shaped path segments (assessment results and any future dynamic route of this shape) with `:id` before anything reaches GA:
 * GA should know a private result was viewed, not which one. */
export function sanitizePath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => (UUID_SEGMENT.test(segment) ? ":id" : segment))
    .join("/");
}

let active = false; // visitor allowed GA and it has been started
let scriptRequested = false;
let lastSentPath: string | null = null;

/** Admin activity is never sent to GA: not on /admin pages, and not at all while an admin session cookie is present. */
function adminContext(): boolean {
  if (typeof window === "undefined") return false;
  return isAdminPath(window.location.pathname) || hasAdminSessionCookie(document.cookie);
}

/** Single switch behind Google's documented `ga-disable-<ID>` flag: when true, gtag.js sends nothing at all. */
function applyGate() {
  if (typeof window === "undefined") return;
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = !active || adminContext();
}

export const isGaActive = () => active && !adminContext();

function gtag() {
  // gtag.js requires the `arguments` object itself on the dataLayer, not an array.
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer ??= []).push(arguments);
}

/** Starts GA4 for a visitor who may be measured. Idempotent. Never called while consent is pending or declined. */
export function enableGa() {
  if (typeof window === "undefined" || adminContext()) return;
  active = true;
  applyGate();
  if (!scriptRequested) {
    scriptRequested = true;
    window.dataLayer ??= [];
    window.gtag ??= gtag as unknown as Window["gtag"];
    // Consent Mode: advertising is never allowed; analytics storage is granted because this runs only once measurement is permitted.
    window.gtag!("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
    window.gtag!("consent", "update", { analytics_storage: "granted" });
    window.gtag!("js", new Date());
    window.gtag!("config", GA_MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s);
  } else {
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
  }
  sendPageView(window.location.pathname); // the page being viewed when GA starts (it was not measured before)
}

/** Stops GA4 (declined, withdrawn, or a privacy signal) and removes the cookies it set. Safe to call when it never started. */
export function disableGa() {
  active = false;
  applyGate();
  if (typeof window === "undefined") return;
  if (scriptRequested) window.gtag?.("consent", "update", { analytics_storage: "denied" });
  deleteGaCookies();
}

/** Removes `_ga` and `_ga_<id>` for this host and every parent domain (GA sets them on the registrable domain). */
export function deleteGaCookies() {
  if (typeof document === "undefined") return;
  const names = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n === "_ga" || n.startsWith("_ga_") || n === "_gid" || n.startsWith("_gat"));
  const parts = window.location.hostname.split(".");
  const domains = ["", ...parts.slice(0, -1).map((_, i) => `.${parts.slice(i).join(".")}`)];
  for (const name of names) for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
}

/** Call on every route change: keeps the admin gate current and sends the manual page_view for public pages. */
export function onRouteChange(pathname: string) {
  applyGate();
  sendPageView(pathname);
}

/** Manual GA4 page_view with a redacted path. De-duplicated per path, never sent for admin pages or before GA is active. */
export function sendPageView(pathname: string) {
  if (!isGaActive() || typeof window === "undefined" || isAdminPath(pathname)) return;
  const path = sanitizePath(pathname);
  if (lastSentPath === path) return;
  lastSentPath = path;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}${window.location.search}`,
    page_title: document.title || undefined,
  });
}

/** Custom GA4 event (mirrors the existing trackEvent call sites). No-op unless GA is active. */
export function sendGaEvent(name: string, params?: Record<string, unknown>) {
  if (!isGaActive()) return;
  window.gtag?.("event", name, params);
}

/** Test hook: forget module state. */
export function __resetGaForTests() {
  active = false;
  scriptRequested = false;
  lastSentPath = null;
}
