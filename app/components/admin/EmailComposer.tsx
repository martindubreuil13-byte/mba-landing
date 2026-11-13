"use client";

import { useState } from "react";

export default function EmailComposer({ audienceCount }: { audienceCount: number | null }) {
  const [audience, setAudience] = useState("none");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const field = "w-full rounded-lg border border-[#daccc1] bg-white px-3 py-2";
  return <div className="grid gap-4 md:grid-cols-2">
    <section className="grid gap-4 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5 shadow-sm">
      <h2 className="font-serif text-2xl">Compose</h2>
      <label className="grid gap-1 text-sm">Audience
        <select className={field} value={audience} onChange={(event) => setAudience(event.target.value)}>
          <option value="none">Select an audience</option>
          <option value="subscribers" disabled={audienceCount === null}>Recorded opt-ins · {audienceCount ?? "unavailable"}</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">Subject<input className={field} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
      <label className="grid gap-1 text-sm">Message<textarea rows={8} className={field} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
      <div><button type="button" disabled className="rounded-lg bg-[#eee4db] px-4 py-2 text-[#655951]">Send email</button>
        <p className="mt-2 text-xs text-[#655951]">Sending requires verified recipient consent, suppression reconciliation and sending authorization.</p></div>
    </section>
    <section className="rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5 shadow-sm">
      <h2 className="font-serif text-2xl">Preview</h2>
      <p className="my-3 text-sm text-[#655951]">{audience === "subscribers" ? `Recorded opt-ins · ${audienceCount} contacts` : "No audience selected"}</p>
      <article className="overflow-hidden rounded-xl border border-[#e6dcd4] bg-white">
        <header className="bg-[#6b1f1f] p-4 font-serif text-white">The Modern Business Architect</header>
        <div className="p-5"><h3 className="break-words font-serif text-2xl">{subject || "Subject"}</h3>
          <p className="mt-3 whitespace-pre-wrap break-words">{message || "Your message appears here."}</p></div>
        <footer className="bg-[#f5f1ed] p-4 text-xs text-[#655951]">MBA · Email preferences</footer>
      </article>
    </section>
  </div>;
}
