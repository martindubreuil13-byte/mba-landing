"use client";

import { useState } from "react";
import NewsletterEditor from "./NewsletterEditor";

export default function EmailComposer({ audienceCount }: { audienceCount: number | null }) {
  const [audience, setAudience] = useState("none");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const field = "w-full rounded-lg border border-[#daccc1] bg-white px-3 py-2";
  return <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <section className="grid gap-4 rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5 shadow-sm">
      <h2 className="font-serif text-2xl">Compose</h2>
      <label className="grid gap-1 text-sm">Audience
        <select className={field} value={audience} onChange={(event) => setAudience(event.target.value)}>
          <option value="none">Select an audience</option>
          <option value="subscribers" disabled={audienceCount === null}>Recorded opt-ins · {audienceCount ?? "unavailable"}</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">Subject<input className={field} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
      <NewsletterEditor onChange={setMessage} />
      <div><button type="button" disabled className="rounded-lg bg-[#eee4db] px-4 py-2 text-[#655951]">Send email</button>
        <p className="mt-2 text-xs text-[#655951]">Sending requires verified recipient consent, suppression reconciliation and sending authorization.</p></div>
    </section>
    <section className="rounded-2xl border border-[#e6dcd4] bg-[#fffcf9] p-5 shadow-sm">
      <h2 className="font-serif text-2xl">Preview</h2>
      <p className="my-3 text-sm text-[#655951]">{audience === "subscribers" ? `Recorded opt-ins · ${audienceCount} contacts` : "No audience selected"}</p>
      <article style={{ border: "1px solid #e6dcd4", backgroundColor: "#fff", overflowWrap: "anywhere" }}>
        <header style={{ backgroundColor: "#6b1f1f", padding: 16, color: "#fff", fontFamily: "Georgia, serif" }}>The Modern Business Architect</header>
        <div style={{ padding: 20 }}><h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 24, color: "#27211d" }}>{subject || "Subject"}</h3>
          <div style={{ marginTop: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 16, lineHeight: 1.55, color: "#27211d" }}
            dangerouslySetInnerHTML={{ __html: message || "<p>Your message appears here.</p>" }} /></div>
        <footer style={{ backgroundColor: "#f5f1ed", padding: 16, fontSize: 12, color: "#655951", fontFamily: "Arial, sans-serif" }}>MBA · Email preferences</footer>
      </article>
    </section>
  </div>;
}
