import type { NapkinSubmissionRow } from "./types";

export const ADMIN_STATUSES = [
  "new", "reviewed", "worth_contacting", "contacted",
  "conversation_booked", "not_currently_relevant", "archived",
] as const;
export type NapkinAdminStatus = (typeof ADMIN_STATUSES)[number];

export const ADMIN_STATUS_LABELS: Record<NapkinAdminStatus, string> = {
  new: "New", reviewed: "Reviewed", worth_contacting: "Worth contacting",
  contacted: "Contacted", conversation_booked: "Conversation booked",
  not_currently_relevant: "Not currently relevant", archived: "Archived",
};

export type NapkinLead = {
  id: string; first_name: string; email: string; ongoing_content_opt_in: boolean;
  ongoing_content_opt_in_at: string | null; ongoing_content_opt_out_at: string | null;
};
export type NapkinAdminMetadata = {
  submission_id: string; internal_status: NapkinAdminStatus; private_notes: string;
  updated_at: string; updated_by: string | null;
};
export type NapkinAdminRecord = NapkinSubmissionRow & {
  lead: NapkinLead | null;
  admin: NapkinAdminMetadata | null;
};

export type NapkinFilters = {
  query: string; from: string; to: string; interpretation: string; stage: string;
  community: string; subscribed: string; unsubscribed: string; email: string;
  cta: string; currency: string; sort: string; direction: "asc" | "desc"; page: number;
};

export const DEFAULT_FILTERS: NapkinFilters = {
  query: "", from: "", to: "", interpretation: "", stage: "", community: "",
  subscribed: "", unsubscribed: "", email: "", cta: "", currency: "",
  sort: "created_at", direction: "desc", page: 1,
};

export function isSubscribed(r: NapkinAdminRecord) {
  return Boolean(r.marketing_consent && r.lead?.ongoing_content_opt_in && !r.lead.ongoing_content_opt_out_at);
}
export function isUnsubscribed(r: NapkinAdminRecord) {
  return Boolean(r.lead?.ongoing_content_opt_out_at || (r.marketing_consent && r.lead && !r.lead.ongoing_content_opt_in));
}
export function sourceLabel(r: NapkinAdminRecord) {
  return r.utm_campaign || r.campaign || r.utm_source || r.source || "—";
}

export function summarizeNapkin(records: NapkinAdminRecord[]) {
  return {
    completed: records.length,
    communityMembers: records.filter((r) => r.marketing_consent && r.lead?.email).length,
    declined: records.filter((r) => !r.marketing_consent).length,
    subscribed: records.filter(isSubscribed).length,
    unsubscribed: records.filter(isUnsubscribed).length,
    delivered: records.filter((r) => r.email_sent).length,
    failed: records.filter((r) => Boolean(r.email_error)).length,
    ctaClicks: records.filter((r) => Boolean(r.cta_clicked)).length,
  };
}

function truthFilter(value: string, actual: boolean) {
  return !value || (value === "yes" ? actual : !actual);
}

export function filterNapkin(records: NapkinAdminRecord[], f: NapkinFilters) {
  const q = f.query.trim().toLowerCase();
  return records.filter((r) => {
    const input = r.raw_inputs || ({} as NapkinSubmissionRow["raw_inputs"]);
    const haystack = [r.business_name, input.whatItSells, input.transactionSingular, r.lead?.first_name, r.lead?.email, sourceLabel(r)]
      .filter(Boolean).join(" ").toLowerCase();
    const created = new Date(r.created_at).getTime();
    return (!q || haystack.includes(q))
      && (!f.from || created >= new Date(`${f.from}T00:00:00`).getTime())
      && (!f.to || created <= new Date(`${f.to}T23:59:59.999`).getTime())
      && (!f.interpretation || r.interpretation_category === f.interpretation)
      && (!f.stage || input.businessStage === f.stage)
      && truthFilter(f.community, Boolean(r.marketing_consent && r.lead?.email))
      && truthFilter(f.subscribed, isSubscribed(r))
      && truthFilter(f.unsubscribed, isUnsubscribed(r))
      && (!f.email || (f.email === "delivered" ? r.email_sent : Boolean(r.email_error)))
      && truthFilter(f.cta, Boolean(r.cta_clicked))
      && (!f.currency || r.currency === f.currency);
  });
}

export function sortNapkin(records: NapkinAdminRecord[], f: NapkinFilters) {
  const getter = (r: NapkinAdminRecord): string | number => {
    if (f.sort === "business_name") return r.business_name?.toLowerCase() || "";
    if (f.sort === "required") return r.required_transactions_per_month ?? -Infinity;
    if (f.sort === "status") return r.admin?.internal_status || "new";
    return new Date(r.created_at).getTime();
  };
  return [...records].sort((a, b) => {
    const av = getter(a), bv = getter(b);
    const result = av < bv ? -1 : av > bv ? 1 : 0;
    return f.direction === "asc" ? result : -result;
  });
}

export function paginateNapkin(records: NapkinAdminRecord[], page: number, pageSize = 25) {
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return { rows: records.slice((currentPage - 1) * pageSize, currentPage * pageSize), currentPage, totalPages, total: records.length };
}

export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function recordsToCsv(records: NapkinAdminRecord[], kind: "filtered" | "community" | "all") {
  const rows = kind === "community" ? records.filter((r) => isSubscribed(r) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.lead?.email || "")) : records;
  const columns = kind === "community"
    ? ["first_name", "email", "consent_at", "source", "campaign"]
    : ["completed_at", "business_name", "business_stage", "currency", "selling_price", "money_remaining", "monthly_cost", "required_monthly_volume", "expected_monthly_volume", "maximum_capacity", "interpretation", "first_name", "email", "community_member", "currently_subscribed", "unsubscribed", "email_delivered", "email_failure", "cta_clicked", "source", "campaign", "internal_status"];
  const lines = [columns.join(",")];
  for (const r of rows) {
    const i = r.raw_inputs || ({} as NapkinSubmissionRow["raw_inputs"]);
    const full: Record<string, unknown> = {
      completed_at: r.created_at, business_name: r.business_name, business_stage: i.businessStage,
      currency: r.currency, selling_price: r.selling_price, money_remaining: r.money_remaining_per_transaction,
      monthly_cost: r.monthly_operating_cost, required_monthly_volume: r.required_transactions_per_month,
      expected_monthly_volume: i.expectedMonthlyVolume, maximum_capacity: i.maxMonthlyCapacity,
      interpretation: r.interpretation_category, first_name: r.lead?.first_name, email: r.lead?.email,
      community_member: Boolean(r.marketing_consent && r.lead?.email), currently_subscribed: isSubscribed(r),
      unsubscribed: isUnsubscribed(r), email_delivered: r.email_sent, email_failure: r.email_error,
      cta_clicked: r.cta_clicked, source: r.utm_source || r.source, campaign: r.utm_campaign || r.campaign,
      internal_status: r.admin?.internal_status || "new", consent_at: r.consent_at,
    };
    lines.push(columns.map((c) => csvCell(full[c])).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}
