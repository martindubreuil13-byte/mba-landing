import { PROGRAMS, formatPrice, type ServiceProgram } from "./catalog";

/** Server-side helpers for program-aware inquiries. Never trust the client: programs are resolved from the catalog. */

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function resolveProgram(raw: unknown): ServiceProgram | undefined {
  const slug = typeof raw === "string" ? raw : (raw as { slug?: unknown } | null)?.slug;
  return typeof slug === "string" ? PROGRAMS.find((p) => p.slug === slug) : undefined;
}

export function programLabel(p: ServiceProgram): string {
  return `Program ${p.number}: ${p.name} (${formatPrice(p)})`;
}

const clip = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");

/** Flattens the client attribution object into short, clipped strings. Anything unexpected becomes empty. */
export function normalizeAttribution(raw: unknown): Record<string, string> {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const utm = (a.utm && typeof a.utm === "object" ? a.utm : {}) as Record<string, unknown>;
  const out: Record<string, string> = {
    source: clip(a.source),
    medium: clip(a.medium),
    campaign: clip(a.campaign),
    utm_content: clip(utm.content),
    referrer: clip(a.referrer, 300),
    landing_page: clip(a.landingPage, 200),
    entry_page: clip(a.entryPage, 200),
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
}
