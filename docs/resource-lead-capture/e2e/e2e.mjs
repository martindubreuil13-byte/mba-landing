// End-to-end checks for the printable-guide pilot. Runs against LOCAL Next + LOCAL Supabase only.
// Emails go to Resend's official sink addresses (resend.dev) only.
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SLUG = "build-the-bridge-first";
const CONSENT = "resource-guide-consent-v1.1";
const PDF = "/Users/martin/Documents/The Modern Business Architect (MBA)/Lead Magnets/Build-the-Bridge-First-FINAL-corrected.pdf";
const run = Date.now().toString(36);
let pass = 0, fail = 0;
const results = [];

function check(name, ok, detail = "") {
  (ok ? pass++ : fail++);
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
}
const eq = (name, a, b) => check(name, JSON.stringify(a) === JSON.stringify(b), `got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
const ipBase = Math.floor(Math.random() * 200) + 20;
let ipN = 0;
const freshIp = () => `10.${ipBase}.${(ipN >> 8) & 255}.${(++ipN % 250) + 1}`;
const sid = () => randomUUID();

async function post(path, body, { ip = freshIp(), ua = "Mozilla/5.0 (Macintosh) Chrome/120 e2e", raw = false, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": raw ? "application/x-www-form-urlencoded" : "application/json", "x-forwarded-for": ip, "user-agent": ua, ...headers },
    body: raw ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
const request = (email, extra = {}, opts) =>
  post("/api/resources/printable-guide", { email, slug: SLUG, ctaLocation: "top", consentVersion: CONSENT, sessionId: sid(), pagePath: `/resources/${SLUG}`, attribution: { source: "e2e", medium: "test", campaign: null, referrer: null, utm: {} }, website: "", ...extra }, opts);
const evt = (event, sessionId, extra = {}, opts) => post("/api/resources/events", { event, slug: SLUG, sessionId, pagePath: `/resources/${SLUG}`, ...extra }, opts);

const leadByEmail = async (email) => (await sb.from("leads").select("*").eq("email", email).maybeSingle()).data;
const consents = async (leadId) => (await sb.from("consent_records").select("*").eq("lead_id", leadId).order("created_at")).data;
const requests = async (leadId) => (await sb.from("resource_requests").select("*").eq("lead_id", leadId).order("requested_at")).data;
const events = async (filter) => (await sb.from("resource_events").select("*").match(filter).order("created_at")).data;
const resource = (await sb.from("resources").select("*").eq("slug", SLUG).single()).data;
const sink = (label) => `delivered+${label}-${run}@resend.dev`;
const legacyLead = async (email, fields) => {
  const { data } = await sb.from("leads").insert({ email, first_name: "Legacy", lead_status: "new", ...fields }).select().single();
  if (fields.ongoing_content_opt_in_at) await sb.from("consent_records").insert({ lead_id: data.id, action: "opt_in", wording_version: "legacy", method: "legacy", created_at: fields.ongoing_content_opt_in_at });
  if (fields.ongoing_content_opt_out_at) await sb.from("consent_records").insert({ lead_id: data.id, action: "opt_out", wording_version: "legacy", method: "legacy", created_at: fields.ongoing_content_opt_out_at });
  return data;
};

// ---------------------------------------------------------------- A. anonymous reader
{
  const page = await fetch(`${BASE}/resources/${SLUG}`);
  const html = await page.text();
  check("A1 public page returns 200 without login", page.status === 200);
  for (let n = 1; n <= 9; n++) check(`A2 guide section page-${n} is in the server-rendered HTML`, html.includes(`id="page-${n}"`));
  for (const phrase of ["Clarify what you want entrepreneurship to", "Separate your", "Choose what to test", "That is a beginning, not yet a business.", "Continue the conversation"]) {
    check(`A3 HTML contains "${phrase}"`, html.includes(phrase));
  }
  check("A4 no password/login/account language on the page", !/password|log in|sign in|create an account/i.test(html.replace(/<script[\s\S]*?<\/script>/g, "")));
  check("A5 canonical + title present", html.includes(`rel="canonical" href="https://modernbusinessarchitect.com/resources/${SLUG}"`) && /<title>Build The Bridge First \| The Modern Business Architect<\/title>/.test(html));
  check("A6 robots allows indexing", !/noindex/.test(html));
  check("A7 JSON-LD has hasPart sections and isAccessibleForFree", html.includes('"hasPart"') && html.includes('"isAccessibleForFree":true'));
  check("A8 cover image has descriptive alt", html.includes('alt="Cover of Build The Bridge First"'));
  check("A9 three CTA locations rendered", ["top", "mid-guide", "end"].every((l) => html.includes(`data-cta-location="${l}"`)));
  check("A10 /lets-talk internal link present", html.includes('href="/lets-talk"'));

  const s = sid();
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari";
  eq("A11 page_view counted", (await evt("resource_page_view", s, { referrer: "https://www.google.com/search?q=secret", attribution: { source: "google", medium: "organic" }, pagePath: `/resources/${SLUG}?email=leak@x.com#frag` }, { ua })).body.counted, true);
  eq("A12 refresh in same session not double counted", (await evt("resource_page_view", s, {}, { ua })).body.counted, false);
  eq("A13 read_started counted once", [(await evt("resource_read_started", s, {}, { ua })).body.counted, (await evt("resource_read_started", s, {}, { ua })).body.counted], [true, false]);
  eq("A14 read_completed counted", (await evt("resource_read_completed", s, {}, { ua })).body.counted, true);
  eq("A15 cta click top", (await evt("resource_cta_clicked", s, { ctaLocation: "top" }, { ua })).body.counted, true);
  eq("A16 form opened mid-guide", (await evt("resource_form_opened", s, { ctaLocation: "mid-guide" }, { ua })).body.counted, true);
  const rows = await events({ session_id: s });
  const pv = rows.find((r) => r.event_name === "resource_page_view");
  eq("A17 page_url stored path-only (no query / email)", pv.page_url, `/resources/${SLUG}`);
  eq("A18 referrer stored as hostname only", pv.referrer, "google.com");
  eq("A19 device type derived server-side", pv.device_type, "mobile");
  check("A20 anonymous events carry no lead", rows.every((r) => r.lead_id === null));
  check("A21 events table has no email/ip columns", !Object.keys(pv).some((k) => /email|ip_|name$/.test(k) && k !== "event_name"));
  eq("A22 client cannot forge server-only events", (await evt("resource_form_submitted", s)).status, 400);
  eq("A23 bad session id rejected", (await evt("resource_page_view", "short")).status, 400);
  eq("A24 bad CTA location rejected", (await evt("resource_cta_clicked", s, { ctaLocation: "popup" })).status, 400);
  eq("A25 unknown resource rejected", (await post("/api/resources/events", { event: "resource_page_view", slug: "nope", sessionId: sid() })).status, 404);
  eq("A26 bots acknowledged but not counted", (await evt("resource_page_view", sid(), {}, { ua: "Googlebot/2.1" })).body.counted, false);
  const before = (await events({ resource_id: resource.id })).length;
  await evt("resource_page_view", sid(), {}, { ua: "Googlebot/2.1" });
  eq("A27 bot hit stored nothing", (await events({ resource_id: resource.id })).length, before);
}

