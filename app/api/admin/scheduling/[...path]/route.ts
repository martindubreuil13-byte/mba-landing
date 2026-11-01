import { adminAction } from "@/app/lib/scheduling/admin-actions";
import { adminRoute, bodyOf, json } from "@/app/lib/scheduling/http";
import { getScheduling } from "@/app/lib/scheduling/instance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The real admin API: requires the signed-in admin (existing authentication, also enforced by proxy.ts for /api/admin/*). */
const handle = adminRoute<{ params: Promise<{ path: string[] }> }>(async (req, { params }) => {
  const r = await adminAction(getScheduling(), req.method, (await params).path, new URL(req.url), req.method === "GET" ? {} : await bodyOf(req));
  return json(r.body, r.status);
});
export const GET = handle, POST = handle, PUT = handle;
