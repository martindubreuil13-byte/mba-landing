/**
 * Publications: request hardening for the admin endpoints. Dependency-free so it can be unit tested.
 */

/**
 * Same-origin check for state-changing requests. A browser always sends Origin on cross-site POST/PATCH/DELETE;
 * we require it, require it to match the host the request was addressed to, and honour Sec-Fetch-Site when sent.
 */
export function isSameOriginRequest(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
  if (!host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

export class BodyTooLargeError extends Error {
  constructor() {
    super("The request is too large.");
    this.name = "BodyTooLargeError";
  }
}

/** Reads a request body with a hard byte cap, even when Content-Length is absent or lies. */
export async function readBodyBytes(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLargeError();
  if (!request.body) return new Uint8Array(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export const MAX_JSON_BYTES = 64 * 1024;

/** JSON object body, bounded. Throws BodyTooLargeError, or returns null when it is not valid JSON. */
export async function readJsonBody(request: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown | null> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(type)) return null;
  const bytes = await readBodyBytes(request, maxBytes);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
