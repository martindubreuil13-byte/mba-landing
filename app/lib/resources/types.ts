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

/** Relationship workflow only. Consent is derived separately (see app/lib/leads/consent.ts). */
export type LeadStatus = "new" | "engaged" | "qualified" | "contacted" | "converted" | "archived";

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
};

export type LeadWithStats = Lead & {
  resource_count: number;
  last_interaction_at: string;
  resource_titles: string[];
  original_source: string | null;
};
