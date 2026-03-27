import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    console.error("EMAIL ERROR: Missing RESEND_API_KEY");
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500 },
    );
  }

  let body;

  try {
    body = await req.json();
  } catch {
    console.error("EMAIL ERROR: Invalid request body");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name || "N/A";
  const email = body.email || "N/A";
  const situation = body.situation || "N/A";
  const message = body.message || "N/A";

  try {
    console.log("EMAIL TRIGGERED:", { name, email, situation, message });

    const adminEmail = await resend.emails.send({
      from: "Martin <martin@mindrasolutions.com>",
      to: "martin@mindrasolutions.com",
      subject: "New Qualification Submission",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 16px;">New Qualification Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Situation:</strong> ${situation}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });
    console.log("EMAIL SENT TO ADMIN:", adminEmail);

    const autoReply = await resend.emails.send({
      from: "Martin <martin@mindrasolutions.com>",
      to: email,
      subject: "Got your request",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi ${name},</p>
          <p>Thanks for sharing your situation.</p>
          <p><strong>What you submitted:</strong></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Situation:</strong> ${situation}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
          <p>I’ll review it and get back to you within 48 hours.</p>
          <p>If it makes sense, we’ll take the next step together.</p>
          <p>Martin</p>
        </div>
      `,
    });
    console.log("AUTO-REPLY SENT:", autoReply);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Email failed",
      },
      { status: 500 },
    );
  }
}
