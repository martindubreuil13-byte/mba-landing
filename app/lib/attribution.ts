"use client";

/** Client-side UTM/referrer capture, shared by every lead-capture surface. */
export function collectAttribution() {
  if (typeof window === "undefined") {
    return { utm: {}, referrer: null, source: null, medium: null, campaign: null };
  }

  const params = new URLSearchParams(window.location.search);
  const utm = {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
    content: params.get("utm_content"),
  };

  const referrer = document.referrer || null;
  let referrerHost: string | null = null;
  try {
    referrerHost = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : null;
  } catch {
    referrerHost = null;
  }

  return {
    utm,
    referrer,
    source: utm.source ?? referrerHost ?? "direct",
    medium: utm.medium ?? (referrer ? "referral" : "direct"),
    campaign: utm.campaign ?? null,
  };
}
