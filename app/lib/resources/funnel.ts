import { CTA_LOCATIONS, type CtaLocation } from "./events";
import type { DeliveryStatus } from "./types";

/**
 * Funnel metrics for "public layer + free-member layer" resources, computed from stored events + requests.
 * Pure functions, so every formula is unit-tested and the admin only displays them.
 *
 * RULE: a rate is only shown when numerator and denominator are the SAME UNIT and the numerator is logically a subset
 * of the denominator. Rates are never clamped or capped. When the data cannot support a rate (no denominator, or
 * numerator items missing from the denominator) the rate is "—" and an analytics-integrity warning is raised.
 *
 * Units:
 *   session           distinct anonymous per-tab session ids (NOT unique people)
 *   request           one membership/benefit request row (resource_requests)
 *   confirmed member  distinct lead that confirmed membership (resource_opt_in_confirmed)
 *
 * Conversions (all comparable by construction):
 *   Sessions with a page view -> sessions with a member-CTA click            (sessions / sessions)
 *   Sessions with a CTA click -> sessions with a membership request          (sessions / sessions)
 *   Sessions with a page view -> sessions with a membership request          (sessions / sessions)
 *   Membership requests -> requests whose lead has confirmed                 (requests / requests)
 *   Confirmed members -> confirmed members whose benefit was unlocked        (members / members)
 *   Unlocked requests -> unlocked requests that were downloaded at least once (requests / requests)
 *   Sessions that started reading -> sessions that finished                  (sessions / sessions)
 */

export type FunnelEvent = {
  event_name: string;
  session_id: string | null;
  cta_location: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
  lead_id?: string | null;
  request_id?: string | null;
};

export type FunnelRequest = {
  id?: string;
  lead_id?: string;
  requested_at: string;
  delivery_status: DeliveryStatus | null;
  download_count: number | null;
  /** NULL = locked (waiting for confirmation). */
  benefit_fulfilled_at?: string | null;
  /** True for a request that asked to become a member (false: an already-confirmed member asking again). */
  opted_in_this_request?: boolean | null;
  /** Derived consent status of the requesting lead right now. */
  lead_consent?: "pending" | "opted_in" | "opted_out" | "suppressed" | null;
};

export type Conversion = {
  label: string;
  unit: "session" | "request" | "member";
  numerator: number;
  denominator: number;
  /** null = shown as "—": no denominator, or the data is not comparable (see warning). */
  rate: number | null;
  warning: string | null;
};

export type CtaStats = { clicks: number; opens: number; requests: number; clickToRequest: Conversion };

export type FunnelSummary = {
  // public layer
  pageViews: number;
  sessions: number;
  readStarts: number;
  readCompletions: number;
  // member-benefit CTA
  ctaClicks: number;
  ctaSessions: number;
  formOpens: number;
  // membership
  membershipRequests: number;
  existingMemberRequests: number;
  pendingConfirmations: number;
  confirmedMembers: number;
  blockedAttempts: { unsubscribed: number; suppressed: number };
  // benefit
  benefitsFulfilled: number;
  fulfilledByConfirmation: number;
  fulfilledExistingMember: number;
  downloadStarts: number;
  requestsDownloaded: number;
  // delivery + outcomes
  delivery: Record<DeliveryStatus, number>;
  deliveryFailures: number;
  unsubscribedMembers: number;
  suppressedMembers: number;
  requests: number;
  conversions: {
    viewToCta: Conversion;
    ctaToRequest: Conversion;
    viewToRequest: Conversion;
    requestToConfirmed: Conversion;
    confirmedToFulfilled: Conversion;
    fulfilledToDownloaded: Conversion;
    readStartToCompletion: Conversion;
    viewToReadStart: Conversion;
  };
  byCta: Record<CtaLocation, CtaStats>;
  /** Plain-language integrity warnings; empty when every comparison is sound. */
  integrityWarnings: string[];
};

