import { adminAction } from "@/app/lib/scheduling/admin-actions";
import { bodyOf, json } from "@/app/lib/scheduling/http-shared";
import { getPreviewScheduling } from "@/app/lib/scheduling/preview-instance";
import { previewRoute } from "@/app/lib/scheduling/preview-route";

export const dynamic = "force-dynamic";

/** Development-only, sign-in-free twin of the admin API for /scheduling-preview. It is wired to the preview's own simulated service (never the real one); 404 anywhere else. */
const handle = previewRoute<{ params: Promise<{ path: string[] }> }>(async (req, { params }) => {
  const r = await adminAction(getPreviewScheduling(), req.method, (await params).path, new URL(req.url), req.method === "GET" ? {} : await bodyOf(req));
  return json(r.body, r.status);
});
export const GET = handle, POST = handle, PUT = handle;
