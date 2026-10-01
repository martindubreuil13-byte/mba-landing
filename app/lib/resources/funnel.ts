import { CTA_LOCATIONS, type CtaLocation } from "./events";
import type { DeliveryStatus } from "./types";

/**
 * Funnel metrics, computed from stored events + requests. Pure functions so the
 * formulas are unit-tested and the admin only displays them.
 *
 * Definitions (also printed in the admin):
 *  Page views        count of resource_page_view (one per session per 30 min)
 *  Sessions          distinct session_id among page views. A session is one browser
 *                    tab visit, NOT a unique person.
 *  Read starts       distinct sessions that scrolled past the cover
 *  Completed reads   distinct sessions that reached the final section after >= 60 s
 *  CTA clicks        count of resource_cta_clicked (all locations)
 *  Form opens        count of resource_form_opened
 *  Submissions       count of resource_form_submitted (valid request stored)
 *  Valid opt-ins     explicit opt-in submissions that were not blocked: new sign-ups
 *                    (awaiting or past confirmation) + already-subscribed. Excludes suppressed.
 *  Confirmed         resource_opt_in_confirmed: the reader confirmed their email, so
 *                    community marketing is now active (counted on the day of confirmation)
 *  Download starts   count of resource_download_started (the endpoint was hit; not proof the file finished)
 *
 *  View -> opt-in         valid opt-ins / sessions
 *  CTA click -> opt-in    valid opt-ins / distinct sessions with a CTA click
 *  Opt-in -> download     requests (opt-in or not) with >= 1 download / requests in range
 *  Confirmation rate      confirmed / new sign-ups in the same period (approximate: confirmations lag)
 */

