import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { consentStatusOf } from "@/app/lib/leads/consent";
import { bandFor, OVERALL_BANDS } from "@/app/lib/assessment/config";
import { INTERPRETATION_LABELS, type InterpretationCategory } from "@/app/lib/napkin/config";
import type { Lead } from "@/app/lib/resources/types";

// ============================================================
// Shared row shapes pulled directly from each feature's own table —
// deliberately minimal selects, no schema changes, no duplicated data.
// ============================================================

type ResourceRequestRow = {
  lead_id: string;
  requested_at: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  resource: { title: string } | { title: string }[] | null;
};

type AssessmentRow = {
  id: string;
  lead_id: string | null;
  created_at: string;
  completed_at: string | null;
  idea_name: string | null;
  business_stage: string;
  overall_score: number;
  source: string | null;
  medium: string | null;
  campaign: string | null;
};

type NapkinRow = {
  id: string;
  lead_id: string | null;
  created_at: string;
  joined_at: string | null;
  business_name: string | null;
  interpretation_category: InterpretationCategory;
  currency: string;
  required_transactions_per_month: number | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
};

type ConsentOptInRow = {
  lead_id: string;
  created_at: string;
  wording_version: string;
  source_type: string | null;
  resource: { slug: string } | { slug: string }[] | null;
};

/** Where an opt-in came from, e.g. "resource: the-second-act", or blank when the evidence does not say. */
export function consentSourceLabel(record: Pick<ConsentOptInRow, "source_type" | "resource">): string {
  const res = Array.isArray(record.resource) ? record.resource[0] : record.resource;
  if (res?.slug) return `${record.source_type ?? "resource"}: ${res.slug}`;
  return record.source_type ?? "";
}

type PmbQuestionRow = {
  id: string;
  created_at: string;
  question: string;
  name: string;
  email: string;
  page_path: string | null;
  status: string;
};

async function fetchAll() {
  const supabase = getServiceClient();
  const [{ data: leads, error: leadsError }, { data: requests }, { data: assessments }, { data: napkin }, { data: pmb }, { data: consent }] =
    await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("resource_requests")
        .select("lead_id, requested_at, source, medium, campaign, resource:resources(title)"),
      supabase
        .from("assessments")
        .select("id, lead_id, created_at, completed_at, idea_name, business_stage, overall_score, source, medium, campaign")
        .not("lead_id", "is", null),
      supabase
        .from("napkin_submissions")
        .select("id, lead_id, created_at, joined_at, business_name, interpretation_category, currency, required_transactions_per_month, source, medium, campaign")
        .not("lead_id", "is", null),
      supabase.from("pmb_questions").select("id, created_at, question, name, email, page_path, status"),
      supabase
        .from("consent_records")
        .select("lead_id, created_at, wording_version, source_type, resource:resources(slug)")
        .eq("action", "opt_in")
        .order("created_at", { ascending: false }),
    ]);

  if (leadsError) throw new Error(`Failed to load leads: ${leadsError.message}`);

  return {
    leads: (leads ?? []) as Lead[],
    requests: (requests ?? []) as ResourceRequestRow[],
    assessments: (assessments ?? []) as AssessmentRow[],
    napkin: (napkin ?? []) as NapkinRow[],
    pmb: (pmb ?? []) as PmbQuestionRow[],
    consent: (consent ?? []) as ConsentOptInRow[],
  };
}

function resourceTitle(resource: ResourceRequestRow["resource"]) {
  return Array.isArray(resource) ? resource[0]?.title : resource?.title;
}

// ============================================================
// UNIFIED LEADS TABLE
// ============================================================

export type SubscriptionStatus = "subscribed" | "pending_confirmation" | "unsubscribed" | "suppressed" | "never_subscribed";

export type UnifiedLeadRow = {
  id: string;
  first_name: string;
  email: string;
  country: string | null;
  shortlisted: boolean;
  subscription_status: SubscriptionStatus;
  /** When the current marketing consent was given, plus the wording version and source that produced it. */
  consent_at: string | null;
  consent_version: string;
  consent_source: string;
  first_acquired_at: string;
  last_interaction_at: string;
  acquired_through: string;
  resource_count: number;
  resource_titles: string[];
  napkin_count: number;
  reality_check_count: number;
  pmb_count: number;
};

/**
 * Marketing audience = "subscribed" only (confirmed opt-in). Pending leads asked to
 * join but have not confirmed their email, so they are excluded from subscriber exports.
 */
