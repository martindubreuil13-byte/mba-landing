import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import { randomUUID } from "node:crypto";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const email = `delivered+failpath-${Date.now().toString(36)}@resend.dev`;
const res = await fetch("http://localhost:3000/api/resources/printable-guide", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.98."+Math.floor(Math.random()*250)+".1", "user-agent": "Mozilla/5.0 e2e" }, body: JSON.stringify({ email, slug: "build-the-bridge-first", ctaLocation: "end", consentVersion: "resource-guide-consent-v1.1", sessionId: randomUUID(), pagePath: "/resources/build-the-bridge-first", attribution: {}, website: "" }) });
const body = await res.json();
const lead = (await sb.from("leads").select("*").eq("email", email).single()).data;
const rq = (await sb.from("resource_requests").select("*").eq("lead_id", lead.id).single()).data;
const evs = (await sb.from("resource_events").select("event_name").eq("request_id", rq.id)).data.map((e) => e.event_name);
const dl = await fetch("http://localhost:3000" + body.downloadUrl, { redirect: "manual" });
const again = await fetch("http://localhost:3000/api/resources/printable-guide", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.98.250.1", "user-agent": "Mozilla/5.0 e2e" }, body: JSON.stringify({ email, slug: "build-the-bridge-first", ctaLocation: "end", consentVersion: "resource-guide-consent-v1.1", sessionId: randomUUID(), pagePath: "/resources/build-the-bridge-first", attribution: {}, website: "" }) }).then((r) => r.json());
const rqs = (await sb.from("resource_requests").select("id, delivery_status").eq("lead_id", lead.id)).data;
const out = [
  ["a repeat request after a FAILED email reports the truth ('failed'), never 'already sent'", again.emailStatus === "failed" && rqs.length === 1 && rqs[0].delivery_status === "failed"],
  ["email failure does NOT block the download response", res.status === 200 && body.success && !!body.downloadUrl],
  ["response tells the page the email failed", body.emailStatus === "failed"],
  ["download still works", dl.status === 307],
  ["delivery_status = failed with a reason", rq.delivery_status === "failed" && /RESEND_API_KEY/.test(rq.delivery_error)],
  ["failed event recorded, queued NOT recorded", evs.includes("resource_delivery_failed") && !evs.includes("resource_delivery_queued")],
  ["lead + consent REQUEST still stored (pending, marketing off)", lead.ongoing_content_opt_in === false && !!lead.consent_requested_at],
];
for (const [n, ok] of out) console.log(`${ok ? "PASS" : "FAIL"}  L ${n}`);
process.exit(out.every(([, ok]) => ok) ? 0 : 1);
