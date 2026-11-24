import { z } from "zod";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";
import { BodyTooLargeError, isSameOriginRequest, readJsonBody } from "@/app/lib/publications/request-guards";
import { recipientCandidates } from "@/app/lib/contact-tags/data";
import { DEFAULT_RESOURCE_FROM } from "@/app/lib/resources/delivery-email";
import { reviewRecipients } from "@/app/lib/email-studio/campaign";
import { renderNewsletterEmail } from "@/app/lib/email-studio/render";
import { validateCampaign } from "@/app/lib/email-studio/test-message";
import { MAX_DRAFT_BYTES, decideReview, draftInput, isEmail, normalizeEmail, reviewInput, type ContactSummary } from "@/app/lib/email-outreach/model";
import { attachReview, contactEmail, deleteDraft, deliveryResult, findOrCreateContact, getDraft, recentOutreach, saveDraft } from "@/app/lib/email-outreach/server";

/**
 * Individual outreach: drafts, review and result. Sending is NOT done here: a reviewed individual email is a one-recipient campaign, and the
 * confirmed send goes through the existing /api/admin/email/campaigns route (atomic claim, eligibility re-check at send time, unsubscribe,
 * suppression, Resend idempotency, production-only delivery). This route never calls Resend.
 */
export const maxDuration = 30;

const request = z.discriminatedUnion("op", [
  z.strictObject({ op: z.literal("save"), draft: draftInput }),
  z.strictObject({ op: z.literal("delete"), id: z.uuid() }),
  reviewInput.extend({ op: z.literal("review") }),
  z.strictObject({ op: z.literal("result"), campaignId: z.uuid() }),
]);

/** Content is validated before any contact is created; the real contact id replaces this stand-in afterwards. */
const PLACEHOLDER_ID = "00000000-0000-4000-8000-000000000000";

const ALREADY_SENT = "This draft was already sent. Start a new draft.";
/** `code` lets the interface react to a specific case (for example keep the text as a new draft) without parsing wording. */
const fail = (error: string, status: number, code?: string) => Response.json({ error, ...(code ? { code } : {}) }, { status });

export async function POST(httpRequest: Request) {
  const admin = await getAdminUser();
  if (!admin) return fail("Unauthorized.", 401);
  if (!isSameOriginRequest(httpRequest.headers)) return fail("Cross-site request refused.", 403);
  try {
    const parsed = request.safeParse(await readJsonBody(httpRequest, MAX_DRAFT_BYTES + 16 * 1024));
    if (!parsed.success) return fail("The request could not be understood. Check the recipient, subject and message lengths.", 400);
    const body = parsed.data;

    if (body.op === "save") {
      const saved = await saveDraft(body.draft);
      if (saved.ok) return Response.json({ draft: saved.draft });
      return saved.reason === "already_sent" ? fail(ALREADY_SENT, 409, "already_sent") : fail("This draft no longer exists.", 404, "not_found");
    }

    if (body.op === "delete") return await deleteDraft(body.id) ? Response.json({ ok: true }) : fail("This draft no longer exists.", 404, "not_found");

    if (body.op === "result") return Response.json(await deliveryResult(body.campaignId));

    // Review: always judged from the SAVED draft, so what is reviewed is exactly what was saved.
    const draft = await getDraft(body.draftId);
    if (!draft) return fail("This draft no longer exists.", 404, "not_found");
    if (draft.sentAt) return fail(ALREADY_SENT, 409, "already_sent");
    const email = normalizeEmail(draft.recipientEmail);
    if (!email) return fail("Enter the recipient's email address.", 400);
    if (!isEmail(email)) return fail("Enter a valid email address.", 400);

    const db = getServiceClient();
    const storageOrigin = new URL(db.storage.from("resource-covers").getPublicUrl("newsletter").data.publicUrl).origin;
    const validation = validateCampaign({ subject: draft.subject, previewText: draft.previewText, operations: draft.operations, ids: [PLACEHOLDER_ID], exceptions: [] }, storageOrigin);
    if (!validation.success) return fail(validation.error, 400);
    const message = validation.message;

    // The chosen contact if its address still matches, otherwise the contact for the typed address (created without any subscription).
    const chosen = draft.leadId && normalizeEmail((await contactEmail(draft.leadId)) ?? "") === email ? { id: draft.leadId, created: false } : null;
    const lead = chosen ?? await findOrCreateContact(email, draft.recipientName);

    const candidates = await recipientCandidates([lead.id]);
    const candidate = candidates[0] ?? null;
    const exceptions = body.exception && candidate ? [{ ...body.exception, id: lead.id, email: normalizeEmail(candidate.email) }] : [];
    const { recipients, exclusions } = reviewRecipients([lead.id], candidates, exceptions, { adminId: admin.id, reviewedAt: new Date().toISOString() });
    const recent = await recentOutreach(email);
    const decision = decideReview({
      candidate, recipientCount: recipients.length, exclusionReason: Object.keys(exclusions)[0] ?? null,
      hasException: exceptions.length > 0, recent, acknowledgeRecent: body.acknowledgeRecent === true,
    });

    const contact: ContactSummary = {
      id: lead.id, name: candidate?.name || draft.recipientName.trim(), email,
      state: candidate?.state ?? "Archived", reason: candidate?.reason ?? "Archived or unavailable", created: lead.created,
    };
    const summary = {
      contact, recent, from: DEFAULT_RESOURCE_FROM, subject: message.subject, previewText: message.previewText,
      html: renderNewsletterEmail(message.subject, message.body, { previewText: message.previewText }),
      exceptionCount: recipients.filter(({ exception }) => exception).length,
    };
    if (decision.status !== "ready") return Response.json({ ...summary, ...decision, campaignId: null });

    const { data, error } = await db.from("email_campaigns").insert({
      kind: "outreach", subject: message.subject, preview_text: message.previewText, body_html: message.body, body_text: message.text,
      selected_count: 1, exclusions: {}, recipients, editor_operations: message.operations, selected_contact_ids: [lead.id],
    }).select("id").single();
    if (error || !data) throw error ?? new Error("The review could not be saved.");
    // Atomic: voids an older unsent review of this draft, and refuses if one was already sent (then this new review is voided too).
    if (!await attachReview(draft.id, data.id)) return fail(ALREADY_SENT, 409, "already_sent");
    return Response.json({ ...summary, status: "ready", campaignId: data.id });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return fail("The message exceeds the size limit.", 413);
    return fail("The request could not be completed. Check Campaign history before attempting another send.", 503);
  }
}
