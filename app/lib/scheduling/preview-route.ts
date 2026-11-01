import "server-only";
import { schedulingPreviewEnabled } from "./preview";
import { json, notFound, run, type Handler } from "./http-shared";

/**
 * Route wrapper for /api/scheduling-preview/*: development only (see preview.ts) and NO sign-in. It imports no admin
 * session or database code, and its handler is given the preview's OWN service (preview-instance.ts), never the real one: whatever the live
 * configuration is, this namespace can only touch simulated data.
 *
 * A loopback Host is not authentication, so a state-changing request must also be the preview page's own: same origin (Origin, when present,
 * must be the request's own host; Sec-Fetch-Site, when present, must not be cross-site) and a JSON body. A web page on any other origin that
 * makes the browser send a request to localhost is refused before the handler runs.
 */
export function previewRoute<C = unknown>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    const host = req.headers.get("host");
    if (!schedulingPreviewEnabled(process.env, host)) return notFound();
    if (req.method !== "GET" && req.method !== "HEAD") {
      const origin = req.headers.get("origin"), fetchSite = req.headers.get("sec-fetch-site");
      let originOk = true;
      if (origin) { try { originOk = new URL(origin).host.toLowerCase() === (host ?? "").toLowerCase(); } catch { originOk = false; } }
      if (!originOk || (fetchSite !== null && fetchSite !== "same-origin" && fetchSite !== "none")) return json({ error: "Cross-origin request refused." }, 403);
      if (!/^application\/json\b/i.test(req.headers.get("content-type") ?? "")) return json({ error: "Send JSON." }, 415);
    }
    return run(fn, req, ctx);
  };
}