export function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export function formatRate(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

const sessionsOf = (events: FunnelEvent[], name: string, where: (e: FunnelEvent) => boolean = () => true) =>
  new Set(events.filter((e) => e.event_name === name && e.session_id && where(e)).map((e) => e.session_id as string));

const count = (events: FunnelEvent[], name: string) => events.filter((e) => e.event_name === name).length;
const consentOf = (e: FunnelEvent) => (e.metadata?.consent as string | undefined) ?? "";
const isValidRequest = (e: FunnelEvent) => consentOf(e) === "pending_confirmation" || consentOf(e) === "existing";

/**
 * Builds a conversion from two sets of the SAME unit. If any numerator item is missing from the denominator the two
 * are not comparable (e.g. a session whose page view fell outside the date range): no rate, plus a warning.
 */
export function conversion(label: string, unit: Conversion["unit"], numerator: Set<string>, denominator: Set<string>): Conversion {
  const orphans = [...numerator].filter((x) => !denominator.has(x)).length;
  if (orphans > 0) {
    return {
      label,
      unit,
      numerator: numerator.size,
      denominator: denominator.size,
      rate: null,
      warning: `${label}: ${orphans} of ${numerator.size} ${unit}${numerator.size === 1 ? "" : "s"} in the numerator ${orphans === 1 ? "is" : "are"} missing from the denominator (${denominator.size}), so no rate is shown. Usually events outside the selected dates, or missing tracking.`,
    };
  }
  return { label, unit, numerator: numerator.size, denominator: denominator.size, rate: ratio(numerator.size, denominator.size), warning: null };
}

export function computeFunnel(events: FunnelEvent[], requests: FunnelRequest[]): FunnelSummary {
  const viewSessions = sessionsOf(events, "resource_page_view");
  const readSessions = sessionsOf(events, "resource_read_started");
  const doneSessions = sessionsOf(events, "resource_read_completed");
  const ctaSessions = sessionsOf(events, "resource_cta_clicked");
  const requestSessions = sessionsOf(events, "resource_form_submitted", isValidRequest);

  // --- requests (unit: request) --------------------------------------------------------------------------------
  const membershipRequests = requests.filter((r) => r.opted_in_this_request);
  const existingMemberRequests = requests.filter((r) => r.opted_in_this_request === false);
  const pendingConfirmations = membershipRequests.filter((r) => !r.benefit_fulfilled_at && r.lead_consent === "pending");
  const requestIds = (rs: FunnelRequest[]) => new Set(rs.map((r) => r.id).filter((x): x is string => !!x));
  const membershipIds = requestIds(membershipRequests);
  const confirmedRequestIds = requestIds(membershipRequests.filter((r) => r.lead_consent === "opted_in"));
  const fulfilledRequests = requests.filter((r) => !!r.benefit_fulfilled_at);
  const fulfilledIds = requestIds(fulfilledRequests);
  const downloadedIds = requestIds(fulfilledRequests.filter((r) => (r.download_count ?? 0) > 0));

  // --- members (unit: confirmed member = lead) -------------------------------------------------------------------
  const confirmedEvents = events.filter((e) => e.event_name === "resource_opt_in_confirmed");
  const confirmedLeads = new Set(confirmedEvents.map((e) => e.lead_id).filter((x): x is string => !!x));
  const unlockedLeads = new Set(
    confirmedEvents.filter((e) => e.lead_id && (e.metadata?.benefit === "unlocked" || e.metadata?.benefit === "already_unlocked")).map((e) => e.lead_id as string)
  );

  const fulfilledEvents = events.filter((e) => e.event_name === "resource_benefit_fulfilled");
  const delivery: Record<DeliveryStatus, number> = { not_tracked: 0, accepted: 0, queued: 0, sent: 0, delivered: 0, bounced: 0, failed: 0 };
  for (const r of requests) delivery[r.delivery_status ?? "not_tracked"] += 1;

  const blocked = events.filter((e) => e.event_name === "resource_membership_blocked");

  const conversions = {
    viewToCta: conversion("Page view → member-benefit CTA click", "session", ctaSessions, viewSessions),
    ctaToRequest: conversion("CTA click → membership request", "session", requestSessions, ctaSessions),
    viewToRequest: conversion("Page view → membership request", "session", requestSessions, viewSessions),
    requestToConfirmed: conversion("Membership request → confirmed", "request", confirmedRequestIds, membershipIds),
    confirmedToFulfilled: conversion("Confirmed member → benefit unlocked", "member", unlockedLeads, confirmedLeads),
    fulfilledToDownloaded: conversion("Unlocked request → downloaded", "request", downloadedIds, fulfilledIds),
    readStartToCompletion: conversion("Guide start → completion", "session", doneSessions, readSessions),
    viewToReadStart: conversion("Page view → guide start", "session", readSessions, viewSessions),
  };

  const byCta = {} as Record<CtaLocation, CtaStats>;
  for (const loc of CTA_LOCATIONS) {
    const clickSessions = sessionsOf(events, "resource_cta_clicked", (e) => e.cta_location === loc);
    const submitSessions = sessionsOf(events, "resource_form_submitted", (e) => e.cta_location === loc && isValidRequest(e));
    byCta[loc] = {
      clicks: events.filter((e) => e.event_name === "resource_cta_clicked" && e.cta_location === loc).length,
      opens: events.filter((e) => e.event_name === "resource_form_opened" && e.cta_location === loc).length,
      requests: events.filter((e) => e.event_name === "resource_form_submitted" && e.cta_location === loc && isValidRequest(e)).length,
      clickToRequest: conversion(`${loc}: click → request`, "session", submitSessions, clickSessions),
    };
  }

  const integrityWarnings = [
    ...Object.values(conversions).map((c) => c.warning),
    ...Object.values(byCta).map((c) => c.clickToRequest.warning),
  ].filter((w): w is string => !!w);
  if (fulfilledRequests.length > requests.length) integrityWarnings.push("More requests are unlocked than exist in this range.");

  return {
    pageViews: count(events, "resource_page_view"),
    sessions: viewSessions.size,
    readStarts: readSessions.size,
    readCompletions: doneSessions.size,
    ctaClicks: count(events, "resource_cta_clicked"),
    ctaSessions: ctaSessions.size,
    formOpens: count(events, "resource_form_opened"),
    membershipRequests: membershipRequests.length,
    existingMemberRequests: existingMemberRequests.length,
    pendingConfirmations: pendingConfirmations.length,
    confirmedMembers: confirmedLeads.size,
    blockedAttempts: {
      unsubscribed: blocked.filter((e) => e.metadata?.reason === "unsubscribed").length,
      suppressed: blocked.filter((e) => e.metadata?.reason === "suppressed").length,
    },
    benefitsFulfilled: fulfilledEvents.length,
    fulfilledByConfirmation: fulfilledEvents.filter((e) => e.metadata?.via === "confirmation").length,
    fulfilledExistingMember: fulfilledEvents.filter((e) => e.metadata?.via === "existing_member").length,
    downloadStarts: count(events, "resource_download_started"),
    requestsDownloaded: downloadedIds.size,
    delivery,
    deliveryFailures: delivery.failed + delivery.bounced,
    unsubscribedMembers: requests.filter((r) => r.lead_consent === "opted_out").length,
    suppressedMembers: requests.filter((r) => r.lead_consent === "suppressed").length,
    requests: requests.length,
    conversions,
    byCta,
    integrityWarnings,
  };
}

export type TrendDay = { date: string; views: number; requests: number; conversion: Conversion };

/** One row per UTC day, inclusive, with zero-filled gaps. Day conversion is sessions-with-a-request / sessions-with-a-view. */
export function computeTrend(events: FunnelEvent[], fromDate: string, toDate: string): TrendDay[] {
  const days = new Map<string, { views: number; requests: number; viewSessions: Set<string>; requestSessions: Set<string> }>();
  const start = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86_400_000)) {
    days.set(d.toISOString().slice(0, 10), { views: 0, requests: 0, viewSessions: new Set(), requestSessions: new Set() });
  }
  for (const e of events) {
    const day = days.get(e.created_at.slice(0, 10));
    if (!day) continue;
    if (e.event_name === "resource_page_view") {
      day.views += 1;
      if (e.session_id) day.viewSessions.add(e.session_id);
    } else if (e.event_name === "resource_form_submitted" && isValidRequest(e)) {
      day.requests += 1;
      if (e.session_id) day.requestSessions.add(e.session_id);
    }
  }
  return [...days.entries()].map(([date, d]) => ({ date, views: d.views, requests: d.requests, conversion: conversion(date, "session", d.requestSessions, d.viewSessions) }));
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