function subscriptionStatus(lead: Lead): SubscriptionStatus {
  const consent = consentStatusOf({ ...lead, suppressed_at: lead.suppressed_at ?? null, consent_requested_at: lead.consent_requested_at ?? null });
  if (consent === "suppressed") return "suppressed";
  if (consent === "opted_in") return "subscribed";
  if (consent === "pending" && lead.consent_requested_at) return "pending_confirmation";
  if (consent === "opted_out") return "unsubscribed";
  return "never_subscribed";
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  subscribed: "Subscribed",
  pending_confirmation: "Awaiting confirmation",
  unsubscribed: "Unsubscribed",
  suppressed: "Suppressed",
  never_subscribed: "Never subscribed",
};

export async function listUnifiedLeadsAdmin(): Promise<UnifiedLeadRow[]> {
  const { leads, requests, assessments, napkin, pmb, consent } = await fetchAll();
  const latestConsent = new Map<string, ConsentOptInRow>(); // rows arrive newest first
  for (const c of consent) if (!latestConsent.has(c.lead_id)) latestConsent.set(c.lead_id, c);
  const pmbByEmail = new Map<string, PmbQuestionRow[]>();
  for (const q of pmb) {
    const key = q.email.trim().toLowerCase();
    const list = pmbByEmail.get(key) ?? [];
    list.push(q);
    pmbByEmail.set(key, list);
  }

  return leads.map((lead) => {
    const leadRequests = requests.filter((r) => r.lead_id === lead.id);
    const leadAssessments = assessments.filter((a) => a.lead_id === lead.id);
    const leadNapkin = napkin.filter((n) => n.lead_id === lead.id);
    const leadPmb = pmbByEmail.get(lead.email.trim().toLowerCase()) ?? [];

    // Acquisition = the earliest activity of any kind. Falls back to the
    // lead's own created_at (a resource request always creates the lead at
    // the same instant, so this is only a fallback in practice).
    type Acquisition = { at: string; type: "resource" | "napkin" | "reality_check"; label: string };
    const candidates: Acquisition[] = [
      ...leadRequests.map((r) => ({
        at: r.requested_at,
        type: "resource" as const,
        label: `Resource — ${resourceTitle(r.resource) ?? "unknown"}${[r.source, r.medium, r.campaign].filter(Boolean).length ? ` (${[r.source, r.medium, r.campaign].filter(Boolean).join(" / ")})` : ""}`,
      })),
      ...leadAssessments.map((a) => ({
        at: a.completed_at ?? a.created_at,
        type: "reality_check" as const,
        label: `Reality Check${[a.source, a.medium, a.campaign].filter(Boolean).length ? ` (${[a.source, a.medium, a.campaign].filter(Boolean).join(" / ")})` : ""}`,
      })),
      ...leadNapkin.map((n) => ({
        at: n.joined_at ?? n.created_at,
        type: "napkin" as const,
        label: `Napkin Principle${[n.source, n.medium, n.campaign].filter(Boolean).length ? ` (${[n.source, n.medium, n.campaign].filter(Boolean).join(" / ")})` : ""}`,
      })),
    ];
    candidates.sort((a, b) => a.at.localeCompare(b.at));
    const acquiredThrough = candidates[0]?.label ?? "Direct";

    const allTimestamps = [
      lead.created_at,
      ...leadRequests.map((r) => r.requested_at),
      ...leadAssessments.map((a) => a.completed_at ?? a.created_at),
      ...leadNapkin.map((n) => n.joined_at ?? n.created_at),
      ...leadPmb.map((q) => q.created_at),
      ...(lead.ongoing_content_opt_in_at ? [lead.ongoing_content_opt_in_at] : []),
      ...(lead.ongoing_content_opt_out_at ? [lead.ongoing_content_opt_out_at] : []),
    ];
    const lastInteraction = allTimestamps.reduce((latest, t) => (t > latest ? t : latest), lead.created_at);

    return {
      id: lead.id,
      first_name: lead.first_name,
      email: lead.email,
      country: lead.country,
      shortlisted: lead.ongoing_content_opt_in,
      subscription_status: subscriptionStatus(lead),
      consent_at: lead.ongoing_content_opt_in ? lead.ongoing_content_opt_in_at : null,
      consent_version: lead.ongoing_content_opt_in ? (latestConsent.get(lead.id)?.wording_version ?? "") : "",
      consent_source: lead.ongoing_content_opt_in && latestConsent.get(lead.id) ? consentSourceLabel(latestConsent.get(lead.id)!) : "",
      first_acquired_at: lead.created_at,
      last_interaction_at: lastInteraction,
      acquired_through: acquiredThrough,
      resource_count: leadRequests.length,
      resource_titles: leadRequests.map((r) => resourceTitle(r.resource)).filter((t): t is string => Boolean(t)),
      napkin_count: leadNapkin.length,
      reality_check_count: leadAssessments.filter((a) => a.completed_at).length,
      pmb_count: leadPmb.length,
    };
  });
}