// helpers for confirmed opt-in
const secretKey = process.env.SERVICE_ROLE_KEY; // dev server falls back to the service key for signing
const sig = (p) => createHmac("sha256", secretKey).update(p).digest("base64url");
const unsubToken = (leadId) => { const p = `v1.${leadId}`; return `${p}.${sig(p)}`; };
const confirmToken = (leadId, expires = Math.floor(Date.now() / 1000) + 30 * 86400) => { const p = `c1.${leadId}.${expires}`; return `${p}.${sig(p)}`; };
const confirmLead = (token) => post("/api/confirm", { token });
const emailHtml = async (providerId) => (await fetch(`${process.env.RESEND_API_BASE ?? "https://api.resend.com"}/emails/${providerId}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).then((r) => r.json())).html;

// ---------------------------------------------------------------- B. new subscriber (confirmed opt-in)
{
  const email = sink("new");
  const session = sid();
  await evt("resource_page_view", session);
  await evt("resource_cta_clicked", session, { ctaLocation: "mid-guide" });
  await evt("resource_form_opened", session, { ctaLocation: "mid-guide" });
  const r = await request(email, { sessionId: session, ctaLocation: "mid-guide" });
  eq("B1 request succeeds", r.status, 200);
  check("B2 download + backup URLs returned immediately", r.body.downloadUrl?.includes("via=form") && r.body.backupUrl?.includes("via=backup"));
  eq("B3 email queued with provider", r.body.emailStatus, "queued");
  eq("B4 consent outcome is pending_confirmation (not 'opted in')", r.body.consent, "pending_confirmation");

  let lead = await leadByEmail(email);
  check("B5 lead created, email normalized, status new", lead && lead.email === email.toLowerCase() && lead.lead_status === "new");
  check("B6 marketing is OFF until confirmed; request stamped", lead.ongoing_content_opt_in === false && lead.ongoing_content_opt_in_at === null && !!lead.consent_requested_at);
  check("B7 last_activity_at set", !!lead.last_activity_at);
  let c = await consents(lead.id);
  eq("B8 exactly one consent record, action opt_in_requested", c.map((x) => x.action), ["opt_in_requested"]);
  check("B9 request evidence: version, method, source, CTA, url", c[0].wording_version === CONSENT && c[0].method === "button_disclosure" && c[0].source_type === "guide" && c[0].source_resource_id === resource.id && c[0].cta_location === "mid-guide" && c[0].source_url === `/resources/${SLUG}`);
  check("B10 exact wording stored (server-side from version table, incl. confirm wording)", c[0].wording_text.includes("EMAIL ME THE PRINTABLE GUIDE") && c[0].wording_text.includes("invite you to confirm whether you’d like to join") && c[0].wording_text.includes("Marketing emails begin only if you actively confirm"));
  check("B11 IP/UA stored only as hashes", /^[0-9a-f]{32}$/.test(c[0].ip_hash) && /^[0-9a-f]{32}$/.test(c[0].user_agent_hash) && !/\b10\.\d+\.\d+\.\d+\b/.test(JSON.stringify(c[0])) && !JSON.stringify(c[0]).includes("Mozilla"));
  const reqs = await requests(lead.id);
  eq("B12 one request row", reqs.length, 1);
  check("B13 request carries attribution + CTA + page", reqs[0].cta_location === "mid-guide" && reqs[0].source_page_url === `/resources/${SLUG}` && reqs[0].source === "e2e" && reqs[0].resource_action === "download");
  eq("B14 delivery_status is queued (not delivered)", reqs[0].delivery_status, "queued");
  check("B15 provider id stored", !!reqs[0].delivery_provider_id);
  const evs = await events({ request_id: reqs[0].id });
  check("B16 submitted + queued events recorded", evs.some((e) => e.event_name === "resource_form_submitted") && evs.some((e) => e.event_name === "resource_delivery_queued"));
  check("B17 submitted event carries lead, wording version, pending outcome", (() => { const e = evs.find((x) => x.event_name === "resource_form_submitted"); return e.lead_id === lead.id && e.metadata.wording_version === CONSENT && e.metadata.consent === "pending_confirmation"; })());
  const linked = await events({ session_id: session });
  check("B18 earlier anonymous events of the session now linked to the lead", linked.length >= 4 && linked.every((e) => e.lead_id === lead.id));

  const dl = await fetch(BASE + r.body.downloadUrl, { redirect: "manual" });
  eq("B19 download works BEFORE any confirmation", dl.status, 307);
  const loc = dl.headers.get("location");
  check("B20 redirect is a signed storage URL forcing attachment", /\/object\/sign\//.test(loc) && /download=/.test(loc));
  const file = await fetch(loc);
  const bytes = Buffer.from(await file.arrayBuffer());
  const src = fs.readFileSync(PDF);
  check("B21 downloaded bytes equal the corrected final PDF", file.headers.get("content-type") === "application/pdf" && bytes.equals(src));
  check("B22 content-disposition is attachment", /attachment/.test(file.headers.get("content-disposition") ?? ""));
  const after = (await requests(lead.id))[0];
  check("B23 download counted on the request", after.download_count === 1 && !!after.first_download_at);
  check("B24 download_started event with via=form", (await events({ request_id: reqs[0].id, event_name: "resource_download_started" })).some((e) => e.metadata.via === "form"));
  await fetch(BASE + r.body.downloadUrl, { redirect: "manual" });
  eq("B25 rapid repeat download not double counted", (await requests(lead.id))[0].download_count, 1);
  const bad = await fetch(`${BASE}/api/resources/download?token=${randomUUID()}`, { redirect: "manual" });
  check("B26 unknown download token goes nowhere sensitive", bad.status === 307 && /\/resources$/.test(bad.headers.get("location")));

  // --- the real email: contains the guide link AND a confirm link
  const html = await emailHtml(reqs[0].delivery_provider_id);
  check("B27 email has download link, confirm button, unsubscribe", html.includes("Download the guide") && html.includes("Yes, keep me in the community") && html.includes("Unsubscribe"));
  check("B28 email does not call the reader subscribed", !html.includes("on the list for occasional practical notes") && html.includes("Confirming is optional") && html.includes("whether or not you confirm"));
  const confirmUrl = html.match(/href="([^"]*\/confirm\?token=[^"]+)"/)?.[1];
  check("B29 confirm link present in the sent email", !!confirmUrl);
  const tok = decodeURIComponent(new URL(confirmUrl.replace(/&amp;/g, "&")).searchParams.get("token"));

  // --- confirmation
  const page = await fetch(`${BASE}/confirm?token=${encodeURIComponent(tok)}`);
  const pageHtml = await page.text();
  check("B30 /confirm page shows a button (GET alone never confirms)", page.status === 200 && pageHtml.includes("Join the Modern Business Architect community"));
  lead = await leadByEmail(email);
  eq("B31 opening the link does not activate marketing", lead.ongoing_content_opt_in, false);
  eq("B32 expired link rejected", (await confirmLead(confirmToken(lead.id, Math.floor(Date.now() / 1000) - 10))).status, 400);
  eq("B33 tampered token rejected", (await confirmLead(tok.slice(0, -3) + "AAA")).status, 400);
  eq("B34 an unsubscribe token cannot confirm", (await confirmLead(unsubToken(lead.id))).status, 400);
  const ok = await confirmLead(tok);
  check("B35 confirmation succeeds", ok.status === 200 && ok.body.status === "confirmed");
  lead = await leadByEmail(email);
  check("B36 marketing now active with a new timestamp", lead.ongoing_content_opt_in === true && !!lead.ongoing_content_opt_in_at);
  c = await consents(lead.id);
  eq("B37 history: requested then confirmed (append-only)", c.map((x) => `${x.action}:${x.method}`), ["opt_in_requested:button_disclosure", "opt_in:email_confirmation"]);
  check("B38 confirmation row references the request and keeps its wording + source", c[1].related_record_id === c[0].id && c[1].wording_version === CONSENT && c[1].wording_text === c[0].wording_text && c[1].cta_location === "mid-guide" && c[1].source_resource_id === resource.id && /^[0-9a-f]{32}$/.test(c[1].ip_hash));
  check("B39 confirmed event recorded", (await events({ lead_id: lead.id, event_name: "resource_opt_in_confirmed" })).length === 1);
  const again = await confirmLead(tok);
  check("B40 confirming twice is idempotent (no extra record)", again.status === 200 && again.body.status === "already_confirmed" && (await consents(lead.id)).length === 2);
}

// ---------------------------------------------------------------- C. existing active subscriber
{
  const email = sink("active");
  await legacyLead(email, { ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2026-09-21T10:00:00Z" });
  const r = await request(email, { ctaLocation: "end" });
  eq("C1 succeeds", r.status, 200);
  eq("C2 consent outcome is existing", r.body.consent, "existing");
  eq("C3 no duplicate lead", (await sb.from("leads").select("id").eq("email", email)).data.length, 1);
  const lead = await leadByEmail(email);
  eq("C4 original consent date preserved", new Date(lead.ongoing_content_opt_in_at).toISOString(), "2026-09-21T10:00:00.000Z");
  const c = await consents(lead.id);
  check("C5 no new consent record manufactured", c.length === 1 && c[0].wording_version === "legacy");
  eq("C6 request + interest recorded", (await requests(lead.id)).length, 1);
  check("C7 engaged (repeat touch)", lead.lead_status === "engaged");
  check("C8 submitted event says existing", (await events({ lead_id: lead.id, event_name: "resource_form_submitted" }))[0].metadata.consent === "existing");
  eq("C9 delivery queued", (await requests(lead.id))[0].delivery_status, "queued");
  const html = await emailHtml((await requests(lead.id))[0].delivery_provider_id);
  check("C10 subscriber email has no confirm button", !html.includes("Yes, keep me in the community") && html.includes("on the list for occasional practical notes"));
}

// ---------------------------------------------------------------- D. previously unsubscribed
{
  const email = sink("unsub");
  const original = await legacyLead(email, { ongoing_content_opt_in: false, ongoing_content_opt_in_at: "2026-08-01T10:00:00Z", ongoing_content_opt_out_at: "2026-09-01T10:00:00Z" });
  await evt("resource_page_view", sid());
  await fetch(`${BASE}/resources/${SLUG}`);
  const viewed = await leadByEmail(email);
  check("D1 viewing the page changes nothing for the lead", viewed.ongoing_content_opt_in === false && viewed.updated_at === original.updated_at);
  const r = await request(email, { ctaLocation: "top" });
  eq("D2 explicit request recorded as pending_confirmation", r.body.consent, "pending_confirmation");
  let lead = await leadByEmail(email);
  check("D3 NOT reactivated until confirmed", lead.ongoing_content_opt_in === false && !!lead.consent_requested_at);
  eq("D4 historical timestamps untouched", [new Date(lead.ongoing_content_opt_in_at).toISOString(), new Date(lead.ongoing_content_opt_out_at).toISOString()], ["2026-08-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"]);
  eq("D5 history kept + request appended", (await consents(lead.id)).map((x) => `${x.action}:${x.wording_version}`), ["opt_in:legacy", "opt_out:legacy", `opt_in_requested:${CONSENT}`]);
  await confirmLead(confirmToken(lead.id));
  lead = await leadByEmail(email);
  check("D6 reactivated only after confirming; unsubscribe history preserved", lead.ongoing_content_opt_in === true && new Date(lead.ongoing_content_opt_in_at) > new Date("2026-10-01") && new Date(lead.ongoing_content_opt_out_at).toISOString() === "2026-09-01T10:00:00.000Z");
  eq("D7 four-row history", (await consents(lead.id)).map((x) => x.action), ["opt_in", "opt_out", "opt_in_requested", "opt_in"]);
}

// ---------------------------------------------------------------- E. suppressed
{
  const email = sink("suppressed");
  await legacyLead(email, { ongoing_content_opt_in: false, ongoing_content_opt_out_at: "2026-09-01T10:00:00Z", suppressed_at: "2026-09-02T10:00:00Z", suppression_reason: "spam_complaint" });
  const r = await request(email);
  eq("E1 request still delivers the guide", [r.status, r.body.success], [200, true]);
  eq("E2 consent not applied", r.body.consent, "not_applied");
  const lead = await leadByEmail(email);
  check("E3 NOT re-subscribed, not even pending", lead.ongoing_content_opt_in === false && lead.suppressed_at !== null && lead.consent_requested_at === null);
  eq("E4 no consent record created", (await consents(lead.id)).length, 1);
  check("E5 submission event says not_applied", (await events({ lead_id: lead.id, event_name: "resource_form_submitted" }))[0].metadata.consent === "not_applied");
  eq("E6 a (forged) confirm link cannot activate a suppressed lead", (await confirmLead(confirmToken(lead.id))).status, 400);
  eq("E7 still not subscribed", (await leadByEmail(email)).ongoing_content_opt_in, false);
  const html = await emailHtml((await requests(lead.id))[0].delivery_provider_id);
  check("E8 email is a one-off with no confirm offer", html.includes("No further marketing emails will be sent") && !html.includes("Yes, keep me in the community"));
}

// ---------------------------------------------------------------- F. non-subscriber lead
{
  const email = sink("lead-only");
  await legacyLead(email, { ongoing_content_opt_in: false });
  const r = await request(email);
  eq("F1 existing lead without consent: request recorded separately", r.body.consent, "pending_confirmation");
  const lead = await leadByEmail(email);
  eq("F2 one consent request record", (await consents(lead.id)).map((x) => x.action), ["opt_in_requested"]);
  eq("F3 still one lead", (await sb.from("leads").select("id").eq("email", email)).data.length, 1);
  eq("F4 not in the marketing set", lead.ongoing_content_opt_in, false);
}

// ---------------------------------------------------------------- G. invalid / abusive
{
  const bad = [["", /where to send/], ["nope", /missing an “@”/], ["a@b", /does not look right/], ["a@@b.com", /does not look right/]];
  for (const [e, re] of bad) {
    const r = await request(e);
    check(`G1 invalid email ${JSON.stringify(e)} -> 400 with helpful message`, r.status === 400 && re.test(r.body.error) && re.test(r.body.fieldErrors?.email), JSON.stringify(r));
  }
  eq("G2 wrong consent version -> 409", (await request(sink("v"), { consentVersion: "old-v0" })).status, 409);
  eq("G2b the superseded v1.0 wording is rejected too", (await request(sink("v0"), { consentVersion: "resource-guide-consent-v1.0" })).status, 409);
  eq("G3 invalid CTA -> 400", (await request(sink("c"), { ctaLocation: "popup" })).status, 400);
  eq("G4 unknown resource -> 404", (await request(sink("u"), { slug: "does-not-exist" })).status, 404);
  const honey = sink("honeypot");
  const h = await request(honey, { website: "http://spam" });
  check("G5 honeypot pretends success but stores nothing", h.status === 200 && (await leadByEmail(honey)) === null);
  eq("G6 not json -> 400", (await fetch(BASE + "/api/resources/printable-guide", { method: "POST", body: "x" })).status, 400);

  const dup = sink("dup");
  const ip = freshIp();
  await Promise.all([request(dup, {}, { ip }), request(dup, {}, { ip })]);
  const lead = await leadByEmail(dup);
  eq("G7 double submit: one lead", (await sb.from("leads").select("id").eq("email", dup)).data.length, 1);
  eq("G8 double submit: ONE consent request record", (await consents(lead.id)).length, 1);
  const reqs = await requests(lead.id);
  check("G9 double submit: at most 2 request rows even when truly concurrent", reqs.length <= 2, String(reqs.length));
  const c = await request(dup, {}, { ip });
  eq("G10 a later repeat re-uses the request (no new row, no 2nd email)", [c.body.emailStatus, (await requests(lead.id)).length], ["already_sent", reqs.length]);
  eq("G10b and still only one consent request record", (await consents(lead.id)).length, 1);
  eq("G11 re-used request is not counted as a new submission", (await events({ lead_id: lead.id, event_name: "resource_form_submitted" })).length, reqs.length);

  const limitIp = freshIp();
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await request(sink(`rl${i}`), {}, { ip: limitIp })).status);
  eq("G12 per-IP rate limit: first 10 ok, then 429", [codes.slice(0, 10).every((c) => c === 200), codes.slice(10)], [true, [429, 429]]);
  const emailLimit = sink("emaillimit");
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await request(emailLimit, {}, { ip: freshIp() })).status);
  eq("G13 per-address limit: 3 ok then 429", statuses, [200, 200, 200, 429, 429]);
  const msg = (await request(emailLimit, {}, { ip: freshIp() })).body.error;
  check("G14 rate-limit message is helpful", /Check your inbox|try again/.test(msg), msg);
  const confirmIp = freshIp();
  const cs = [];
  for (let i = 0; i < 32; i++) cs.push((await post("/api/confirm", { token: "c1.x.1.y" }, { ip: confirmIp })).status);
  check("G15 confirm endpoint is rate limited", cs.includes(429));
}

// ---------------------------------------------------------------- H. unsubscribe
{
  const email = sink("tounsub");
  const r = await request(email);
  let lead = await leadByEmail(email);
  await confirmLead(confirmToken(lead.id));
  lead = await leadByEmail(email);
  const t = unsubToken(lead.id);
  const page = await fetch(`${BASE}/unsubscribe?token=${encodeURIComponent(t)}`);
  const html = await page.text();
  check("H1 neutral /unsubscribe page renders for a valid token", page.status === 200 && /Unsubscribe from The Modern Business Architect/.test(html) && /stays yours/.test(html));
  eq("H2 GET never changes consent", (await leadByEmail(email)).ongoing_content_opt_in, true);
  eq("H3 invalid token rejected", (await post("/api/unsubscribe", { token: "v1.x.y" })).status, 400);
  const u1 = await post("/api/unsubscribe", { token: t });
  check("H4 unsubscribe works", u1.status === 200 && u1.body.success && u1.body.alreadyUnsubscribed === false);
  const l2 = await leadByEmail(email);
  check("H5 opted out, timestamp set, original opt-in timestamp preserved", l2.ongoing_content_opt_in === false && !!l2.ongoing_content_opt_out_at && l2.ongoing_content_opt_in_at === lead.ongoing_content_opt_in_at);
  eq("H6 history preserved + opt_out appended", (await consents(lead.id)).map((c) => `${c.action}:${c.method}`), ["opt_in_requested:button_disclosure", "opt_in:email_confirmation", "opt_out:unsubscribe_link"]);
  const u2 = await post("/api/unsubscribe", { token: t });
  check("H7 repeat unsubscribe is idempotent (no extra record)", u2.body.alreadyUnsubscribed === true && (await consents(lead.id)).length === 3);
  eq("H8 guide download still works after unsubscribing", (await fetch(BASE + r.body.backupUrl, { redirect: "manual" })).status, 307);
  const re = await request(email);
  eq("H9 resubscribing needs a NEW affirmative action and is pending again", [re.body.consent, (await leadByEmail(email)).ongoing_content_opt_in], ["pending_confirmation", false]);
  await confirmLead(confirmToken(lead.id));
  eq("H10 active again only after confirmation; history appended", [(await leadByEmail(email)).ongoing_content_opt_in, (await consents(lead.id)).map((c) => c.action)], [true, ["opt_in_requested", "opt_in", "opt_out", "opt_in_requested", "opt_in"]]);

  const oneClick = await fetch(`${BASE}/api/unsubscribe?token=${encodeURIComponent(t)}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" });
  check("H11 RFC 8058 one-click POST works", oneClick.status === 200 && (await leadByEmail(email)).ongoing_content_opt_in === false);

  // legacy Napkin URL keeps working and writes the same evidence
  const e2 = sink("napkin-legacy");
  await request(e2);
  const l3 = await leadByEmail(e2);
  await confirmLead(confirmToken(l3.id));
  const legacy = await post("/api/napkin/unsubscribe", { token: unsubToken(l3.id) });
  check("H12 legacy /api/napkin/unsubscribe still works", legacy.status === 200 && legacy.body.success);
  eq("H13 legacy /unsubscribe/napkin page still renders", (await fetch(`${BASE}/unsubscribe/napkin?token=${encodeURIComponent(unsubToken(l3.id))}`)).status, 200);
  eq("H14 legacy path writes the same opt-out evidence", (await consents(l3.id)).map((c) => c.action), ["opt_in_requested", "opt_in", "opt_out"]);

  // unsubscribing while still PENDING cancels the request
  const e3 = sink("cancel-pending");
  await request(e3);
  const l4 = await leadByEmail(e3);
  const old = confirmToken(l4.id);
  const cancel = await post("/api/unsubscribe", { token: unsubToken(l4.id) });
  check("H15 unsubscribe while pending cancels the request", cancel.status === 200 && cancel.body.alreadyUnsubscribed === false);
  const l4b = await leadByEmail(e3);
  check("H16 pending cleared, opt-out recorded", l4b.consent_requested_at === null && !!l4b.ongoing_content_opt_out_at && (await consents(l4.id)).map((c) => c.action).join() === "opt_in_requested,opt_out");
  const stale = await confirmLead(old);
  check("H17 the old confirmation link no longer works", stale.status === 409 && (await leadByEmail(e3)).ongoing_content_opt_in === false, JSON.stringify(stale));
}

// ---------------------------------------------------------------- I. provider webhook (simulated; Resend cannot reach localhost)
{
  const whsec = `whsec_${Buffer.from("local-webhook-secret-for-tests").toString("base64")}`;
  const key = Buffer.from(whsec.slice(6), "base64");
  const hook = async (type, data, { sign = true, ts = Math.floor(Date.now() / 1000), id = `msg_${randomUUID()}` } = {}) => {
    const body = JSON.stringify({ type, data });
    const signature = sign ? `v1,${createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64")}` : "v1,AAAA";
    const res = await fetch(BASE + "/api/webhooks/resend", { method: "POST", headers: { "svix-id": id, "svix-timestamp": String(ts), "svix-signature": signature, "content-type": "application/json" }, body });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const email = sink("hook");
  await request(email);
  const lead = await leadByEmail(email);
  const rq = (await requests(lead.id))[0];
  const pid = rq.delivery_provider_id;
  const status = async () => (await requests(lead.id))[0].delivery_status;

  eq("I1 unsigned webhook rejected", (await hook("email.delivered", { email_id: pid }, { sign: false })).status, 401);
  eq("I2 stale webhook rejected", (await hook("email.delivered", { email_id: pid }, { ts: 1000 })).status, 401);
  eq("I3 still queued: nothing upgraded on faith", await status(), "queued");
  await hook("email.sent", { email_id: pid });
  eq("I4 email.sent -> sent", await status(), "sent");
  const dupId = `msg_${randomUUID()}`;
  await hook("email.delivered", { email_id: pid }, { id: dupId });
  eq("I5 email.delivered -> delivered", await status(), "delivered");
  const replay = await hook("email.delivered", { email_id: pid }, { id: dupId });
  check("I5b the SAME delivery event replayed is harmless: still 200, one event row", replay.status === 200 && (await events({ request_id: rq.id, event_name: "resource_delivery_delivered" })).length === 1);
  await hook("email.sent", { email_id: pid });
  eq("I6 late/out-of-order sent does not regress delivered", await status(), "delivered");
  check("I7 delivered event recorded exactly once", (await events({ request_id: rq.id, event_name: "resource_delivery_delivered" })).length === 1);
  eq("I8 unrelated provider email ignored (account-wide webhooks)", (await hook("email.delivered", { email_id: "not-ours" })).body.ignored, true);

  const e2 = sink("bounce");
  await request(e2);
  const l2 = await leadByEmail(e2);
  const r2 = (await requests(l2.id))[0];
  await hook("email.bounced", { email_id: r2.delivery_provider_id, bounce: { message: "mailbox full" } });
  const r2b = (await requests(l2.id))[0];
  check("I9 bounce -> bounced with error text", r2b.delivery_status === "bounced" && /mailbox/.test(r2b.delivery_error));
  check("I10 bounced event recorded", (await events({ request_id: r2.id, event_name: "resource_delivery_bounced" })).length === 1);

  const e3 = sink("complaint");
  await request(e3);
  const l3 = await leadByEmail(e3);
  await confirmLead(confirmToken(l3.id));
  const r3 = (await requests(l3.id))[0];
  await hook("email.complained", { email_id: r3.delivery_provider_id });
  const l3b = await leadByEmail(e3);
  check("I11 spam complaint suppresses + opts out", l3b.suppressed_at && l3b.ongoing_content_opt_in === false && l3b.suppression_reason === "spam_complaint");
  eq("I12 complaint evidence appended", (await consents(l3.id)).map((c) => `${c.action}:${c.method}`), ["opt_in_requested:button_disclosure", "opt_in:email_confirmation", "opt_out:spam_complaint"]);
  await hook("email.complained", { email_id: r3.delivery_provider_id });
  eq("I12b a repeated complaint adds no extra record", (await consents(l3.id)).length, 3);
  const again = await request(e3, {}, {});
  eq("I13 a suppressed address is not re-subscribed by the form", [again.body.consent, (await leadByEmail(e3)).ongoing_content_opt_in], ["not_applied", false]);
}

// ---------------------------------------------------------------- J. append-only + RLS + anon access
{
  const { data: any } = await sb.from("consent_records").select("id").limit(1);
  const upd = await sb.from("consent_records").update({ wording_version: "tampered" }).eq("id", any[0].id);
  check("J1 consent_records rejects UPDATE (append-only)", !!upd.error && /append-only/.test(upd.error.message), JSON.stringify(upd.error));
  const anon = createClient(process.env.API_URL, process.env.ANON_KEY, { auth: { persistSession: false } });
  for (const t of ["consent_records", "resource_events", "resource_requests", "leads"]) {
    const r = await anon.from(t).select("*").limit(1);
    check(`J2 anon key reads nothing from ${t}`, !r.error && r.data.length === 0, JSON.stringify(r));
  }
  const ins = await anon.from("resource_events").insert({ event_name: "resource_page_view", resource_id: resource.id, resource_slug: SLUG, resource_type: "Guide" });
  check("J3 anon cannot insert events directly", !!ins.error);
}

// ---------------------------------------------------------------- K. admin protection
{
  const g = await fetch(`${BASE}/admin/guides`, { redirect: "manual" });
  check("K1 /admin/guides redirects when signed out", g.status === 307 && /\/admin$/.test(g.headers.get("location")), String(g.status));
  const d = await fetch(`${BASE}/admin/guides/${SLUG}`, { redirect: "manual" });
  check("K2 /admin/guides/[slug] redirects when signed out", d.status === 307, String(d.status));
  const ex = await fetch(`${BASE}/api/admin/leads/export?kind=all`, { redirect: "manual" });
  eq("K3 admin API still 401 when signed out", ex.status, 401);
}

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
