import { safeLink } from "./render";

export const marketingOrigin = "https://modernbusinessarchitect.com";
export const attributionCookie = "mba_campaign_link";
export const providerEvents = new Set([
  "email.sent", "email.delivered", "email.bounced", "email.complained", "email.failed",
  "email.delivery_delayed", "email.suppressed",
]);

export function approvedDestination(value: string) {
  const safe = safeLink(value);
  if (!safe) return null;
  const url = new URL(safe);
  if (url.protocol !== "https:" || url.username || url.password ||
      /^\/(?:api\/)?(?:unsubscribe|campaign\/click)(?:\/|$)/i.test(url.pathname)) return null;
  return url;
}

export function suspectedScanner(headers: Headers) {
  return /prefetch|preview/i.test([headers.get("purpose"), headers.get("sec-purpose")].join(" ")) ||
    /bot|crawler|scanner|proofpoint|mimecast|barracuda/i.test(headers.get("user-agent") ?? "");
}

export function deliveryOutcome(types: string[]) {
  if (types.includes("email.bounced")) return "Bounced";
  if (types.includes("email.suppressed")) return "Suppressed";
  if (types.includes("email.complained")) return "Complained";
  if (types.includes("email.delivered")) return "Confirmed delivered";
  if (types.includes("email.failed")) return "Provider failed";
  if (types.includes("email.delivery_delayed")) return "Delayed";
  return "Unconfirmed";
}