// ============================================================
// CSV EXPORT
// ============================================================

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const EXPORT_COLUMNS = [
  "first_name",
  "email",
  "country",
  "acquired_through",
  "shortlisted",
  "subscription_status",
  "consent_at",
  "consent_source",
  "consent_version",
  "first_acquired_at",
  "last_interaction_at",
  "resources_consumed",
  "napkin_completions",
  "reality_check_completions",
  "pick_my_brain_questions",
] as const;

export function leadsToCsv(rows: UnifiedLeadRow[]): string {
  const lines = [EXPORT_COLUMNS.join(",")];
  for (const r of rows) {
    const values: Record<(typeof EXPORT_COLUMNS)[number], unknown> = {
      first_name: r.first_name,
      email: r.email,
      country: r.country ?? "",
      acquired_through: r.acquired_through,
      shortlisted: r.shortlisted ? "true" : "false",
      subscription_status: r.subscription_status,
      consent_at: r.consent_at ?? "",
      consent_source: r.consent_source,
      consent_version: r.consent_version,
      first_acquired_at: r.first_acquired_at,
      last_interaction_at: r.last_interaction_at,
      resources_consumed: r.resource_titles.join("; "),
      napkin_completions: r.napkin_count,
      reality_check_completions: r.reality_check_count,
      pick_my_brain_questions: r.pmb_count,
    };
    lines.push(EXPORT_COLUMNS.map((c) => csvCell(values[c])).join(","));
  }
  return lines.join("\r\n");
}

// ============================================================
// FILTERS
// ============================================================

export type LeadFilters = {
  query: string;
  shortlisted: string; // "" | "yes" | "no"
  subscription: string; // "" | SubscriptionStatus
  country: string;
  hasNapkin: string; // "" | "yes" | "no"
  hasRealityCheck: string;
  hasPmb: string;
  from: string;
  to: string;
};

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  query: "",
  shortlisted: "",
  subscription: "",
  country: "",
  hasNapkin: "",
  hasRealityCheck: "",
  hasPmb: "",
  from: "",
  to: "",
};

function truthy(filterValue: string, actual: boolean) {
  return !filterValue || (filterValue === "yes" ? actual : !actual);
}

export function filterUnifiedLeads(rows: UnifiedLeadRow[], f: LeadFilters): UnifiedLeadRow[] {
  const q = f.query.trim().toLowerCase();
  return rows.filter((r) => {
    const haystack = [r.first_name, r.email, r.country, r.acquired_through].filter(Boolean).join(" ").toLowerCase();
    const acquired = new Date(r.first_acquired_at).getTime();
    return (
      (!q || haystack.includes(q)) &&
      truthy(f.shortlisted, r.shortlisted) &&
      (!f.subscription || r.subscription_status === f.subscription) &&
      (!f.country || r.country === f.country) &&
      truthy(f.hasNapkin, r.napkin_count > 0) &&
      truthy(f.hasRealityCheck, r.reality_check_count > 0) &&
      truthy(f.hasPmb, r.pmb_count > 0) &&
      (!f.from || acquired >= new Date(`${f.from}T00:00:00`).getTime()) &&
      (!f.to || acquired <= new Date(`${f.to}T23:59:59.999`).getTime())
    );
  });
}

// ============================================================
// LEAD DETAIL — activity timeline
// ============================================================

export type ActivityEvent = {
  at: string;
  kind: "resource" | "napkin" | "reality_check" | "pmb" | "opt_in" | "opt_out";
  title: string;
  description: string;
  href: string | null;
  card?: NapkinCard | RealityCheckCard;
};

export type NapkinCard = {
  type: "napkin";
  id: string;
  businessName: string | null;
  interpretationLabel: string;
  requiredPerMonth: number | null;
  currency: string;
};

export type RealityCheckCard = {
  type: "reality_check";
  id: string;
  ideaName: string | null;
  overallScore: number;
  band: string;
};

export type LeadDetail = {
  lead: Lead;
  row: UnifiedLeadRow;
  timeline: ActivityEvent[];
};

