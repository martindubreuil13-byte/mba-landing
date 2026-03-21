import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = body.name || "N/A";
  const email = body.email || "N/A";
  const situation = body.situation || "N/A";
  const details = body.details || "N/A";

  try {
    // EMAIL TO YOU
    await resend.emails.send({
      from: "Martin <martin@mindrasolutions.com>",
      to: "martin@mindrasolutions.com",
      subject: "New Qualification Submission",
      html: `
        <h2>New Lead</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Situation:</strong> ${situation}</p>
        <p><strong>Details:</strong> ${details}</p>
      `,
    });

    // AUTO REPLY TO USER
    await resend.emails.send({
      from: "Martin <martin@mindrasolutions.com>",
      to: email,
      subject: "Got your request",
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for sharing your situation.</p>
        <p>I’ll review it and get back to you within 48 hours.</p>
        <p>If it makes sense, we’ll take the next step together.</p>
        <br />
        <p>— Martin</p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}