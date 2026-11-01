import "server-only";
import { NextResponse } from "next/server";
import { isSchedulingError, SchedulingError } from "./service";

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

/** Largest public request body accepted. A real booking is under 8 KB even with a 1,500-character message in a multi-byte script. */
export const PUBLIC_BODY_MAX_BYTES = 16 * 1024;

/**
 * The JSON body of a public POST, read with a hard size cap: the declared length is checked first, and the stream is cut off at the cap
 * so an undeclared or lying length cannot make the server buffer a large payload. JSON content type only (a cross-site form cannot send it).
 */
export async function publicBody(req: Request, maxBytes: number = PUBLIC_BODY_MAX_BYTES): Promise<Record<string, unknown>> {
  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") throw new SchedulingError("invalid_input", "Unsupported request.", 415);
  const tooBig = () => new SchedulingError("invalid_input", "That request is too large.", 413);
  const declared = req.headers.get("content-length");
  if (declared !== null && Number(declared) > maxBytes) throw tooBig();
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel().catch(() => undefined); throw tooBig(); }
      chunks.push(value);
    }
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch { throw new SchedulingError("invalid_input", "Invalid request.", 400); }
}

/**
 * Refuses a state-changing request that a browser says came from another site. A same-site page (or a non-browser client, which sends neither
 * header) passes; the rate limits and budgets are what hold a non-browser client back.
 */
export function assertSameSite(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
    let from = "";
    try { from = new URL(origin).host; } catch { /* malformed: refused below */ }
    if (from !== host) throw new SchedulingError("invalid_input", "This request is not allowed.", 403);
  } else if (req.headers.get("sec-fetch-site") === "cross-site") throw new SchedulingError("invalid_input", "This request is not allowed.", 403);
}
