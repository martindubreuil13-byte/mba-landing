import { getAdminUser } from "@/app/lib/supabase/admin-session";
import { getServiceClient } from "@/app/lib/supabase/service";
import { createResend } from "@/app/lib/email-client";
import { evaluateEmailPolicy } from "@/app/lib/email-policy";
import { DEFAULT_RESOURCE_FROM } from "@/app/lib/resources/delivery-email";
import { BodyTooLargeError, isSameOriginRequest, readJsonBody } from "@/app/lib/publications/request-guards";
import { prepareTestMessage } from "@/app/lib/email-studio/test-message";

export async function POST(request: Request) {
  if (!(await getAdminUser())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (!isSameOriginRequest(request.headers)) return Response.json({ error: "Cross-site request refused." }, { status: 403 });
  try {
    const value = await readJsonBody(request, 128 * 1024);
    const db = getServiceClient();
    const storageOrigin = new URL(db.storage.from("resource-covers").getPublicUrl("newsletter").data.publicUrl).origin;
    const message = prepareTestMessage(value, storageOrigin);
    if (!message) return Response.json({ error: "Enter one recipient, a subject, and valid newsletter content." }, { status: 400 });
    if (!evaluateEmailPolicy([message.recipient]).allowed) return Response.json({ error: "Test delivery is disabled in this environment." }, { status: 403 });
    const quota = await db.rpc("reserve_newsletter_test_send");
    if (quota.error || typeof quota.data !== "boolean") return Response.json({ error: "Test sending is temporarily unavailable." }, { status: 503 });
    if (!quota.data) return Response.json({ error: "The limit of five test sends per rolling 24 hours has been reached." }, { status: 429 });
    const { data, error } = await createResend().emails.send({
      from: DEFAULT_RESOURCE_FROM, to: message.recipient, subject: message.subject, html: message.html, text: message.text,
    });
    if (error || !data?.id) return Response.json({ error: "Resend did not confirm acceptance. Check delivery logs before retrying." }, { status: 502 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return Response.json({ error: "The newsletter exceeds the test payload limit." }, { status: 413 });
    return Response.json({ error: "Test delivery could not be confirmed. Check delivery logs before retrying." }, { status: 502 });
  }
}
