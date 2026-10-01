// Regression checks for the EXISTING flows that share code with the pilot:
// lead upsert, unsubscribe, downloads, suppression, resubscription. Local only; sink addresses only.
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import { createHmac } from "node:crypto";

const BASE = process.env.BASE ?? "http://localhost:3000";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const results = [];
const check = (n, ok, d = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : "  -> " + d}`);
const eq = (n, a, b) => check(n, JSON.stringify(a) === JSON.stringify(b), `got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
const ipBase = Math.floor(Math.random() * 200) + 20; let ipN = 0;
const ip = () => `10.${ipBase}.${ipN >> 8}.${(++ipN % 250) + 1}`;
const post = async (path, body) => { const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip(), "user-agent": "Mozilla/5.0 Chrome/126" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const lead = async (email) => (await sb.from("leads").select("*").eq("email", email).maybeSingle()).data;
const sink = (l) => `delivered+${l}-${run}@resend.dev`;
const sign = (p) => createHmac("sha256", process.env.SERVICE_ROLE_KEY).update(p).digest("base64url");
const unsub = (id) => { const p = `v1.${id}`; return `${p}.${sign(p)}`; };
const napkinInputs = { businessName: "Test", businessStage: "idea", whatItSells: "Coffee", currency: "USD", transactionSingular: "cup", transactionPlural: "cups", sellingPrice: 4, directCostItems: [{ id: "beans", label: "Beans", amount: 1 }], monthlyCostItems: [{ id: "rent", label: "Rent", amount: 1000 }], tradingDaysPerMonth: 25, openingHoursPerDay: 8, capacityUnits: 1, capacityUnitLabel: "location", expectedMonthlyVolume: 500, maxMonthlyCapacity: 800, seasonality: "not_seasonal", reachability: "yes_clearly", priceConfidence: "supported", directCostConfidence: "supported", monthlyCostConfidence: "supported", volumeEvidence: "Past sales" };
const napkin = async () => (await post("/api/napkin/submit", { inputs: napkinInputs, attribution: {} })).body.submissionId;
const join = (submissionId, email, firstName = "Alex") => post("/api/napkin/join", { submissionId, firstName, email, website: "" });
const legacyForm = (email, optIn, slug = "other-guide") => post("/api/resources/request", { firstName: "Sam", email, country: "", resourceSlug: slug, ongoingContentOptIn: optIn, website: "" });
const mk = async (email, fields) => (await sb.from("leads").insert({ email, first_name: "Existing", ...fields }).select().single()).data;

// ---- Napkin opt-in (existing explicit join: its own consent model is unchanged)
{
  const email = sink("napkin-new");
  const r = await join(await napkin(), email);
  eq("N1 Napkin join succeeds", [r.status, r.body.success], [200, true]);
  const l = await lead(email);
  check("N2 Napkin join opts the lead in exactly as before (flag + timestamp, named)", l.ongoing_content_opt_in === true && !!l.ongoing_content_opt_in_at && l.first_name === "Alex" && l.consent_requested_at === null);
}
{
  const email = sink("napkin-unsub");
  await mk(email, { ongoing_content_opt_in: false, ongoing_content_opt_in_at: "2026-08-01T00:00:00Z", ongoing_content_opt_out_at: "2026-09-01T00:00:00Z" });
  await join(await napkin(), email);
  const l = await lead(email);
  check("N3 Napkin join still re-opts-in an unsubscribed lead (existing behaviour kept), preserving the old opt-out time", l.ongoing_content_opt_in === true && l.ongoing_content_opt_out_at === "2026-09-01T00:00:00+00:00", JSON.stringify(l));
}
{
  const email = sink("napkin-suppressed");
  await mk(email, { ongoing_content_opt_in: false, suppressed_at: "2026-09-02T00:00:00Z", suppression_reason: "spam_complaint" });
  const r = await join(await napkin(), email);
  const l = await lead(email);
  check("N4 Napkin join does NOT re-subscribe a suppressed lead (the intended behaviour change)", l.ongoing_content_opt_in === false && l.suppressed_at !== null, JSON.stringify(l));
  check("N5 ...and the visitor still gets their Napkin result flow (no error)", r.status === 200);
}
{
  const email = sink("napkin-pending");
  await mk(email, { ongoing_content_opt_in: false, consent_requested_at: new Date().toISOString() });
  await join(await napkin(), email);
  const l = await lead(email);
  check("N6 an explicit Napkin join also activates a lead that was pending from a guide (their own explicit action)", l.ongoing_content_opt_in === true);
}
{
  const email = sink("napkin-unsub-flow");
  const sid = await napkin(); await join(sid, email);
  const l = await lead(email);
  const u = await post("/api/napkin/unsubscribe", { token: unsub(l.id) });
  const after = await lead(email);
  check("N7 Napkin unsubscribe works and stamps opt-out", u.body.success && after.ongoing_content_opt_in === false && !!after.ongoing_content_opt_out_at);
  const rec = (await sb.from("consent_records").select("action,method").eq("lead_id", l.id)).data;
  eq("N8 ...and now leaves an auditable opt_out record", rec.map((x) => `${x.action}:${x.method}`), ["opt_out:unsubscribe_link"]);
  eq("N9 repeat Napkin unsubscribe says already unsubscribed", (await post("/api/napkin/unsubscribe", { token: unsub(l.id) })).body.alreadyUnsubscribed, true);
  eq("N10 invalid Napkin token still 400", (await post("/api/napkin/unsubscribe", { token: "nope" })).status, 400);
}

// ---- Existing (unconverted) resource flow
{
  const e1 = sink("legacy-new-optin");
  const r = await legacyForm(e1, true);
  check("R1 legacy resource form still returns a download link", r.status === 200 && /download\?token=/.test(r.body.downloadUrl ?? ""), JSON.stringify(r.body));
  const l = await lead(e1);
  check("R2 legacy checkbox = immediate opt-in, as before (not routed through confirmation)", l.ongoing_content_opt_in === true && l.consent_requested_at === null && l.first_name === "Sam");
  const dl = await fetch(BASE + new URL(r.body.downloadUrl).pathname + new URL(r.body.downloadUrl).search, { redirect: "manual" });
  check("R3 legacy download token still redirects to a signed file URL", dl.status === 307 && /sign/.test(dl.headers.get("location") ?? ""), String(dl.status));
  const req = (await sb.from("resource_requests").select("download_count, delivery_status").eq("lead_id", l.id).single()).data;
  check("R4 legacy download is counted; legacy request rows carry the not_tracked default or accepted", req.download_count === 1, JSON.stringify(req));

  const e2 = sink("legacy-noopt");
  await legacyForm(e2, false);
  const l2 = await lead(e2);
  check("R5 legacy unchecked box records no consent", l2.ongoing_content_opt_in === false && l2.ongoing_content_opt_in_at === null);

  const e3 = sink("legacy-existing-sub");
  await mk(e3, { ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2026-09-01T00:00:00Z" });
  await legacyForm(e3, false);
  const l3 = await lead(e3);
  check("R6 an existing opt-in survives a later unchecked download (existing rule kept)", l3.ongoing_content_opt_in === true && l3.first_name === "Sam");

  const e4 = sink("legacy-suppressed");
  await mk(e4, { ongoing_content_opt_in: false, suppressed_at: "2026-09-02T00:00:00Z" });
  const r4 = await legacyForm(e4, true);
  const l4 = await lead(e4);
  check("R7 legacy checkbox does NOT re-subscribe a suppressed lead, download still given", r4.status === 200 && l4.ongoing_content_opt_in === false);

  const e5 = sink("legacy-resubscribe");
  await mk(e5, { ongoing_content_opt_in: false, ongoing_content_opt_in_at: "2026-08-01T00:00:00Z", ongoing_content_opt_out_at: "2026-09-01T00:00:00Z" });
  await legacyForm(e5, true);
  check("R8 legacy checkbox still re-subscribes an unsubscribed (not suppressed) lead", (await lead(e5)).ongoing_content_opt_in === true);
}

// ---- name handling in shared upsert
{
  const e = sink("name");
  await mk(e, { ongoing_content_opt_in: false });
  const r = await post("/api/resources/request", { firstName: "", email: e, resourceSlug: "other-guide", ongoingContentOptIn: false, website: "" });
  eq("U1 legacy form still requires a first name", r.status, 400);
}

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
