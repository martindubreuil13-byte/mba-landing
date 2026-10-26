"use client";

import { recordIntelligenceEvent } from "@/app/lib/intelligence/client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a GA4 custom event via the sitewide gtag.js already loaded in the root layout, and mirrors the same event
 * to first-party Website Intelligence (cookieless; honours GPC/DNT; works on previews where GA4 is not loaded).
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  try {
    recordIntelligenceEvent(name, params);
  } catch {
    /* first-party analytics must never break a visitor flow */
  }
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
