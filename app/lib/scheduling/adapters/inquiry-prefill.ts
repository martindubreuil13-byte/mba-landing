import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import { inquiryStoreEnabled } from "@/app/lib/inquiries/config";
import { prefillExpired } from "@/app/lib/inquiries/refs";
import type { Origin } from "@/app/lib/inquiries/context";
import type { BookingPrefill } from "../service";

/**
 * Lets the booking page greet someone who arrives from an application's confirmation screen or invitation e-mail, or from the e-mail answering a
 * program inquiry. The opaque reference (a random token, no personal data) finds the record; two things come back:
 *   - `prefill`: ONLY that person's own name and e-mail, so the two fields are filled in. Nothing else (answers, message, country, attribution) leaves
 *     this file, and nothing returned goes in a URL. It stops 60 days after the reference was issued: for an inquiry, when it was received; for a
 *     Transition application, the later of its submission and the latest invitation e-mail the provider accepted (so an invitation re-sent from admin
 *     starts a new window).
 *   - `origin`: which inquiry or application it is, whatever the age, so a booking made from an old link can still be linked to where it came from.
 * An unknown or malformed reference answers null. Read-only. Inquiries are consulted only while stored inquiries are switched on.
 */
type Resolved = { origin: Origin; prefill: BookingPrefill | null };

async function resolve(ref: string, now: number): Promise<Resolved | null> {
  const db = getServiceClient();

  if (inquiryStoreEnabled()) {
    const found = await db.from("program_inquiries").select("id, full_name, lead_id, created_at").eq("booking_ref", ref).maybeSingle();
    // A problem reading the newer table must never take away the existing Transition behaviour: fall through to applications.
    if (!found.error && found.data) {
      const row = found.data as { id: string; full_name: string; lead_id: string; created_at: string };
      const origin: Origin = { kind: "inquiry", id: row.id };
      if (prefillExpired(row.created_at, now)) return { origin, prefill: null };
      const lead = await db.from("leads").select("email").eq("id", row.lead_id).maybeSingle();
      const email = typeof (lead.data as { email?: unknown } | null)?.email === "string" ? (lead.data as { email: string }).email.trim().slice(0, 200) : "";
      return { origin, prefill: email ? { name: row.full_name.trim().slice(0, 120), email } : null };
    }
    if (found.error) console.error("booking reference: could not read inquiries:", found.error.message);
  }

  const { data, error } = await db.from("program_applications").select("id, answers, submitted_at").eq("booking_ref", ref).maybeSingle();
  if (error) throw new Error(`Could not look up the application: ${error.message}`);
  if (!data) return null;
  const app = data as { id: string; answers: unknown; submitted_at: string };
  const origin: Origin = { kind: "application", id: app.id };
  const sends = await db.from("program_invitation_sends").select("attempted_at").eq("application_id", app.id).eq("status", "accepted").order("attempted_at", { ascending: false }).limit(1);
  const lastSend = (sends.data as { attempted_at: string }[] | null)?.[0]?.attempted_at;
  const issued = Math.max(Date.parse(app.submitted_at) || 0, lastSend ? Date.parse(lastSend) || 0 : 0);
  if (prefillExpired(issued || null, now)) return { origin, prefill: null };

  const a = (app.answers ?? null) as { firstName?: unknown; lastName?: unknown; email?: unknown } | null;
  const email = typeof a?.email === "string" ? a.email.trim().slice(0, 200) : "";
  if (!email) return { origin, prefill: null };
  const part = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return { origin, prefill: { name: [part(a?.firstName), part(a?.lastName)].filter(Boolean).join(" ").slice(0, 120), email } };
}

export async function inquiryPrefill(ref: string, now: number = Date.now()): Promise<BookingPrefill | null> {
  return (await resolve(ref, now))?.prefill ?? null;
}

export async function refOrigin(ref: string, now: number = Date.now()): Promise<Origin | null> {
  return (await resolve(ref, now))?.origin ?? null;
}
