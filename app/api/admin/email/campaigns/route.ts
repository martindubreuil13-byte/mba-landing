import { trackCampaignLinks } from "@/app/lib/email-studio/track-links";
import { z } from "zod";
import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";
import { isProductionDeployment } from "@/app/lib/deployment";
import { createResend } from "@/app/lib/email-client";
import { DEFAULT_RESOURCE_FROM } from "@/app/lib/resources/delivery-email";
import { BodyTooLargeError, isSameOriginRequest, readJsonBody } from "@/app/lib/publications/request-guards";
import { validateCampaign } from "@/app/lib/email-studio/test-message";
import { renderNewsletterEmail, renderOutreachEmail } from "@/app/lib/email-studio/render";
import { deliverOnce, revalidateRecipient, reviewRecipients, type CampaignRecipient } from "@/app/lib/email-studio/campaign";
import { recipientCandidates } from "@/app/lib/contact-tags/data";
import { createUnsubscribeToken } from "@/app/lib/napkin/unsubscribe";
import { appBaseUrl } from "@/app/lib/resources/base-url";

export const maxDuration = 120;
const confirmation = z.strictObject({ campaignId: z.uuid(), confirmed: z.literal(true), offset: z.number().int().nonnegative().default(0), acknowledgeExceptions: z.literal(true).optional() });

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return fail("Unauthorized.", 401);
  if (!isSameOriginRequest(request.headers)) return fail("Cross-site request refused.", 403);
  const db = getServiceClient();
  try {
    const body = await readJsonBody(request, 128 * 1024);
    const send = confirmation.safeParse(body);
    if (send.success) {
      if (!isProductionDeployment() || !process.env.RESEND_API_KEY) return fail("Campaign sending is unavailable in this environment.", 403);
      // An editor left open across deployment cannot drive the next batches.
      // Refuse before claiming anything rather than silently stopping at 25.
      if (!Object.hasOwn(body as object, "offset")) return fail("Reload Email Studio before sending to enable all recipient batches. Keep a copy of your draft first.", 409);
      const id = send.data.campaignId;
      // Resolve layout from the persisted campaign, never a client-supplied flag.
      const layout = await db.from("email_campaigns").select("kind").eq("id", id).single();
      if (layout.error || !layout.data) throw layout.error ?? new Error("Campaign unavailable");
      const render = layout.data.kind === "outreach" ? renderOutreachEmail : renderNewsletterEmail;
      // Validate signing configuration before claiming the campaign.
      createUnsubscribeToken(id, true);
      const claimed = await db.rpc("claim_email_campaign_batch", {
        campaign_id: id, requested_offset: send.data.offset, admin_id: admin.id,
        acknowledge_exceptions: send.data.acknowledgeExceptions ?? false,
      });
      if (claimed.error) throw claimed.error;
      if (!claimed.data) return fail("This campaign needs acknowledgment, has an active or previously attempted batch, or has expired. Check Campaign history.", 409);
      const campaign = claimed.data as { claimToken: string; subject: string; preview_text: string; body_html: string; body_text: string; recipients: CampaignRecipient[] };
      const recipients = campaign.recipients as CampaignRecipient[];
      const resend = createResend();
      const origin = appBaseUrl();
      for (const recipient of recipients) {
        const key = { campaign_id: id, lead_id: recipient.id, email: recipient.email };
        const token = createUnsubscribeToken(recipient.id, true, id);
        const unsubscribeUrl = `${origin}/unsubscribe?token=${token}`;
        await deliverOnce({
          recheck: async () => revalidateRecipient(recipient, await recipientCandidates([recipient.id])),
          claim: async () => {
            const { error } = await db.from("email_campaign_deliveries").insert({ ...key, status: "attempting" });
            if (error) throw error;
          },
          send: async () => {
            // Also pace the first recipient of a new batch across requests.
            await new Promise((resolve) => setTimeout(resolve, 600));
            const tracked = await trackCampaignLinks(id, campaign.body_html);
            const { data, error } = await resend.emails.send({
              tags: [{ name: "mba_campaign", value: id }],
              from: DEFAULT_RESOURCE_FROM, to: recipient.email, subject: campaign.subject,
              html: render(campaign.subject, tracked, { previewText: campaign.preview_text, unsubscribeUrl }),
              text: campaign.body_text + "\n\nUnsubscribe: " + unsubscribeUrl,
              headers: {
                "List-Unsubscribe": `<${origin}/api/unsubscribe?token=${token}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            }, { idempotencyKey: `mba-campaign/${id}/${recipient.id}` });
            if (data?.id) return { status: "sent", provider_id: data.id };
            const status = error?.statusCode;
            return { status: status && [400, 401, 403, 404, 422, 429].includes(status) ? "failed" : "unknown" };
          },
          finish: async (result) => {
            const { error } = await db.from("email_campaign_deliveries").upsert({
              ...key, ...result, updated_at: new Date().toISOString(),
            }, { onConflict: "campaign_id,email" });
            if (error) throw error;
          },
        });
      }
      const completed = await db.rpc("complete_email_campaign_batch", { campaign_id: id, claim_token: campaign.claimToken });
      if (completed.error) throw completed.error;
      if (!completed.data) return fail("Batch completion could not be confirmed. Check Campaign history before retrying.", 409);
      return Response.json({ ok: true, ...completed.data as { nextOffset: number; done: boolean } });
    }

    const storageOrigin = new URL(db.storage.from("resource-covers").getPublicUrl("newsletter").data.publicUrl).origin;
    const validation = validateCampaign(body, storageOrigin);
    if (!validation.success) return fail(validation.error, 400);
    const message = validation.message;
    const candidates = [];
    for (let offset = 0; offset < message.ids.length; offset += 100) {
      candidates.push(...await recipientCandidates(message.ids.slice(offset, offset + 100)));
    }
    const { recipients, exclusions } = reviewRecipients(message.ids, candidates, message.exceptions, { adminId: admin.id, reviewedAt: new Date().toISOString() });
    const summary = {
      subject: message.subject, previewText: message.previewText, selected: message.ids.length,
      eligible: recipients.length, exceptionCount: recipients.filter(({ exception }) => exception).length, exclusions, html: renderNewsletterEmail(message.subject, message.body, { previewText: message.previewText }),
    };
    if (recipients.length === 0) return Response.json({ ...summary, campaignId: null });
    const { data, error } = await db.from("email_campaigns").insert({
      subject: message.subject, preview_text: message.previewText, body_html: message.body, body_text: message.text,
      selected_count: message.ids.length, exclusions, recipients,
      editor_operations: message.operations, selected_contact_ids: message.ids,
    }).select("id").single();
    if (error || !data) throw error;
    return Response.json({ ...summary, campaignId: data.id });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return fail("The newsletter exceeds the payload limit.", 413);
    return fail("The request could not be completed. Check Campaign history before attempting another send.", 503);
  }
}