export async function getLeadDetailAdmin(id: string): Promise<LeadDetail | null> {
  const supabase = getServiceClient();
  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  if (!lead) return null;

  const [{ data: requests }, { data: assessments }, { data: napkin }, { data: pmb }, { data: optInRecords }] = await Promise.all([
    supabase
      .from("resource_requests")
      .select("lead_id, requested_at, resource:resources(title, slug)")
      .eq("lead_id", id),
    supabase
      .from("assessments")
      .select("id, created_at, completed_at, idea_name, overall_score")
      .eq("lead_id", id),
    supabase
      .from("napkin_submissions")
      .select("id, created_at, joined_at, business_name, interpretation_category, currency, required_transactions_per_month")
      .eq("lead_id", id),
    supabase.from("pmb_questions").select("id, created_at, question, page_path").ilike("email", lead.email),
    supabase
      .from("consent_records")
      .select("lead_id, created_at, wording_version, source_type, resource:resources(slug)")
      .eq("lead_id", id)
      .eq("action", "opt_in")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const latestOptIn = ((optInRecords ?? []) as ConsentOptInRow[])[0];

  const timeline: ActivityEvent[] = [];

  timeline.push({
    at: lead.created_at,
    kind: "opt_in",
    title: "Lead created",
    description: `First captured ${new Date(lead.created_at).toLocaleString()}.`,
    href: null,
  });

  if (lead.ongoing_content_opt_in_at) {
    timeline.push({
      at: lead.ongoing_content_opt_in_at,
      kind: "opt_in",
      title: "Joined the shortlist",
      description: latestOptIn
        ? `Opted in to ongoing content${consentSourceLabel(latestOptIn) ? ` (${consentSourceLabel(latestOptIn)})` : ""}. Wording: ${latestOptIn.wording_version}.`
        : "Opted in to ongoing content.",
      href: null,
    });
  }
  if (lead.ongoing_content_opt_out_at) {
    timeline.push({
      at: lead.ongoing_content_opt_out_at,
      kind: "opt_out",
      title: "Unsubscribed",
      description: "Opted out of ongoing content.",
      href: null,
    });
  }

  type ReqRow = { requested_at: string; resource: { title: string; slug: string } | { title: string; slug: string }[] | null };
  for (const r of (requests ?? []) as ReqRow[]) {
    const res = Array.isArray(r.resource) ? r.resource[0] : r.resource;
    timeline.push({
      at: r.requested_at,
      kind: "resource",
      title: `Requested resource: ${res?.title ?? "unknown"}`,
      description: "Downloaded a free resource.",
      href: res?.slug ? `/resources/${res.slug}` : null,
    });
  }

  type AssRow = { id: string; created_at: string; completed_at: string | null; idea_name: string | null; overall_score: number };
  for (const a of (assessments ?? []) as AssRow[]) {
    if (!a.completed_at) continue;
    timeline.push({
      at: a.completed_at,
      kind: "reality_check",
      title: `Completed Reality Check${a.idea_name ? `: ${a.idea_name}` : ""}`,
      description: `Score ${a.overall_score}/100.`,
      href: `/admin/assessments/${a.id}`,
      card: {
        type: "reality_check",
        id: a.id,
        ideaName: a.idea_name,
        overallScore: a.overall_score,
        band: bandFor(OVERALL_BANDS, a.overall_score).label,
      },
    });
  }

  type NapRow = {
    id: string;
    created_at: string;
    joined_at: string | null;
    business_name: string | null;
    interpretation_category: InterpretationCategory;
    currency: string;
    required_transactions_per_month: number | null;
  };
  for (const n of (napkin ?? []) as NapRow[]) {
    timeline.push({
      at: n.joined_at ?? n.created_at,
      kind: "napkin",
      title: `Completed the Napkin Principle${n.business_name ? `: ${n.business_name}` : ""}`,
      description: INTERPRETATION_LABELS[n.interpretation_category] ?? n.interpretation_category,
      href: `/admin/napkin/${n.id}`,
      card: {
        type: "napkin",
        id: n.id,
        businessName: n.business_name,
        interpretationLabel: INTERPRETATION_LABELS[n.interpretation_category] ?? n.interpretation_category,
        requiredPerMonth: n.required_transactions_per_month,
        currency: n.currency,
      },
    });
  }

  type PmbRow = { id: string; created_at: string; question: string; page_path: string | null };
  for (const q of (pmb ?? []) as PmbRow[]) {
    timeline.push({
      at: q.created_at,
      kind: "pmb",
      title: "Submitted a Pick My Brain question",
      description: q.question,
      href: "/admin/pick-my-brain",
    });
  }

  timeline.sort((a, b) => b.at.localeCompare(a.at));

  const [allRows] = await Promise.all([listUnifiedLeadsAdmin()]);
  const row = allRows.find((r) => r.id === id);
  if (!row) return null;

  return { lead: lead as Lead, row, timeline };
}
