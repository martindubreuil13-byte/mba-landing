import { SOURCE_CATEGORIES, SOURCE_LABELS, type SourceCategory } from "./classify";
import { conversionLabel } from "./events";
import { SESSION_ID_RE } from "./payload";

/**
 * Pure model for the Journeys views: filter parsing and the session timeline. A session is one browser-tab visit, never a
 * person, and nothing here can identify one: the timeline carries paths, event names, and whitelisted scalar props only.
 */
export const JOURNEY_PAGE_SIZE = 25;

export type JourneyFilters = {
  source: SourceCategory | "";
  /** "ai" = sessions from an identified AI assistant; "human" = every other session (human-oriented categories). */
  audience: "ai" | "human" | "";
  landing: string;
  outcome: "converted" | "not_converted" | "";
  device: "mobile" | "tablet" | "desktop" | "";
  page: number;
};

const pick = <T extends string>(v: string | undefined, allowed: readonly T[]): T | "" => (allowed as readonly string[]).includes(v ?? "") ? (v as T) : "";

export function parseJourneyFilters(p: Record<string, string | undefined>): JourneyFilters {
  return {
    source: pick(p.source, SOURCE_CATEGORIES),
    audience: pick(p.audience, ["ai", "human"] as const),
    landing: (p.landing ?? "").trim().slice(0, 100),
    outcome: pick(p.outcome, ["converted", "not_converted"] as const),
    device: pick(p.device, ["mobile", "tablet", "desktop"] as const),
    page: Math.max(1, Number.parseInt(p.page ?? "1", 10) || 1),
  };
}

export const isSessionId = (id: string) => SESSION_ID_RE.test(id);

export type TimelineSession = {
  started_at: string;
  last_seen_at: string;
  landing_path: string;
  source_category: string;
  source_detail: string | null;
  ai_platform: string | null;
  source_evidence: string | null;
  engaged_ms: number;
  converted: boolean;
};
export type TimelinePageview = { seq: number; path: string; title: string | null; occurred_at: string; engaged_ms: number };
export type TimelineEvent = {
  name: string; path: string | null; occurred_at: string; props: Record<string, unknown> | null;
  origin: "browser" | "server"; is_conversion: boolean; conversion_kind: string | null;
};

export type TimelineItem =
  | { kind: "arrival"; at: string; label: string; evidence: string | null }
  | { kind: "pageview"; at: string; seq: number; path: string; title: string | null; engagedMs: number; isLanding: boolean; isLast: boolean }
  | { kind: "event"; at: string; label: string; name: string; path: string | null; props: Record<string, string | number | boolean>; confirmed: boolean };

/** Human wording for an event name: "program_cta_click" -> "Program cta click". Conversions use their business label. */
export function eventLabel(e: Pick<TimelineEvent, "name" | "is_conversion" | "conversion_kind">): string {
  if (e.is_conversion) return `Lead confirmed: ${conversionLabel(e.conversion_kind ?? e.name)}`;
  const t = e.name.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const scalarProps = (props: Record<string, unknown> | null) =>
  Object.fromEntries(Object.entries(props ?? {}).filter(([, v]) => ["string", "number", "boolean"].includes(typeof v))) as Record<string, string | number | boolean>;

export function buildTimeline(session: TimelineSession, pageviews: TimelinePageview[], events: TimelineEvent[]): TimelineItem[] {
  const label = SOURCE_LABELS[session.source_category as SourceCategory] ?? session.source_category;
  const via = session.ai_platform ? `${label}: ${session.ai_platform}` : session.source_detail ? `${label} (${session.source_detail})` : label;
  const orderedViews = [...pageviews].sort((a, b) => a.seq - b.seq || a.occurred_at.localeCompare(b.occurred_at));
  const lastSeq = orderedViews.at(-1)?.seq;

  // Page views are back-dated by their reported age, while the session row records when it was first stored, so the arrival
  // is placed no later than the first page view it led to.
  const arrivalAt = [session.started_at, ...orderedViews.map((v) => v.occurred_at)].sort()[0];
  const items: (TimelineItem & { order: number })[] = [
    { kind: "arrival", at: arrivalAt, label: `Arrived via ${via}`, evidence: session.source_evidence, order: 0 },
    ...orderedViews.map((v, i) => ({
      kind: "pageview" as const, at: v.occurred_at, seq: v.seq, path: v.path, title: v.title, engagedMs: v.engaged_ms,
      isLanding: i === 0, isLast: v.seq === lastSeq, order: 1,
    })),
    ...events.map((e) => ({
      kind: "event" as const, at: e.occurred_at, label: eventLabel(e), name: e.name, path: e.path, props: scalarProps(e.props),
      confirmed: e.is_conversion && e.origin === "server", order: 2,
    })),
  ];
  // Chronological; on equal timestamps: arrival, then page views, then the events that happened on them.
  return items.sort((a, b) => a.at.localeCompare(b.at) || a.order - b.order).map((item) => {
    const copy = { ...item } as TimelineItem & { order?: number };
    delete copy.order;
    return copy;
  });
}

/** "LinkedIn → / → /work → Booking link click" */
export function summarize(items: TimelineItem[]): string {
  return items
    .map((i) => (i.kind === "arrival" ? i.label.replace(/^Arrived via /, "") : i.kind === "pageview" ? i.path : i.label))
    .join(" → ");
}

export function sessionDurationMs(s: Pick<TimelineSession, "started_at" | "last_seen_at">): number {
  return Math.max(0, new Date(s.last_seen_at).getTime() - new Date(s.started_at).getTime());
}
