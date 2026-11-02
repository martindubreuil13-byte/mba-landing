import "server-only";
import { getServiceClient } from "@/app/lib/supabase/service";
import type { BookingPrefill } from "../service";

/**
 * Lets the booking page greet a Transition applicant who arrives from their confirmation screen or invitation email: it finds the application
 * by its opaque `booking_ref` (the random token already carried in those links) and returns ONLY the applicant's own name and email, so the two
 * fields are filled in. Nothing else about the application (answers, country, motivation, attribution) ever leaves this function, and nothing it
 * returns is written to a URL. Read-only; an unknown or malformed ref answers null.
 */
export async function inquiryPrefill(ref: string): Promise<BookingPrefill | null> {
  const { data, error } = await getServiceClient().from("program_applications").select("answers").eq("booking_ref", ref).maybeSingle();
  if (error) throw new Error(`Could not look up the application: ${error.message}`);
  const a = (data?.answers ?? null) as { firstName?: unknown; lastName?: unknown; email?: unknown } | null;
  const email = typeof a?.email === "string" ? a.email.trim().slice(0, 200) : "";
  if (!email) return null;
  const part = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return { name: [part(a?.firstName), part(a?.lastName)].filter(Boolean).join(" ").slice(0, 120), email };
}
