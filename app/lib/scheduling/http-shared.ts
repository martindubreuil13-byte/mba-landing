import "server-only";
import { NextResponse } from "next/server";
import { isSchedulingError } from "./service";

/** Plumbing shared by every scheduling route handler. Deliberately imports nothing about authentication. */
export { isSchedulingError };

const noStore = { "Cache-Control": "no-store" };
export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });
export const notFound = () => json({ error: "Not found" }, 404);

export type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export async function run<C>(fn: Handler<C>, req: Request, ctx: C): Promise<Response> {
  try { return await fn(req, ctx); } catch (e) {
    if (isSchedulingError(e)) return json({ error: e.message, code: e.code, ...(e.details ?? {}) }, e.status);
    console.error("scheduling prototype error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

export async function bodyOf(req: Request): Promise<Record<string, unknown>> {
  try { const b = await req.json(); return b && typeof b === "object" ? (b as Record<string, unknown>) : {}; } catch { return {}; }
}
export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");
