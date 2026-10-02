export type ResourceType =
  | "Guide"
  | "Field Guide"
  | "Checklist"
  | "Worksheet"
  | "Template"
  | "Report"
  | "Tool"
  | "Other";

export const RESOURCE_TYPES: ResourceType[] = [
  "Guide",
  "Field Guide",
  "Checklist",
  "Worksheet",
  "Template",
  "Report",
  "Tool",
  "Other",
];

export type Resource = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  resource_type: string;
  audience: string | null;
  file_path: string;
  file_name: string;
  cover_image_path: string | null;
  published: boolean;
  featured: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ResourceStatus = "draft" | "published" | "archived";

export function resourceStatus(resource: Pick<Resource, "published" | "archived">): ResourceStatus {
  if (resource.archived) return "archived";
  return resource.published ? "published" : "draft";
}

export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export type Lead = {
  id: string;
  first_name: string;
  email: string;
  country: string | null;
  ongoing_content_opt_in: boolean;
  ongoing_content_opt_in_at: string | null;
  ongoing_content_opt_out_at: string | null;
  lead_status?: LeadStatus;
  last_activity_at?: string | null;
  suppressed_at?: string | null;
  suppression_reason?: string | null;
  consent_requested_at?: string | null;
  created_at: string;
  updated_at: string;
};

/** Relationship workflow only. Consent and delivery are tracked separately. */
export type LeadStatus = "new" | "engaged" | "qualified" | "contacted" | "converted" | "archived";

export type DeliveryStatus = "not_tracked" | "accepted" | "queued" | "sent" | "delivered" | "bounced" | "failed";

export type ResourceRequest = {
  id: string;
  lead_id: string;
  resource_id: string;
  requested_at: string;
  opted_in_this_request: boolean;
  source: string | null;
  campaign: string | null;
  medium: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  resource_action?: string;
  session_id?: string | null;
  cta_location?: string | null;
  source_page_url?: string | null;
  delivery_status?: DeliveryStatus;
  delivery_provider_id?: string | null;
  delivery_error?: string | null;
  delivery_updated_at?: string | null;
  download_count?: number;
  first_download_at?: string | null;
  last_download_at?: string | null;
  /** NULL = locked (membership request awaiting confirmation); set = the member benefit was unlocked. */
  benefit_fulfilled_at?: string | null;
};

export type LeadWithStats = Lead & {
  resource_count: number;
  last_interaction_at: string;
  resource_titles: string[];
  original_source: string | null;
};