export type FunnelEvent = {
  event_name: string;
  session_id: string | null;
  cta_location: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type FunnelRequest = {
  requested_at: string;
  delivery_status: DeliveryStatus | null;
  download_count: number | null;
};

export type CtaStats = { clicks: number; opens: number; submissions: number; validOptIns: number; clickToOptIn: number | null };

export type FunnelSummary = {
  pageViews: number;
  sessions: number;
  readStarts: number;
  readCompletions: number;
  ctaClicks: number;
  ctaSessions: number;
  formOpens: number;
  submissions: number;
  newSignups: number;
  confirmed: number;
  existingSubscribers: number;
  consentNotApplied: number;
  validOptIns: number;
  downloadStarts: number;
  requests: number;
  requestsWithDownload: number;
  delivery: Record<DeliveryStatus, number>;
  rates: {
    viewToOptIn: number | null;
    ctaToOptIn: number | null;
    optInToDownload: number | null;
    confirmation: number | null;
    readCompletion: number | null;
  };
  byCta: Record<CtaLocation, CtaStats>;
};

export function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export function formatRate(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

const distinct = (events: FunnelEvent[], name: string) =>
  new Set(events.filter((e) => e.event_name === name && e.session_id).map((e) => e.session_id)).size;

const count = (events: FunnelEvent[], name: string) => events.filter((e) => e.event_name === name).length;

const consentOf = (e: FunnelEvent) => (e.metadata?.consent as string | undefined) ?? "";
const isValidOptIn = (e: FunnelEvent) => consentOf(e) === "pending_confirmation" || consentOf(e) === "existing";

export function computeFunnel(events: FunnelEvent[], requests: FunnelRequest[]): FunnelSummary {
  const submissions = events.filter((e) => e.event_name === "resource_form_submitted");
  const newSignups = submissions.filter((e) => consentOf(e) === "pending_confirmation").length;
  const confirmed = events.filter((e) => e.event_name === "resource_opt_in_confirmed").length;
  const existingSubscribers = submissions.filter((e) => consentOf(e) === "existing").length;
  const consentNotApplied = submissions.filter((e) => consentOf(e) === "not_applied").length;
  const validOptIns = newSignups + existingSubscribers;

  const sessions = distinct(events, "resource_page_view");
  const ctaSessions = new Set(events.filter((e) => e.event_name === "resource_cta_clicked" && e.session_id).map((e) => e.session_id)).size;
  const requestsWithDownload = requests.filter((r) => (r.download_count ?? 0) > 0).length;

  const delivery: Record<DeliveryStatus, number> = { not_tracked: 0, accepted: 0, queued: 0, sent: 0, delivered: 0, bounced: 0, failed: 0 };
  for (const r of requests) delivery[r.delivery_status ?? "not_tracked"] += 1;

  const byCta = {} as Record<CtaLocation, CtaStats>;
  for (const loc of CTA_LOCATIONS) {
    const clicks = events.filter((e) => e.event_name === "resource_cta_clicked" && e.cta_location === loc).length;
    const opens = events.filter((e) => e.event_name === "resource_form_opened" && e.cta_location === loc).length;
    const subs = submissions.filter((e) => e.cta_location === loc);
    const valid = subs.filter(isValidOptIn).length;
    byCta[loc] = { clicks, opens, submissions: subs.length, validOptIns: valid, clickToOptIn: ratio(valid, clicks) };
  }

  const readStarts = distinct(events, "resource_read_started");
  const readCompletions = distinct(events, "resource_read_completed");

  return {
    pageViews: count(events, "resource_page_view"),
    sessions,
    readStarts,
    readCompletions,
    ctaClicks: count(events, "resource_cta_clicked"),
    ctaSessions,
    formOpens: count(events, "resource_form_opened"),
    submissions: submissions.length,
    newSignups,
    confirmed,
    existingSubscribers,
    consentNotApplied,
    validOptIns,
    downloadStarts: count(events, "resource_download_started"),
    requests: requests.length,
    requestsWithDownload,
    delivery,
    rates: {
      viewToOptIn: ratio(validOptIns, sessions),
      ctaToOptIn: ratio(validOptIns, ctaSessions),
      optInToDownload: ratio(requestsWithDownload, requests.length),
    confirmation: ratio(confirmed, newSignups),
      readCompletion: ratio(readCompletions, readStarts),
    },
    byCta,
  };
}

export type TrendDay = { date: string; views: number; optIns: number; conversion: number | null };

/** One row per UTC day, inclusive, with zero-filled gaps. */
export function computeTrend(events: FunnelEvent[], fromDate: string, toDate: string): TrendDay[] {
  const days = new Map<string, { views: number; optIns: number; sessions: Set<string> }>();
  const start = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86_400_000)) {
    days.set(d.toISOString().slice(0, 10), { views: 0, optIns: 0, sessions: new Set() });
  }
  for (const e of events) {
    const day = days.get(e.created_at.slice(0, 10));
    if (!day) continue;
    if (e.event_name === "resource_page_view") {
      day.views += 1;
      if (e.session_id) day.sessions.add(e.session_id);
    } else if (e.event_name === "resource_form_submitted" && isValidOptIn(e)) {
      day.optIns += 1;
    }
  }
  return [...days.entries()].map(([date, d]) => ({ date, views: d.views, optIns: d.optIns, conversion: ratio(d.optIns, d.sessions.size) }));
}

export type DateRange = { from: string; to: string; preset: "7" | "30" | "90" | "custom" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Presets 7/30/90 (ending today, UTC) or a custom inclusive from/to. */
export function resolveDateRange(input: { range?: string; from?: string; to?: string }, now = new Date()): DateRange {
  const today = now.toISOString().slice(0, 10);
  if (input.range === "custom" && input.from && input.to && DATE.test(input.from) && DATE.test(input.to) && input.from <= input.to) {
    const spanDays = (new Date(input.to).getTime() - new Date(input.from).getTime()) / 86_400_000;
    if (spanDays <= 366) return { from: input.from, to: input.to, preset: "custom" };
  }
  const days = input.range === "7" ? 7 : input.range === "90" ? 90 : 30;
  const from = new Date(now.getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  return { from, to: today, preset: String(days) as "7" | "30" | "90" };
}
