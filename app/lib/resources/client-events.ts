"use client";

import { collectAttribution } from "@/app/lib/attribution";
import type { ClientEventName, CtaLocation } from "./events";

const SESSION_KEY = "mba_resource_session";

/**
 * Anonymous per-tab session id (random, no personal data, cleared when the tab
 * closes). "Unique sessions" in the admin means distinct ids of this kind: a
 * returning visitor in a new tab counts again, so it is a session measure, not
 * a unique-person measure.
 */
export function getSessionId(): string {
  const fresh = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}-session`);
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = fresh();
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return (window as unknown as { __mbaSid?: string }).__mbaSid ??= fresh();
  }
}

/** Respects Global Privacy Control and Do Not Track: no analytics events are sent. */
export function trackingAllowed(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  return !(nav.globalPrivacyControl === true || nav.doNotTrack === "1" || nav.msDoNotTrack === "1");
}

export function sendResourceEvent(event: ClientEventName, slug: string, ctaLocation?: CtaLocation) {
  if (typeof window === "undefined" || !trackingAllowed()) return;
  const attribution = collectAttribution();
  const payload = JSON.stringify({
    event,
    slug,
    sessionId: getSessionId(),
    ctaLocation: ctaLocation ?? null,
    pagePath: window.location.pathname,
    referrer: document.referrer || null,
    attribution: { source: attribution.source, medium: attribution.medium, campaign: attribution.campaign },
  });
  try {
    void fetch("/api/resources/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
  } catch {
    /* analytics must never affect the page */
  }
}
