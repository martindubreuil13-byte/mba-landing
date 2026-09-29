import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { listNapkinAdmin } from "@/app/lib/napkin/admin-queries";
import { DEFAULT_FILTERS, filterNapkin, recordsToCsv, sortNapkin, type NapkinFilters } from "@/app/lib/napkin/admin-model";

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = new URL(req.url).searchParams;
  const kind = p.get("kind") === "community" ? "community" : p.get("kind") === "all" ? "all" : "filtered";
  const filters: NapkinFilters = { ...DEFAULT_FILTERS, query:p.get("query")||"",from:p.get("from")||"",to:p.get("to")||"",interpretation:p.get("interpretation")||"",stage:p.get("stage")||"",community:p.get("community")||"",subscribed:p.get("subscribed")||"",unsubscribed:p.get("unsubscribed")||"",email:p.get("email")||"",cta:p.get("cta")||"",currency:p.get("currency")||"",sort:p.get("sort")||"created_at",direction:p.get("direction")==="asc"?"asc":"desc",page:1 };
  const all = await listNapkinAdmin();
  const rows = kind === "filtered" ? sortNapkin(filterNapkin(all,filters),filters) : all;
  const csv = recordsToCsv(rows,kind);
  return new NextResponse(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="napkin-${kind}-${new Date().toISOString().slice(0,10)}.csv"`,"Cache-Control":"no-store"}});
}
