import { z } from "zod";

/**
 * Validation and sanitising for the public collection beacon. Everything from the browser is untrusted: paths are
 * stripped of query strings and ids, referrers are reduced to origin + path, event properties are small primitives,
 * and anything that looks like an email address is dropped. Pure, so it is unit-tested.
 */

export const MAX_BODY_BYTES = 8 * 1024;
export const SESSION_ID_RE = /^[A-Za-z0-9-]{16,64}$/;
export const SHORT_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const EVENT_NAME_RE = /^[a-z][a-z0-9_]{1,59}$/;
const PROP_KEY_RE = /^[a-z][a-z0-9_]{0,39}$/;
const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Paths that are never recorded as public traffic. */
export function isExcludedPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path === "/api" || path.startsWith("/api/");
}

/** Query/fragment removed, UUID segments replaced with :id, max 200 chars. Null when not a usable site path. */
export function sanitizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const base = raw.trim().split(/[?#]/)[0];
  if (!base.startsWith("/") || base.startsWith("//")) return null;
  const path = base
    .slice(0, 200)
    .split("/")
    .map((seg) => (UUID_SEGMENT.test(seg) ? ":id" : seg))
    .join("/");
  return path.replace(/[\u0000-\u001f\u007f]/g, "") || null;
}

/** Origin + path only: a referrer's query string can carry search terms or tokens, so it is never kept. */
export function sanitizeReferrer(raw: unknown): { referrer: string | null; host: string | null } {
  if (typeof raw !== "string" || !raw) return { referrer: null, host: null };
  try {
    const u = new URL(raw.slice(0, 500));
    if (u.protocol !== "https:" && u.protocol !== "http:") return { referrer: null, host: null };
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return { referrer: `${u.origin}${u.pathname}`.slice(0, 300), host };
  } catch {
    return { referrer: null, host: null };
  }
}

const cleanText = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  return t || null;
};

const looksLikeEmail = (v: string) => /\S+@\S+/.test(v);

export type SafeProps = Record<string, string | number | boolean>;

/** Up to 8 primitive properties; strings clipped to 100 chars; email-like strings are dropped, never stored. */
export function sanitizeProps(raw: unknown): SafeProps {
  const out: SafeProps = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= 8) break;
    if (!PROP_KEY_RE.test(key)) continue;
    if (typeof value === "string") {
      const t = cleanText(value, 100);
      if (t && !looksLikeEmail(t)) out[key] = t;
    } else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

const ageMs = z.number().int().min(0).max(30 * 60 * 1000).optional().catch(0);

export const collectSchema = z.object({
  sid: z.string().regex(SESSION_ID_RE),
  /** How the session began; repeated on every beacon so a lost first beacon cannot lose the attribution. */
  entry: z
    .object({
      ref: z.string().max(500).optional().nullable(),
      us: z.string().max(100).optional().nullable(),
      um: z.string().max(100).optional().nullable(),
      uc: z.string().max(100).optional().nullable(),
      ut: z.string().max(100).optional().nullable(),
      land: z.string().max(300),
    })
    .strict(),
  pv: z
    .array(
      z.object({
        id: z.string().regex(SHORT_ID_RE),
        seq: z.number().int().min(0).max(100000),
        path: z.string().max(400),
        title: z.string().max(300).optional().nullable(),
        age: ageMs,
      })
    )
    .max(10)
    .default([]),
  lv: z.array(z.object({ id: z.string().regex(SHORT_ID_RE), ms: z.number().int().min(0).max(30 * 60 * 1000) })).max(10).default([]),
  ev: z
    .array(
      z.object({
        id: z.string().regex(SHORT_ID_RE),
        name: z.string().regex(EVENT_NAME_RE),
        path: z.string().max(400).optional().nullable(),
        age: ageMs,
        props: z.unknown().optional(),
      })
    )
    .max(20)
    .default([]),
});

export type CollectPayload = z.infer<typeof collectSchema>;

export type CleanBatch = {
  sid: string;
  entry: { referrer: string | null; referrerHost: string | null; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; utmContent: string | null; landingPath: string };
  pageviews: { view_id: string; seq: number; path: string; title: string | null; age_ms: number }[];
  leaves: { view_id: string; ms: number }[];
  events: { event_id: string; name: string; path: string | null; age_ms: number; props: SafeProps }[];
};

/** Returns null when the batch is invalid or only concerns excluded (admin / api) pages. */
export function parseCollectBody(text: string): CleanBatch | null {
  if (text.length > MAX_BODY_BYTES) return null;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = collectSchema.safeParse(json);
  if (!parsed.success) return null;
  const p = parsed.data;

  const landingPath = sanitizePath(p.entry.land);
  if (!landingPath || isExcludedPath(landingPath)) return null;
  const { referrer, host } = sanitizeReferrer(p.entry.ref);

  const pageviews = p.pv.flatMap((v) => {
    const path = sanitizePath(v.path);
    return path && !isExcludedPath(path) ? [{ view_id: v.id, seq: v.seq, path, title: cleanText(v.title, 200), age_ms: v.age ?? 0 }] : [];
  });
  const events = p.ev.flatMap((e) => {
    const path = e.path ? sanitizePath(e.path) : null;
    if (path && isExcludedPath(path)) return [];
    // Browser events are never conversions: only the server marks those, after the system of record accepted them.
    return [{ event_id: e.id, name: e.name, path, age_ms: e.age ?? 0, props: sanitizeProps(e.props) }];
  });

  return {
    sid: p.sid,
    entry: {
      referrer,
      referrerHost: host,
      utmSource: cleanText(p.entry.us, 100),
      utmMedium: cleanText(p.entry.um, 100),
      utmCampaign: cleanText(p.entry.uc, 100),
      utmContent: cleanText(p.entry.ut, 100),
      landingPath,
    },
    pageviews,
    leaves: p.lv.map((l) => ({ view_id: l.id, ms: l.ms })),
    events,
  };
}
