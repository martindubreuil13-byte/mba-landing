import "server-only";
import { introBookingUrl, type Origin } from "@/app/lib/booking";
import { schedulingUrl } from "@/app/lib/programs/email";
import { classifySend, thrownSend, type SendOutcome } from "@/app/lib/service-programs/delivery";
import { inquiryNotification, prospectConfirmation } from "@/app/lib/service-programs/inquiry-emails";
import type { ServiceProgram } from "@/app/lib/service-programs/catalog";
import { emailWithinLimit } from "./abuse";
import { refExchangeEnabled } from "./config";
import {
  claimAutoReply, claimOwnerSend, contentHash, createOrTouchLead, derivedKey, findByKey, insertInquiry, markAutoReply, markOwnerAccepted, markOwnerFailed, reviseUnsent,
  type InquiryRow,
} from "./store";

/**
 * The stored-inquiry path of /api/qualify (PROGRAM_INQUIRY_STORE_ENABLED).
 *
 *   1. The row is committed first. If it cannot be (database unavailable), NOTHING is sent and the visitor is told to try again: no saved row,
 *      no accepted inquiry, no owner notification.
 *   2. The owner notification is claimed with one conditional update, so concurrent or repeated requests cannot both send it, and it carries a
 *      provider idempotency key built from the inquiry and its failure count, so even a crash between "provider accepted" and "recorded" is not
 *      delivered twice on retry.
 *   3. If the owner e-mail is not accepted the request fails exactly as it always has, the row stays (visible in admin as a delivery failure) and
 *      a retry sends again. If it was already accepted, a retry succeeds without sending anything.
 *   4. The visitor's auto-reply is claimed from 'pending' once and never retried; its failure never fails the inquiry.
 */
export type SubmitInput = {
  name: string; email: string; situation: string; message: string;
  program?: ServiceProgram; attribution: Record<string, string>;
  /** Chosen by the browser once per form; absent for old pages and scripts (a key is then derived from the content). */
  clientKey?: string | null;
};
export type SubmitDeps = {
  send: (payload: Record<string, unknown>, options?: { idempotencyKey?: string }) => Promise<unknown>;
  notifyTo: string;
  now?: () => number;
  /** Called once, when this request is the one that got the owner notification accepted. */
  onAccepted?: (info: { program: string | null; messageId: string }) => Promise<void>;
};
export type SubmitResult =
  | { ok: true; autoReply: boolean; bookingRef: string; replay: boolean }
  | { ok: false; status: number; code: string; message: string };

const KEY_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;
const STORAGE_DOWN: SubmitResult = { ok: false, status: 503, code: "storage_unavailable", message: "We couldn't save your message just now, so nothing was sent. Please try again in a moment." };
const FAILURE_MESSAGES: Record<string, string> = {
  email_disabled: "Email delivery is switched off in this environment, so your message was not sent.",
  provider_rejected: "We couldn't send your message just now.",
  provider_error: "We couldn't send your message just now.",
};

async function safeSend(send: () => Promise<unknown>): Promise<SendOutcome> {
  try { return classifySend(await send()); } catch (error) { return thrownSend(error); }
}

