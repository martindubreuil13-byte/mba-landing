import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getServiceClient } from "@/app/lib/supabase/service";
import { retentionCutoff } from "./config";

/**
 * Persistence for program inquiries (table program_inquiries, service role only). Every state change is a single conditional UPDATE, so two
 * simultaneous requests for the same inquiry cannot both win a step. Nothing here sends e-mail; see ./submit.ts.
 */
export type OwnerStatus = "pending" | "sending" | "accepted" | "failed";
export type AutoReplyStatus = "pending" | "sending" | "accepted" | "failed";

export type InquiryRow = {
  id: string; lead_id: string; program_slug: string | null; full_name: string; situation: string | null; message: string;
  attribution: Record<string, string>; booking_ref: string; idempotency_key: string; content_hash: string;
  owner_status: OwnerStatus; owner_claimed_at: string | null; owner_attempts: number; owner_message_id: string | null; owner_error: string | null; owner_accepted_at: string | null;
  auto_reply_status: AutoReplyStatus; auto_reply_message_id: string | null; auto_reply_error: string | null;
  message_purged_at: string | null; created_at: string; updated_at: string;
};

const db = () => getServiceClient();
const clip = (v: unknown, n = 300) => String(v ?? "").slice(0, n);
const UNIQUE_VIOLATION = "23505";

/** The same opaque-token shape the Transition applications use (18 random bytes, 24 base64url characters). */
export const newBookingRef = () => randomBytes(18).toString("base64url");

export function contentHash(i: { email: string; message: string; program?: string | null; situation?: string | null }): string {
  return createHash("sha256").update(JSON.stringify([i.email.trim().toLowerCase(), i.message, i.program ?? "", i.situation ?? ""])).digest("hex");
}

/** For a browser that sent no key (cached old page, a script): the same person sending the same words within ten minutes is the same submission. */
export const derivedKey = (hash: string, now: number = Date.now()) => `auto-${hash.slice(0, 32)}-${Math.floor(now / 600_000)}`;

/**
 * The person behind the inquiry. An existing lead is NEVER renamed or re-countried by a public form (anyone can type anyone's address), and an
 * inquiry is not marketing consent: ongoing_content_opt_in is left exactly as it was (false for a new lead). Throws if the database is unavailable.
 */
export async function createOrTouchLead(email: string, fullName: string): Promise<{ id: string }> {
  const addr = email.trim().toLowerCase();
  const find = async () => {
    const { data, error } = await db().from("leads").select("id").eq("email", addr).maybeSingle();
    if (error) throw new Error(`Could not look up the lead: ${error.message}`);
    return data as { id: string } | null;
  };
  const existing = await find();
  if (existing) {
    await db().from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", existing.id);
    return existing;
  }
  const first = fullName.trim().split(/\s+/)[0]?.slice(0, 60) || "Visitor";
  const { data, error } = await db().from("leads").insert({ first_name: first, email: addr, ongoing_content_opt_in: false, last_activity_at: new Date().toISOString() }).select("id").single();
  if (error) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) { const raced = await find(); if (raced) return raced; }
    throw new Error(`Could not create the lead: ${error.message}`);
  }
  return data as { id: string };
}

export async function findByKey(key: string): Promise<InquiryRow | null> {
  const { data, error } = await db().from("program_inquiries").select("*").eq("idempotency_key", key).maybeSingle();
  if (error) throw new Error(`Could not look up the inquiry: ${error.message}`);
  return (data as InquiryRow | null) ?? null;
}

export type NewInquiry = { lead_id: string; program_slug: string | null; full_name: string; situation: string | null; message: string; attribution: Record<string, string>; idempotency_key: string; content_hash: string };

/** Inserts the inquiry, or returns the row that a simultaneous identical request just inserted. Throws if nothing could be stored. */
export async function insertInquiry(input: NewInquiry): Promise<InquiryRow> {
  const { data, error } = await db().from("program_inquiries").insert({ ...input, booking_ref: newBookingRef() }).select("*").single();
  if (!error) return data as InquiryRow;
  if ((error as { code?: string }).code === UNIQUE_VIOLATION) { const raced = await findByKey(input.idempotency_key); if (raced) return raced; }
  throw new Error(`Could not store the inquiry: ${error.message}`);
}

/** A retry after a failed owner notification may carry corrected words: the unsent row takes them instead of becoming a second record. */
export async function reviseUnsent(id: string, f: Pick<NewInquiry, "program_slug" | "full_name" | "situation" | "message" | "attribution" | "content_hash">): Promise<void> {
  const { error } = await db().from("program_inquiries").update(f).eq("id", id).neq("owner_status", "accepted");
  if (error) throw new Error(`Could not update the inquiry: ${error.message}`);
}

/**
 * Wins the right to send the owner notification, or returns null. Two atomic steps: a row that is pending or failed is claimed outright; a row stuck
 * in 'sending' (a request that died mid-send) is claimed only after `staleMs`. The caller reuses the same provider idempotency key for a stale
 * claim, so a notification that WAS accepted before the crash is not delivered twice.
 */
