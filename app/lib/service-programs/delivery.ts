/**
 * Interprets the `{ data, error }` the email client returns. The Resend SDK reports provider failures as a
 * returned `error`, not a thrown exception, and the email policy returns a blocked send the same way, so a
 * caller that only uses try/catch will wrongly treat a failed send as a success.
 *
 * "ok" means the provider ACCEPTED the message for delivery and returned an id. It does not prove the
 * message reached an inbox; that is visible only from the provider's delivery status for that id.
 */
export type SendOutcome =
  | { ok: true; id: string }
  | { ok: false; code: "email_disabled" | "provider_rejected" | "provider_error"; status?: number; detail: string };

const clip = (v: unknown) => String(v ?? "").slice(0, 300);

export function classifySend(result: unknown): SendOutcome {
  const r = (result ?? {}) as { data?: { id?: unknown } | null; error?: { name?: unknown; message?: unknown; statusCode?: unknown } | null };
  if (r.error) {
    const status = typeof r.error.statusCode === "number" ? r.error.statusCode : undefined;
    // Produced by app/lib/email-client.ts when the environment's email policy refuses the message.
    if (r.error.name === "application_error" && status === 403) return { ok: false, code: "email_disabled", status, detail: clip(r.error.message) };
    return { ok: false, code: "provider_rejected", status, detail: clip(r.error.message) };
  }
  if (typeof r.data?.id === "string" && r.data.id) return { ok: true, id: r.data.id };
  return { ok: false, code: "provider_error", detail: "The provider returned neither an id nor an error." };
}

export function thrownSend(error: unknown): SendOutcome {
  return { ok: false, code: "provider_error", detail: clip(error instanceof Error ? error.message : error) };
}
