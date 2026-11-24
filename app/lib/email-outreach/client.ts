/** Browser helper for the individual-outreach endpoint. Throws an Error carrying the server's message, so callers can show it as is. */
export async function callOutreach<T>(body: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/admin/email/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("The server could not be reached. Check your connection and try again.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((result as { error?: string }).error ?? "The request could not be completed.");
  return result as T;
}