export async function submitInquiry(input: SubmitInput, deps: SubmitDeps): Promise<SubmitResult> {
  const now = deps.now ?? Date.now;
  const slug = input.program?.slug ?? null;
  const situation = input.situation === "N/A" ? null : input.situation;
  const hash = contentHash({ email: input.email, message: input.message, program: slug, situation });
  const baseKey = input.clientKey && KEY_SHAPE.test(input.clientKey) ? input.clientKey : derivedKey(hash, now());

  let row: InquiryRow;
  let replay = false;
  try {
    // 1. Find or create the stored row. Any database failure here ends the request before anything is sent.
    let existing = await findByKey(baseKey);
    let key = baseKey;
    if (existing && existing.content_hash !== hash) {
      if (existing.owner_status !== "accepted") {
        const lead = await createOrTouchLead(input.email, input.name);
        if (lead.id === existing.lead_id) {
          const revised = { program_slug: slug, full_name: input.name, situation, message: input.message, attribution: input.attribution, content_hash: hash };
          await reviseUnsent(existing.id, revised);
          existing = { ...existing, ...revised };
        } else { key = `${baseKey}-${hash.slice(0, 8)}`; existing = await findByKey(key); }
      } else { key = `${baseKey}-${hash.slice(0, 8)}`; existing = await findByKey(key); }
    }
    if (existing) { row = existing; replay = true; }
    else {
      if (!(await emailWithinLimit(input.email))) return { ok: false, status: 429, code: "rate_limited", message: "We've already received several messages from this address. Please email martin@mindrasolutions.com directly." };
      const lead = await createOrTouchLead(input.email, input.name);
      row = await insertInquiry({ lead_id: lead.id, program_slug: slug, full_name: input.name, situation, message: input.message, attribution: input.attribution, idempotency_key: key, content_hash: hash });
    }
  } catch (e) {
    console.error("INQUIRY NOT STORED:", e instanceof Error ? e.message : e);
    return STORAGE_DOWN;
  }

  // 2. The owner notification (once).
  if (row.owner_status !== "accepted") {
    let claimed: InquiryRow | null;
    try { claimed = await claimOwnerSend(row.id, now()); }
    catch (e) { console.error("INQUIRY NOT CLAIMED:", e instanceof Error ? e.message : e); return STORAGE_DOWN; }
    if (!claimed) {
      // Another request holds the send. If it has finished by now, this one simply reports success; otherwise ask the visitor to wait.
      let fresh: InquiryRow | null = null;
      try { fresh = await findByKey(row.idempotency_key); } catch { /* treated as still in progress */ }
      if (fresh?.owner_status !== "accepted") return { ok: false, status: 409, code: "in_progress", message: "Your message is already being sent. Please wait a moment before trying again." };
      row = fresh; replay = true;
    } else {
      const owner = inquiryNotification({ name: row.full_name, email: input.email, message: row.message, situation: row.situation ?? "N/A", program: input.program, attribution: row.attribution });
      const outcome = await safeSend(() => deps.send({
        from: "Martin <martin@mindrasolutions.com>", to: deps.notifyTo, subject: owner.subject, html: owner.html, text: owner.text,
        ...(owner.replyTo ? { replyTo: owner.replyTo } : {}),
      }, { idempotencyKey: `inq-owner-${claimed.id}-${claimed.owner_attempts}` }));
      if (!outcome.ok) {
        console.error(`INQUIRY NOT DELIVERED: ${outcome.code}${outcome.status ? ` (${outcome.status})` : ""}: ${outcome.detail}`);
        await markOwnerFailed(claimed.id, claimed.owner_attempts, `${outcome.code}${outcome.status ? ` ${outcome.status}` : ""}: ${outcome.detail}`);
        return { ok: false, status: outcome.code === "email_disabled" ? 503 : 502, code: outcome.code, message: FAILURE_MESSAGES[outcome.code] };
      }
      console.log(`INQUIRY NOTIFICATION ACCEPTED by email provider: id=${outcome.id}`);
      try { await markOwnerAccepted(claimed.id, outcome.id); }
      catch (e) { console.error("INQUIRY: accepted by the provider but not recorded (a retry reuses the same provider key):", e instanceof Error ? e.message : e); }
      row = { ...claimed, owner_status: "accepted", owner_message_id: outcome.id };
      await deps.onAccepted?.({ program: slug, messageId: outcome.id }).catch((e) => console.error("INQUIRY: conversion not recorded:", e instanceof Error ? e.message : e));
    }
  }

  // 3. The visitor's courtesy reply (at most once; never fails the request).
  let autoReply = row.auto_reply_status === "accepted";
  try {
    if (await claimAutoReply(row.id)) {
      const origin: Origin = slug ? `inquiry-${slug}` : "inquiry";
      const booking = schedulingUrl() ? introBookingUrl(refExchangeEnabled() ? row.booking_ref : null, origin) : null;
      const confirmation = prospectConfirmation({ name: row.full_name, program: input.program, booking });
      const reply = await safeSend(() => deps.send({ from: "Martin <martin@mindrasolutions.com>", to: input.email, subject: confirmation.subject, html: confirmation.html, text: confirmation.text }, { idempotencyKey: `inq-reply-${row.id}` }));
      await markAutoReply(row.id, reply.ok ? { ok: true, id: reply.id } : { ok: false, detail: `${reply.code}: ${reply.detail}` });
      autoReply = reply.ok;
      if (reply.ok) console.log(`INQUIRY AUTO-REPLY ACCEPTED by email provider: id=${reply.id}`);
      else console.warn(`INQUIRY AUTO-REPLY NOT SENT: ${reply.code}: ${reply.detail}`);
    }
  } catch (e) { console.error("INQUIRY AUTO-REPLY ERROR:", e instanceof Error ? e.message : e); }

  return { ok: true, autoReply, bookingRef: row.booking_ref, replay };
}
