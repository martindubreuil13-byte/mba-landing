/** An error from the outreach endpoint: the server's message, plus a machine-readable `code` for the cases the interface handles specially. */
export class OutreachError extends Error {
  constructor(message: string, readonly code?: string, readonly status?: number) { super(message); this.name = "OutreachError"; }
}

/** Browser helper for the individual-outreach endpoint. Throws an OutreachError carrying the server's message. */
export async function callOutreach<T>(body: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/admin/email/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new OutreachError("The server could not be reached. Check your connection and try again.", "network");
  }
  const result = await response.json().catch(() => ({})) as { error?: string; code?: string };
  if (!response.ok) throw new OutreachError(result.error ?? "The request could not be completed.", result.code, response.status);
  return result as T;
}
