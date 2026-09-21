import { NextResponse } from "next/server";
import { Resend } from "resend";
import { completeAssessmentWithLead, getAssessmentById } from "@/app/lib/assessment/queries";
import { assessmentRowToResultView } from "@/app/lib/assessment/present";
import { SITE_URL } from "@/app/lib/seo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function buildEmailHtml(params: {
  firstName: string;
  ideaName: string | null;
  overallScore: number;
  overallBand: string;
  resultUrl: string;
  strongestSignal: string | null;
  biggestExposure: string | null;
  nextAction: string | null;
}) {
  const { firstName, ideaName, overallScore, overallBand, resultUrl, strongestSignal, biggestExposure, nextAction } = params;
  return `
    <p>Hi ${firstName},</p>
    <p>Here's your Business Idea Reality Check${ideaName ? ` for <strong>${ideaName}</strong>` : ""}.</p>
    <p style="font-size:28px;margin:24px 0 4px;">${overallScore}/100</p>
    <p style="color:#6b1f1f;text-transform:uppercase;letter-spacing:1px;font-size:12px;margin-top:0;">${overallBand}</p>
    <p style="color:#555;font-size:13px;">This measures the maturity of the evidence behind your idea — it is not a prediction of success.</p>
    ${strongestSignal ? `<p><strong>Strongest signal:</strong> ${strongestSignal}</p>` : ""}
    ${biggestExposure ? `<p><strong>Biggest exposure:</strong> ${biggestExposure}</p>` : ""}
    ${nextAction ? `<p><strong>What I'd do next:</strong> ${nextAction}</p>` : ""}
    <p><a href="${resultUrl}">View your full result</a></p>
    <p>If you'd like to talk it through, <a href="${SITE_URL}/lets-talk">reach out here</a>.</p>
    <p>— Martin</p>
  `;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const assessmentId = clean(body.assessmentId, 100);
  const firstName = clean(body.firstName, 100);
  const email = clean(body.email, 200);
  const country = clean(body.country, 100);
  const ongoingContentOptIn = body.ongoingContentOptIn === true;

  const fieldErrors: Record<string, string> = {};
  if (!assessmentId) fieldErrors.assessmentId = "Missing assessment.";
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "Enter a valid email address.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Invalid submission", fieldErrors }, { status: 400 });
  }

  const pending = await getAssessmentById(assessmentId);
  if (!pending) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  let lead, assessment;
  try {
    ({ lead, assessment } = await completeAssessmentWithLead({
      assessmentId,
      first_name: firstName,
      email,
      country: country || null,
      ongoing_content_opt_in: ongoingContentOptIn,
    }));
  } catch (error) {
    console.error("Assessment lead capture failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const result = assessmentRowToResultView(assessment, lead.first_name);
  const resultUrl = `${SITE_URL}/resources/business-idea-reality-check/result/${assessment.id}`;

  // Best-effort confirmation email — never blocks or fails the response.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Martin <martin@mindrasolutions.com>",
        to: email,
        subject: "Your Business Idea Reality Check",
        html: buildEmailHtml({
          firstName,
          ideaName: result.ideaName,
          overallScore: result.overallScore,
          overallBand: result.overallBand,
          resultUrl,
          strongestSignal: result.generatedAssessmentText?.strongestSignal ?? null,
          biggestExposure: result.generatedAssessmentText?.biggestExposure ?? null,
          nextAction: result.generatedAssessmentText?.nextActions?.[0] ?? null,
        }),
      });
    } catch (error) {
      console.error("Assessment confirmation email failed to send:", error);
    }
  }

  return NextResponse.json({ success: true, result, resultUrl });
}
