import { isLifecycle } from "@/app/lib/contact-tags/lifecycle";
import { taggedLeadIds } from "@/app/lib/contact-tags/data";
import { isUuid } from "@/app/lib/relationships/model";
import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import {
  DEFAULT_LEAD_FILTERS,
  filterUnifiedLeads,
  leadsToCsv,
  listUnifiedLeadsAdmin,
  type LeadFilters,
} from "@/app/lib/leads/admin-queries";

const FILTER_KEYS = Object.keys(DEFAULT_LEAD_FILTERS) as (keyof LeadFilters)[];

function parseFilters(searchParams: URLSearchParams): LeadFilters {
  const filters = { ...DEFAULT_LEAD_FILTERS };
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value !== null) filters[key] = value;
  }
  return filters;
}

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || (searchParams.get("subscribersOnly") === "true" ? "subscribers" : "all");

  const leads = await listUnifiedLeadsAdmin();

  let rows = leads;
  let filename = "all-leads.csv";

  if (kind === "shortlisted") {
    rows = leads.filter((l) => l.shortlisted);
    filename = "shortlisted-leads.csv";
  } else if (kind === "subscribers") {
    rows = leads.filter((l) => !l.contact_archived_at && l.subscription_status === "subscribed");
    filename = "subscribers.csv";
  } else if (kind === "filtered") {
    const filters = parseFilters(searchParams);
    rows = filterUnifiedLeads(leads, filters).filter((lead) => Boolean(lead.contact_archived_at) === (searchParams.get("view") === "archived"));
    const tag = searchParams.get("tag");
    if (tag && isUuid(tag)) {
      const matching = new Set(await taggedLeadIds(tag));
      rows = rows.filter((row) => matching.has(row.id));
    }
    const status = searchParams.get("status");
    if (isLifecycle(status)) rows = rows.filter((row) => row.contact_lifecycle === status);
    filename = "filtered-leads.csv";
  }

  const csv = `﻿${leadsToCsv(rows)}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
