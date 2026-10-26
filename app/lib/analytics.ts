"use client";

import { recordIntelligenceEvent } from "@/app/lib/intelligence/client";
import { sendGaEvent } from "@/app/lib/consent/ga";

/**
 * Fires a Google Analytics 4 custom event (only if GA is running for this visitor: consent decision, privacy signals and the
 * admin gate are all handled in app/lib/consent/ga.ts) and mirrors the same event to first-party Website Intelligence
 * (cookieless; honours GPC/DNT; works on previews where GA4 is not loaded). The two are independent: each gets the event once.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  try {
    recordIntelligenceEvent(name, params);
  } catch {
    /* first-party analytics must never break a visitor flow */
  }
  sendGaEvent(name, params);
}
