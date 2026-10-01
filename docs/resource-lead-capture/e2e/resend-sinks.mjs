import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import { randomUUID } from "node:crypto";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const out = [];
for (const kind of ["delivered", "bounced", "complained"]) {
  const email = `${kind}+pilot-${run}@resend.dev`;
  const res = await fetch("http://localhost:3000/api/resources/printable-guide", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.77.${Math.floor(Math.random() * 250)}.9`, "user-agent": "Mozilla/5.0 e2e" }, body: JSON.stringify({ email, slug: "build-the-bridge-first", ctaLocation: "top", consentVersion: "resource-guide-consent-v1.1", sessionId: randomUUID(), pagePath: "/resources/build-the-bridge-first", attribution: {}, website: "" }) });
  const body = await res.json();
  const lead = (await sb.from("leads").select("id").eq("email", email).single()).data;
  const rq = (await sb.from("resource_requests").select("delivery_status, delivery_provider_id").eq("lead_id", lead.id).single()).data;
  out.push({ kind, appStatus: rq.delivery_status, id: rq.delivery_provider_id, api: body.emailStatus });
}
await new Promise((r) => setTimeout(r, 6000));
for (const o of out) {
  const r = await fetch(`https://api.resend.com/emails/${o.id}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).then((x) => x.json());
  console.log(`${o.kind.padEnd(10)} our status after API call: ${o.appStatus.padEnd(7)} | Resend says last_event: ${r.last_event} | to: ${JSON.stringify(r.to)} | from: ${r.from}`);
}
