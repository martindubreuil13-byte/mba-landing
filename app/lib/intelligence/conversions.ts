import "server-only";
import { randomUUID } from "node:crypto";
import { deploymentEnv } from "@/app/lib/deployment";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { ConversionKind } from "./events";
import { isExcludedPath, sanitizePath, SESSION_ID_RE } from "./payload";

/** Header the browser tracker adds to lead-capture requests so the server can link a conversion to the visit. */
export const SESSION_HEADER = "x-wi-sid";

/** The page a form was submitted from, taken from the same-origin Referer (path only, never the query string). */
export function refererPath(req: Request): string | null {
  const ref = req.headers.get("referer");
  if (!ref) return null;
  try {
    const path = sanitizePath(new URL(ref).pathname);
    return path && !isExcludedPath(path) ? path : null;
  } catch {
    return null;
  }
}

/**
 * Records a SERVER-CONFIRMED conversion: call it only after the system of record (or the email provider, for /lets-talk)
 * accepted the submission. The visit is linked only when the browser sent its per-tab session id (it does not when the
 * visitor has GPC/DNT on, or scripts are blocked); the conversion is still counted, unattributed. No personal data is
 * sent: only the kind, the page, and an opaque reference to the system of record. Never throws and never blocks a flow.
 */
export async function recordConversion(
  req: Request,
  c: { kind: ConversionKind; refTable?: string; refId?: string | null; props?: Record<string, string | number | boolean> }
): Promise<boolean> {
  try {
    const header = req.headers.get(SESSION_HEADER);
    const sid = header && SESSION_ID_RE.test(header) ? header : null;
    const { data, error } = await getServiceClient().rpc("wi_record_conversion", {
      p: {
        event_id: `${c.kind}:${c.refId ?? randomUUID()}`.slice(0, 120),
        name: `${c.kind}_confirmed`,
        kind: c.kind,
        path: refererPath(req),
        sid,
        ref_table: c.refTable ?? null,
        ref_id: c.refId ?? null,
        props: c.props ?? {},
        environment: deploymentEnv(),
      },
    });
    if (error) throw new Error(error.message);
    return Boolean((data as { recorded?: boolean } | null)?.recorded);
  } catch (error) {
    console.error(`Website Intelligence: could not record ${c.kind} conversion:`, error instanceof Error ? error.message : error);
    return false;
  }
}
