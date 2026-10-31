import "server-only";
import { NextResponse } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { PublicationError } from "./queries";
import { BodyTooLargeError, isSameOriginRequest } from "./request-guards";

/**
 * Every /api/admin/publications endpoint is wrapped in this. Order matters and is the contract:
 *   1. authenticate (Supabase getUser + the ADMIN_EMAIL allow-list) — nothing privileged has been touched yet;
 *   2. same-origin check for state-changing methods;
 *   3. only then the handler, which is where the service-role client is first used.
 * Errors are mapped to safe messages; unexpected ones are logged server-side and never echoed.
 */
type Handler<C> = (request: Request, context: C) => Promise<NextResponse>;

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function withPublicationsAdmin<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (MUTATING.has(request.method.toUpperCase()) && !isSameOriginRequest(request.headers)) {
      return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
    }

    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof PublicationError) {
        return NextResponse.json({ error: error.message, code: error.code, fieldErrors: error.fieldErrors }, { status: error.status });
      }
      if (error instanceof BodyTooLargeError) {
        return NextResponse.json({ error: "The request is too large.", code: "too_large" }, { status: 413 });
      }
      console.error("publications admin route failed:", error);
      return NextResponse.json({ error: "Something went wrong. Nothing was changed.", code: "server" }, { status: 500 });
    }
  };
}
