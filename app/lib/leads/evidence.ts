import "server-only";
import { createHmac } from "node:crypto";

function secret() {
  const value = process.env.EVIDENCE_HASH_SECRET || process.env.NAPKIN_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Evidence hashing is not configured.");
  return value;
}

/**
 * Keyed hash of an IP address or user agent. Consent evidence needs to show
 * "the same device submitted this", not to store a raw IP: a keyed hash lets us
 * compare against a later claim without keeping personal data in the clear.
 */
export function hashEvidence(value: string | null | undefined): string | null {
  if (!value || value === "unknown") return null;
  return createHmac("sha256", secret()).update(value).digest("hex").slice(0, 32);
}
