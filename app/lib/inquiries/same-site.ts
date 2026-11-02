/** Refuses a browser post that did not come from this site (Origin differs, or the browser says cross-site). Calls with no Origin header (servers, tools) pass. */
export function sameSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  try { return new URL(origin).host === host; } catch { return false; }
}
