"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/app/lib/analytics";
import { COMMUNITY_DECLINE_LABEL, COMMUNITY_FOOTNOTE, COMMUNITY_JOIN_LABEL, COMMUNITY_QUESTION } from "@/app/lib/programs/corporate-transition";

/** Mirrors the server's Receipt: no name, email, answers or application id ever reach this screen. */
export type ReceiptView = {
  receiptToken: string;
  bookingUrl: string;
  invitationEmail: "sent" | "not_sent";
  community: "declined" | "joined" | "confirmation_sent" | "confirmation_failed" | "not_applied" | null;
};

type Community = NonNullable<ReceiptView["community"]>;

const COMMUNITY_RESULT: Record<Community, string> = {
  declined: "No problem. Nothing changes, and your conversation is not affected.",
  joined: "You’re in. I’ll send you the occasional email, and you can unsubscribe at any time.",
  confirmation_sent: "One last step: I’ve sent you an email to confirm. You’ll only be added once you press the button inside it.",
  confirmation_failed: "I couldn’t send the confirmation email just now, so you’re not on the list yet. Your conversation is not affected.",
  not_applied: "I wasn’t able to add this address to the list. Your conversation is not affected.",
};

const CHOICE_BUTTON = "border px-6 py-3 text-xs uppercase tracking-[.18em] transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]";

export default function TransitionConfirmation({ receipt }: { receipt: ReceiptView }) {
  const [community, setCommunity] = useState<Community | null>(receipt.community);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Its own request: whatever happens here cannot change the booking above.
  const choose = async (choice: "join" | "decline") => {
    if (busy) return;
    setBusy(true); setProblem("");
    try {
      const r = await fetch("/api/programs/corporate-transition/community", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: receipt.receiptToken, choice }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.community) throw new Error("not saved");
      setCommunity(j.community);
    } catch { setProblem("We couldn’t save that just now."); }
    finally { setBusy(false); }
  };

  const emailSent = receipt.invitationEmail === "sent";
  const settled = community !== null && community !== "confirmation_failed";

  return <main className="min-h-[80vh] bg-[#f5f1ed] px-6 py-20 text-[#1a1816] md:py-28"><div className="mx-auto max-w-2xl">
    <p className="text-xs uppercase tracking-[.25em] text-[#6b1f1f]">Application received</p>
    <h1 className="mt-6 text-5xl font-light md:text-6xl">Good. Let’s talk.</h1>
    <p className="mt-8 text-lg leading-relaxed text-[#1a1816]/70">Thanks for sharing a little about where you are and what you’re trying to build.</p>
    <p className="mt-4 text-lg leading-relaxed text-[#1a1816]/70">The next step is simple. Let’s have a conversation.</p>
    <p className="mt-4 text-lg leading-relaxed text-[#1a1816]/70">{emailSent ? "I’ve sent you an email with a link to book our conversation. You can also book directly below." : "I wasn’t able to confirm the booking email just now, but you don’t need it. You can book directly below."}</p>

    <a href={receipt.bookingUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("transition_calendly_clicked")} className="mt-10 inline-block bg-[#6b1f1f] px-8 py-4 text-xs uppercase tracking-[.2em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1f1f]">Book your conversation</a>
    <p className="mt-5 max-w-xl text-sm italic leading-relaxed text-[#1a1816]/55">
      {emailSent
        ? "Can’t find a suitable time? Time-zone differences sometimes make availability tricky. Just reply to my email and we’ll find another option."
        : <>Can’t find a suitable time? Time-zone differences sometimes make availability tricky. <Link href="/lets-talk" className="underline underline-offset-2">Get in touch</Link> and we’ll find another option.</>}
    </p>

    <section aria-labelledby="community-heading" className="mt-16 border-t border-[#1a1816]/10 pt-12">
      <h2 id="community-heading" className="text-3xl font-light md:text-4xl">One more thing before you go.</h2>
      <p className="mt-6 text-lg leading-relaxed text-[#1a1816]/70">I’m building a community of people who want to create something of their own.</p>
      <p className="mt-4 text-lg leading-relaxed text-[#1a1816]/70">{COMMUNITY_QUESTION}</p>

      {!settled && <div role="group" aria-labelledby="community-heading" className="mt-8 flex flex-wrap gap-4">
        <button type="button" disabled={busy} onClick={() => choose("decline")} className={`${CHOICE_BUTTON} border-[#1a1816]/30 text-[#1a1816] hover:border-[#1a1816]`}>{COMMUNITY_DECLINE_LABEL}</button>
        <button type="button" disabled={busy} onClick={() => choose("join")} className={`${CHOICE_BUTTON} border-[#6b1f1f] text-[#6b1f1f] hover:bg-[#6b1f1f] hover:text-white`}>{COMMUNITY_JOIN_LABEL}</button>
      </div>}

      <div aria-live="polite">
        {community && <p role="status" className="mt-8 border-l-2 border-[#6b1f1f] pl-4 text-base leading-relaxed text-[#1a1816]/75">{COMMUNITY_RESULT[community]}</p>}
        {problem && <p role="alert" className="mt-6 text-sm text-[#8b2525]">{problem} Your conversation is not affected. You can try again.</p>}
      </div>

      <p className="mt-6 text-sm italic leading-relaxed text-[#1a1816]/55">{COMMUNITY_FOOTNOTE}</p>
    </section>
  </div></main>;
}
