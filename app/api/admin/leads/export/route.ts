import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { listLeadsAdmin } from "@/app/lib/resources/queries";

const CSV_COLUMNS = [
  "first_name",
  "email",
  "country",
  "ongoing_content_opt_in",
  "ongoing_content_opt_in_at",
  "created_at",
  "last_interaction_at",
  "resources_requested",
  "original_source",
] as const;

function csvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subscribersOnly = searchParams.get("subscribersOnly") === "true";

  const leads = await listLeadsAdmin();
  const rows = subscribersOnly ? leads.filter((l) => l.ongoing_content_opt_in) : leads;

  const lines = [CSV_COLUMNS.join(",")];
  for (const lead of rows) {
    lines.push(
      [
        lead.first_name,
        lead.email,
        lead.country ?? "",
        lead.ongoing_content_opt_in ? "true" : "false",
        lead.ongoing_content_opt_in_at ?? "",
        lead.created_at,
        lead.last_interaction_at,
        lead.resource_titles.join("; "),
        lead.original_source ?? "",
      ]
        .map((v) => csvCell(String(v)))
        .join(",")
    );
  }

  const csv = lines.join("\n");
  const filename = subscribersOnly ? "shortlist-subscribers.csv" : "all-leads.csv";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
