import { NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import {
  cleanPagePath,
  createQuestion,
  isKnownSearchId,
  markQuestionEmailed,
  visitorKey,
} from "@/app/lib/pick-my-brain/queries";
import { SITE_URL } from "@/app/lib/seo";

const NO_INDEX = { "X-Robots-Tag": "noindex, nofollow" };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const RATE_LIMIT_MAX_REQUESTS = 5;

function clean(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: NO_INDEX });
  }

  // Honeypot: pretend success without storing or sending anything.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ success: true }, { headers: NO_INDEX });
  }

  const question = clean(body.question, 1000);
  const name = clean(body.name, 100);
  const email = clean(body.email, 200);

  const fieldErrors: Record<string, string> = {};
  if (question.length < 3) fieldErrors.question = "What's the question?";
  if (!name) fieldErrors.name = "Your name, please.";
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400, headers: NO_INDEX });
  }

  const allowed = await checkRateLimit(
    visitorKey("pmb_ask", getClientIp(req)),
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "You've sent a few already. Give it an hour and try again." },
      { status: 429, headers: NO_INDEX }
    );
  }

  const rawSearchId = clean(body.searchId, 100);
  const searchId = UUID_REGEX.test(rawSearchId) && (await isKnownSearchId(rawSearchId)) ? rawSearchId : null;
  const pagePath = cleanPagePath(body.pagePath);

  let saved;
  try {
    saved = await createQuestion({ question, name, email: email.toLowerCase(), search_id: searchId, page_path: pagePath });
  } catch (error) {
    console.error("Pick My Brain: failed to save question.", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500, headers: NO_INDEX });
  }

  // Best-effort notification — the question is already stored in Admin.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: "Martin <martin@mindrasolutions.com>",
        to: "martin@mindrasolutions.com",
        replyTo: email,
        subject: `Pick My Brain: ${question.slice(0, 80)}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p style="text-transform: uppercase; letter-spacing: 1px; font-size: 12px; color: #6b1f1f;">Pick My Brain — Ask Martin</p>
            <p style="font-size: 18px; white-space: pre-wrap;">${escapeHtml(question)}</p>
            <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
            ${pagePath ? `<p><strong>Asked on:</strong> ${escapeHtml(`${SITE_URL}${pagePath}`)}</p>` : ""}
            <p><a href="${SITE_URL}/admin/pick-my-brain">Open Pick My Brain in Admin</a></p>
          </div>
        `,
      });
      if (error) console.error("Pick My Brain: notification email failed.", error);
      else await markQuestionEmailed(saved.id);
    } catch (error) {
      console.error("Pick My Brain: notification email failed.", error);
    }
  }

  return NextResponse.json({ success: true }, { headers: NO_INDEX });
}