export async function claimOwnerSend(id: string, now: number = Date.now(), staleMs = 120_000): Promise<InquiryRow | null> {
  const stamp = new Date(now).toISOString();
  const fresh = await db().from("program_inquiries").update({ owner_status: "sending", owner_claimed_at: stamp }).eq("id", id).in("owner_status", ["pending", "failed"]).select("*");
  if (fresh.error) throw new Error(`Could not claim the inquiry: ${fresh.error.message}`);
  if ((fresh.data as InquiryRow[]).length) return (fresh.data as InquiryRow[])[0];
  const stale = await db().from("program_inquiries").update({ owner_claimed_at: stamp }).eq("id", id).eq("owner_status", "sending").lt("owner_claimed_at", new Date(now - staleMs).toISOString()).select("*");
  if (stale.error) throw new Error(`Could not claim the inquiry: ${stale.error.message}`);
  return (stale.data as InquiryRow[])[0] ?? null;
}

export async function markOwnerAccepted(id: string, messageId: string): Promise<void> {
  const { error } = await db().from("program_inquiries").update({ owner_status: "accepted", owner_message_id: messageId, owner_error: null, owner_accepted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`Could not record the notification: ${error.message}`);
}

export async function markOwnerFailed(id: string, attempts: number, detail: string): Promise<void> {
  const { error } = await db().from("program_inquiries").update({ owner_status: "failed", owner_attempts: attempts + 1, owner_error: clip(detail) }).eq("id", id);
  if (error) console.error("INQUIRY: could not record a failed notification:", error.message);
}

/** At-most-once: only a row whose auto-reply is still 'pending' can be claimed, and a claim is never released for another try. */
export async function claimAutoReply(id: string): Promise<boolean> {
  const { data, error } = await db().from("program_inquiries").update({ auto_reply_status: "sending" }).eq("id", id).eq("auto_reply_status", "pending").select("id");
  if (error) throw new Error(`Could not claim the auto-reply: ${error.message}`);
  return (data as unknown[]).length > 0;
}

export async function markAutoReply(id: string, outcome: { ok: true; id: string } | { ok: false; detail: string }): Promise<void> {
  const patch = outcome.ok ? { auto_reply_status: "accepted", auto_reply_message_id: outcome.id, auto_reply_error: null } : { auto_reply_status: "failed", auto_reply_error: clip(outcome.detail) };
  const { error } = await db().from("program_inquiries").update(patch).eq("id", id);
  if (error) console.error("INQUIRY: could not record the auto-reply:", error.message);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Retention and erasure
// ---------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Blanks the message and situation of inquiries older than the retention period. The row, the person, the program, the timestamps and the
 * delivery statuses stay (they are the record that contact happened). Idempotent and bounded per run; `consent_records` is never touched.
 */
export async function purgeExpired(opts: { now?: number; months?: number; dryRun?: boolean; batch?: number } = {}): Promise<{ due: number; purged: number; dryRun: boolean }> {
  const cutoff = retentionCutoff(opts.now, opts.months).toISOString();
  const { data, error } = await db().from("program_inquiries").select("id").lt("created_at", cutoff).is("message_purged_at", null).order("created_at", { ascending: true }).limit(opts.batch ?? 200);
  if (error) throw new Error(`Could not list expired inquiries: ${error.message}`);
  const ids = (data as { id: string }[]).map((r) => r.id);
  if (opts.dryRun || !ids.length) return { due: ids.length, purged: 0, dryRun: !!opts.dryRun };
  const done = await db().from("program_inquiries").update({ message: "", situation: null, message_purged_at: new Date(opts.now ?? Date.now()).toISOString() }).in("id", ids).is("message_purged_at", null).select("id");
  if (done.error) throw new Error(`Could not purge expired inquiries: ${done.error.message}`);
  return { due: ids.length, purged: (done.data as unknown[]).length, dryRun: false };
}

/**
 * Deletes inquiry rows on request: one by id, or every inquiry of an e-mail address (a data-subject request). The lead and its consent history are
 * deliberately left to the existing lead tools, because other records (downloads, applications, consent evidence) may depend on them.
 */
export async function eraseInquiries(target: { id: string } | { email: string }): Promise<{ deleted: number }> {
  let ids: string[];
  if ("id" in target) ids = [target.id];
  else {
    const lead = await db().from("leads").select("id").eq("email", target.email.trim().toLowerCase()).maybeSingle();
    if (lead.error) throw new Error(`Could not look up the lead: ${lead.error.message}`);
    if (!lead.data) return { deleted: 0 };
    const rows = await db().from("program_inquiries").select("id").eq("lead_id", (lead.data as { id: string }).id);
    if (rows.error) throw new Error(`Could not list inquiries: ${rows.error.message}`);
    ids = (rows.data as { id: string }[]).map((r) => r.id);
  }
  if (!ids.length) return { deleted: 0 };
  const del = await db().from("program_inquiries").delete().in("id", ids).select("id");
  if (del.error) throw new Error(`Could not erase: ${del.error.message}`);
  return { deleted: (del.data as unknown[]).length };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Read-only admin list
// ---------------------------------------------------------------------------------------------------------------------------------------------
export type InquiryListItem = InquiryRow & { email: string | null };

export async function listInquiries(limit = 200): Promise<InquiryListItem[]> {
  const { data, error } = await db().from("program_inquiries").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Could not list inquiries: ${error.message}`);
  const rows = data as InquiryRow[];
  const ids = [...new Set(rows.map((r) => r.lead_id))];
  const emails = new Map<string, string>();
  if (ids.length) {
    const leads = await db().from("leads").select("id, email").in("id", ids);
    if (leads.error) throw new Error(`Could not read the people: ${leads.error.message}`);
    for (const l of leads.data as { id: string; email: string }[]) emails.set(l.id, l.email);
  }
  return rows.map((r) => ({ ...r, email: emails.get(r.lead_id) ?? null }));
}
