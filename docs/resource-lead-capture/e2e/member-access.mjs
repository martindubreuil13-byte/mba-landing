// End-to-end checks for the member-access model (public layer + confirmed-member layer). Runs against LOCAL Next + LOCAL Supabase only.
// Emails go to Resend's official sink addresses (resend.dev) only.
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SLUG = "build-the-bridge-first";
const CONSENT = "resource-guide-consent-v1.2";
const MOCK = "http://127.0.0.1:4010";
const MODE = process.env.MODE ?? "production-mock"; // production-mock | email-failed (app started with NO_KEY=1)
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
  post("/api/resources/member-access", { email, slug: SLUG, ctaLocation: "top", consentVersion: CONSENT, sessionId: sid(), pagePath: `/resources/${SLUG}`, attribution: { source: "e2e", medium: "test", campaign: null, referrer: null, utm: {} }, website: "", ...extra }, opts);
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

// ---------------------------------------------------------------- helpers
const mails = async (email) => (await fetch(`${MOCK}/__sent`).then((r) => r.json())).filter((m) => m.to.includes(email.toLowerCase()) || m.to.includes(email));
const mailBody = async (id) => fetch(`${MOCK}/emails/${id}`).then((r) => r.json());
const pick = (html, re) => decodeURIComponent(new URL(html.match(re)[1].replace(/&amp;/g, "&")).searchParams.get("token"));
const CONFIRM_RE = /href="([^"]*\/confirm\?token=[^"]+)"/;
const UNSUB_RE = /href="([^"]*\/unsubscribe\?token=[^"]+)"/;
const DL_RE = /href="([^"]*\/api\/resources\/download\?token=[^"]+)"/;
const SUBJECT = { confirm: "Confirm your email to unlock Build the Bridge First", delivery: "Your guide is ready: Build the Bridge First", rejoin: "Confirm to rejoin the community" };
const NEUTRAL = { success: true, state: "check_inbox" };
const pdfBytes = fs.readFileSync(PDF);

/** A person who asked, confirmed, and is now a confirmed member (goes through the real emails). */
async function makeMember(label) {
  const email = sink(label);
  const r = await request(email);
  const conf = (await mails(email)).find((m) => m.subject === SUBJECT.confirm);
  const html = (await mailBody(conf.id)).html;
  const token = pick(html, CONFIRM_RE);
  const c = await confirmLead(token);
  return { email, token, unsub: pick(html, UNSUB_RE), first: r, confirmed: c };
}

if (MODE === "email-failed") {
  // ------------------------------------------------------------ the email provider is down / not configured
  const email = sink("failed");
  const r = await request(email);
  check("X1 provider failure is reported honestly (502), not as 'check your inbox'", r.status === 502 && !r.body.success, JSON.stringify(r));
  const lead = await leadByEmail(email);
  const rq = (await requests(lead.id))[0];
  check("X2 the request is stored LOCKED with delivery failed and a reason", rq && !rq.benefit_fulfilled_at && rq.delivery_status === "failed" && !!rq.delivery_error);
  check("X3 nothing is downloadable and no URL was exposed", !JSON.stringify(r.body).match(/download|token/i) && (await fetch(`${BASE}/api/resources/download?token=${rq.id}`, { redirect: "manual" })).headers.get("location")?.endsWith(`/resources/${SLUG}`));
  eq("X4 consent REQUEST still recorded (marketing off)", [(await leadByEmail(email)).ongoing_content_opt_in, (await consents(lead.id)).map((c) => c.action)], [false, ["opt_in_requested"]]);
  const again = await request(email);
  eq("X5 asking again retries the email and fails honestly again, still one request row", [again.status, (await requests(lead.id)).length], [502, 1]);
  console.log(results.join("\n"));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------- B. new person: pending request, nothing unlocked
let newPerson;
{
  const email = sink("new");
  const session = sid();
  await evt("resource_page_view", session, { referrer: "https://www.linkedin.com/feed/", attribution: { source: "linkedin.com", medium: "referral" } });
  await evt("resource_cta_clicked", session, { ctaLocation: "mid-guide" });
  await evt("resource_form_opened", session, { ctaLocation: "mid-guide" });
  const r = await request(email, { sessionId: session, ctaLocation: "mid-guide", attribution: { source: "linkedin.com", medium: "referral", campaign: null, referrer: "https://www.linkedin.com/feed/", utm: {} } });
  eq("B1 request accepted with the one fixed neutral response", [r.status, r.body], [200, NEUTRAL]);
  check("B2 the response carries no URL, token or request id", !/download|token|http|[0-9a-f]{8}-[0-9a-f]{4}/i.test(JSON.stringify(r.body)), JSON.stringify(r.body));

  const lead = await leadByEmail(email);
  check("B3 lead created, marketing OFF, request stamped (pending)", lead && lead.ongoing_content_opt_in === false && lead.ongoing_content_opt_in_at === null && !!lead.consent_requested_at);
  const c = await consents(lead.id);
  eq("B4 exactly one consent record: opt_in_requested", c.map((x) => x.action), ["opt_in_requested"]);
  check("B5 evidence is the v1.2 wording incl. the member-benefit disclosure", c[0].wording_version === CONSENT && c[0].method === "button_disclosure" && c[0].source_resource_id === resource.id && c[0].cta_location === "mid-guide" && /EMAIL ME A CONFIRMATION LINK/.test(c[0].wording_text) && /starts only when you confirm/.test(c[0].wording_text) && !!c[0].ip_hash);
  const rq = (await requests(lead.id))[0];
  check("B6 the request is LOCKED (benefit_fulfilled_at null) and its confirmation email queued", rq.benefit_fulfilled_at === null && rq.opted_in_this_request === true && rq.delivery_status === "queued");
  check("B7 attribution is persisted on the request itself", rq.source === "linkedin.com" && rq.medium === "referral" && rq.referrer === "linkedin.com", JSON.stringify([rq.source, rq.medium, rq.referrer]));
  const sub = (await events({ request_id: rq.id, event_name: "resource_form_submitted" }))[0];
  check("B8 the submit event carries the same attribution (events stay the detailed record)", sub.utm_source === "linkedin.com" && sub.utm_medium === "referral" && sub.referrer === "linkedin.com", JSON.stringify([sub.utm_source, sub.utm_medium, sub.referrer]));
  check("B9 earlier anonymous session events joined the lead", (await events({ lead_id: lead.id, event_name: "resource_page_view" })).length === 1);

  const sent = await mails(email);
  eq("B10 exactly ONE email, the confirmation email", sent.map((m) => m.subject), [SUBJECT.confirm]);
  const mail = await mailBody(sent[0].id);
  for (const [name, body] of [["html", mail.html], ["text", mail.text]]) {
    check(`B11 confirmation email (${name}) contains NO download URL, token or PDF reference`, !/api\/resources\/download|\bd1\.[A-Za-z0-9_-]+\.|\.pdf/i.test(body));
    check(`B12 confirmation email (${name}) links to the /confirm PAGE, never the API`, /\/confirm\?token=/.test(body) && !/\/api\/confirm/.test(body));
  }
  check("B13 list-unsubscribe headers present", /unsubscribe\?token=/.test(mail.headers["List-Unsubscribe"]) && mail.headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click");

  // nothing is downloadable before confirmation, by any route
  const legacy = await fetch(`${BASE}/api/resources/download?token=${rq.id}`, { redirect: "manual" });
  check("B14 the bare request id (legacy-style link) does NOT download a locked request", legacy.status === 307 && legacy.headers.get("location").endsWith(`/resources/${SLUG}`), `${legacy.status} ${legacy.headers.get("location")}`);
  check("B15 a forged signed token downloads nothing", (await fetch(`${BASE}/api/resources/download?token=d1.${rq.id}.${resource.id}.9999999999.AAAA`, { redirect: "manual" })).headers.get("location")?.endsWith("/resources"));
  const pageHtml = await (await fetch(`${BASE}/resources/${SLUG}`)).text();
  check("B16 the public page source exposes no download URL or token", !/api\/resources\/download|\bd1\.[A-Za-z0-9_-]{10,}/.test(pageHtml));

  // the confirmation PAGE only explains
  const token = pick(mail.html, CONFIRM_RE);
  const cp = await fetch(`${BASE}/confirm?token=${encodeURIComponent(token)}`);
  const cpHtml = await cp.text();
  check("B17 GET /confirm explains what confirming unlocks and offers the button", cp.status === 200 && /Unlock the printable guide/.test(cpHtml) && /Confirm and unlock the guide/.test(cpHtml) && /free member/.test(cpHtml));
  check("B18 GET /confirm exposes no download URL", !/api\/resources\/download/.test(cpHtml));
  const afterGet = await leadByEmail(email);
  check("B19 GET changed NOTHING: still pending, request still locked, no new email", afterGet.ongoing_content_opt_in === false && (await requests(lead.id))[0].benefit_fulfilled_at === null && (await mails(email)).length === 1 && (await consents(lead.id)).length === 1);
  newPerson = { email, lead, rq, token, mail };
}

// ---------------------------------------------------------------- C. confirmation POST: activates membership + unlocks, once
{
  const { email, lead, rq, token } = newPerson;
  const ok = await confirmLead(token);
  check("C1 POST confirms and returns the signed download for the confirming browser", ok.status === 200 && ok.body.status === "confirmed" && /^\/api\/resources\/download\?token=d1\./.test(ok.body.benefit?.downloadUrl ?? ""), JSON.stringify(ok));
  const l = await leadByEmail(email);
  check("C2 marketing is now active with a timestamp", l.ongoing_content_opt_in === true && !!l.ongoing_content_opt_in_at);
  eq("C3 history: request then confirmation, linked, same wording", [(await consents(lead.id)).map((c) => `${c.action}:${c.method}`), (await consents(lead.id))[1].related_record_id === (await consents(lead.id))[0].id], [["opt_in_requested:button_disclosure", "opt_in:email_confirmation"], true]);
  const rq2 = (await requests(lead.id))[0];
  check("C4 the request is UNLOCKED", !!rq2.benefit_fulfilled_at);
  const sent = await mails(email);
  eq("C5 exactly one more email: the member delivery email", sent.map((m) => m.subject), [SUBJECT.confirm, SUBJECT.delivery]);
  const delivery = await mailBody(sent[1].id);
  const signed = pick(delivery.html, DL_RE);
  check("C6 the delivery email carries a SIGNED, resource-scoped download link (not the bare request id)", signed.startsWith("d1.") && signed.split(".")[1] === rq.id && signed.split(".")[2] === resource.id && !delivery.html.includes(`token=${rq.id}`));
  check("C7 the plain-text delivery email carries the same link", delivery.text.includes(`token=${encodeURIComponent(signed)}`) || delivery.text.includes(`token=${signed}`));
  check("C8 events: confirmed (benefit unlocked) and fulfilled via confirmation, once each",
    (await events({ lead_id: lead.id, event_name: "resource_opt_in_confirmed" })).length === 1 && (await events({ lead_id: lead.id, event_name: "resource_benefit_fulfilled" })).filter((e) => e.metadata.via === "confirmation").length === 1 && (await events({ lead_id: lead.id, event_name: "resource_opt_in_confirmed" }))[0].metadata.benefit === "unlocked");

  const dl = await fetch(BASE + ok.body.benefit.downloadUrl, { redirect: "manual" });
  check("C9 the confirmation response's link redirects to storage", dl.status === 307 && /supabase|127\.0\.0\.1|localhost/.test(dl.headers.get("location")) && !dl.headers.get("location").endsWith(`/resources/${SLUG}`), `${dl.status} ${dl.headers.get("location")}`);
  const file = Buffer.from(await (await fetch(dl.headers.get("location"))).arrayBuffer());
  check("C10 and serves the corrected PDF byte-for-byte", file.equals(pdfBytes), `${file.length} vs ${pdfBytes.length}`);
  const viaEmail = await fetch(`${BASE}/api/resources/download?token=${encodeURIComponent(signed)}&via=email`, { redirect: "manual" });
  eq("C11 the emailed link downloads too", viaEmail.status, 307);
  check("C12 a signed token for ANOTHER resource id is rejected", (await fetch(`${BASE}/api/resources/download?token=${encodeURIComponent(signed.replace(resource.id, "00000000-0000-0000-0000-000000000000"))}`, { redirect: "manual" })).headers.get("location")?.endsWith("/resources"));
  check("C13 download counted (form-style dedupe applies)", (await requests(lead.id))[0].download_count >= 1);

  // replay: idempotent
  const before = { consents: (await consents(lead.id)).length, mails: (await mails(email)).length };
  const again = await confirmLead(token);
  check("C14 replaying the confirmation is harmless ('already confirmed') and still hands over the same benefit", again.status === 200 && again.body.status === "already_confirmed" && /d1\./.test(again.body.benefit?.downloadUrl ?? ""), JSON.stringify(again));
  check("C15 replay adds no consent record, no email, no second unlock event, no second confirmed event", (await consents(lead.id)).length === before.consents && (await mails(email)).length === before.mails && (await events({ lead_id: lead.id, event_name: "resource_benefit_fulfilled" })).length === 1 && (await events({ lead_id: lead.id, event_name: "resource_opt_in_confirmed" })).length === 1);
  eq("C16 forged / tampered confirmation token rejected", (await confirmLead(token.slice(0, -3) + "AAA")).status, 400);
  newPerson.unsubTok = unsubToken(lead.id);
}

// concurrent confirmations: one unlock, one delivery email
{
  const email = sink("race");
  await request(email);
  const lead = await leadByEmail(email);
  const t = confirmToken(lead.id);
  const rs = await Promise.all([confirmLead(t), confirmLead(t), confirmLead(t)]);
  const statuses = rs.map((r) => r.body.status).sort();
  check("C17 three simultaneous confirmations: exactly one 'confirmed', the rest 'already confirmed'", statuses.filter((s) => s === "confirmed").length === 1 && statuses.every((s) => s === "confirmed" || s === "already_confirmed"), JSON.stringify(statuses));
  eq("C18 …and the benefit is unlocked once, with one delivery email", [(await events({ lead_id: lead.id, event_name: "resource_benefit_fulfilled" })).length, (await mails(email)).filter((m) => m.subject === SUBJECT.delivery).length], [1, 1]);
}

// ---------------------------------------------------------------- D. existing confirmed member asks again
{
  const m = await makeMember("member");
  const lead = await leadByEmail(m.email);
  // The member got their delivery email a moment ago (when they confirmed); a repeat inside the dedupe window sends nothing.
  const quick = await request(m.email);
  eq("D0 asking again minutes after confirming: same neutral answer, no duplicate email", [quick.body, (await mails(m.email)).filter((x) => x.subject === SUBJECT.delivery).length], [NEUTRAL, 1]);
  const old = new Date(Date.now() - 11 * 60_000).toISOString();
  await sb.from("resource_requests").update({ requested_at: old }).eq("lead_id", lead.id);
  const before = { consents: (await consents(lead.id)).length, reqs: (await requests(lead.id)).length, mails: (await mails(m.email)).length };
  const r = await request(m.email);
  eq("D1 the response is IDENTICAL to a new person's (no hint that this is a member)", [r.status, r.body], [200, NEUTRAL]);
  check("D2 nothing is revealed or unlocked on screen: no URL anywhere in the response", !/download|http|token/i.test(JSON.stringify(r.body)));
  const sent = await mails(m.email);
  eq("D3 the benefit is EMAILED to the member", sent.slice(before.mails).map((x) => x.subject), [SUBJECT.delivery]);
  const mail = await mailBody(sent[sent.length - 1].id);
  check("D4 that email has a signed download link and does NOT ask them to confirm again", /d1\./.test(pick(mail.html, DL_RE)) && !/Confirm and unlock/.test(mail.html) && !CONFIRM_RE.test(mail.html));
  check("D5 consent is untouched: no new request record, still active", (await consents(lead.id)).length === before.consents && (await leadByEmail(m.email)).ongoing_content_opt_in === true);
  const reqs = await requests(lead.id);
  check("D6 a new UNLOCKED request row was recorded for the member (not a membership request)", reqs.length === before.reqs + 1 && !!reqs[reqs.length - 1].benefit_fulfilled_at && reqs[reqs.length - 1].opted_in_this_request === false);
  newPerson.member = m;
}

// ---------------------------------------------------------------- E. pending person asks again
{
  const email = sink("pending");
  const a = await request(email);
  const lead = await leadByEmail(email);
  const b = await request(email);
  eq("E1 same neutral response both times", [a.body, b.body], [NEUTRAL, NEUTRAL]);
  eq("E2 within the dedupe window: one request row, one email, one consent record", [(await requests(lead.id)).length, (await mails(email)).length, (await consents(lead.id)).length], [1, 1, 1]);
  // age the request and the stamp past the window: asking again re-sends the confirmation
  const old = new Date(Date.now() - 11 * 60_000).toISOString();
  await sb.from("resource_requests").update({ requested_at: old }).eq("lead_id", lead.id);
  await sb.from("leads").update({ consent_requested_at: old }).eq("id", lead.id);
  const c = await request(email);
  eq("E3 later, asking again re-sends the confirmation within the rate limits", [c.body, (await mails(email)).filter((m) => m.subject === SUBJECT.confirm).length, (await requests(lead.id)).length], [NEUTRAL, 2, 2]);
  const lastConfirm = await mailBody((await mails(email)).filter((m) => m.subject === SUBJECT.confirm).pop().id);
  const res = await confirmLead(pick(lastConfirm.html, CONFIRM_RE));
  check("E4 one confirmation unlocks BOTH locked requests and sends ONE delivery email", res.body.status === "confirmed" && (await requests(lead.id)).every((r) => !!r.benefit_fulfilled_at) && (await mails(email)).filter((m) => m.subject === SUBJECT.delivery).length === 1, JSON.stringify(res.body));
  eq("E5 the unlock events are one per request", (await events({ lead_id: lead.id, event_name: "resource_benefit_fulfilled" })).length, 2);
}

// ---------------------------------------------------------------- F. unsubscribed: never silently reactivated
let unsubscribedMember;
{
  const m = await makeMember("unsubbed");
  const lead = await leadByEmail(m.email);
  const u = await post("/api/unsubscribe", { token: unsubToken(lead.id) });
  check("F0 setup: unsubscribed", u.status === 200 && (await leadByEmail(m.email)).ongoing_content_opt_in === false);
  const before = { consents: (await consents(lead.id)).length, reqs: (await requests(lead.id)).length, mails: (await mails(m.email)).length, lead: await leadByEmail(m.email) };
  const r = await request(m.email);
  eq("F1 the response is IDENTICAL to a new person's: nothing reveals the unsubscribed state", [r.status, r.body], [200, NEUTRAL]);
  const after = await leadByEmail(m.email);
  check("F2 no email sent, no consent record, no request row", (await mails(m.email)).length === before.mails && (await consents(lead.id)).length === before.consents && (await requests(lead.id)).length === before.reqs);
  check("F3 the lead is exactly as it was: still opted out, not pending, not active", after.ongoing_content_opt_in === false && after.consent_requested_at === null && after.ongoing_content_opt_out_at === before.lead.ongoing_content_opt_out_at);
  check("F4 the ignored attempt is recorded internally (reason unsubscribed), never shown", (await sb.from("resource_events").select("*").eq("event_name", "resource_membership_blocked").eq("resource_id", resource.id)).data.some((e) => e.metadata.reason === "unsubscribed"));
  unsubscribedMember = m;
}

// ---------------------------------------------------------------- G. suppressed: never reactivated
{
  const email = sink("suppressed");
  const lead = await legacyLead(email, { ongoing_content_opt_in: false, suppressed_at: new Date().toISOString(), suppression_reason: "spam_complaint" });
  const r = await request(email);
  eq("G1 identical neutral response", [r.status, r.body], [200, NEUTRAL]);
  check("G2 nothing sent, no request row, no consent change, still suppressed", (await mails(email)).length === 0 && (await requests(lead.id)).length === 0 && (await consents(lead.id)).length === 0 && !!(await leadByEmail(email)).suppressed_at);
  const active = sink("suppressed-active");
  const l2 = await legacyLead(active, { ongoing_content_opt_in: true, ongoing_content_opt_in_at: new Date().toISOString(), suppressed_at: new Date().toISOString(), suppression_reason: "spam_complaint" });
  await request(active);
  check("G3 even an address that is both 'opted in' and suppressed gets nothing", (await mails(active)).length === 0 && (await requests(l2.id)).length === 0);
}

// ---------------------------------------------------------------- H. explicit rejoin
{
  const m = unsubscribedMember;
  const lead = await leadByEmail(m.email);
  const rejoin = (email, extra = {}, opts) => post("/api/membership/rejoin", { email, consentVersion: "membership-rejoin-v1.0", website: "", ...extra }, opts);

  const r = await rejoin(m.email);
  eq("H1 rejoin answers with the neutral state", [r.status, r.body], [200, NEUTRAL]);
  const sent = await mails(m.email);
  const rejoinMail = sent.find((x) => x.subject === SUBJECT.rejoin);
  check("H2 a rejoin confirmation email was sent, with no download", !!rejoinMail && !/api\/resources\/download/.test((await mailBody(rejoinMail.id)).html));
  const l = await leadByEmail(m.email);
  const cs = await consents(lead.id);
  check("H3 consent is PENDING again, marketing still OFF, wording is the rejoin version", l.ongoing_content_opt_in === false && !!l.consent_requested_at && cs[cs.length - 1].action === "opt_in_requested" && cs[cs.length - 1].wording_version === "membership-rejoin-v1.0" && cs[cs.length - 1].source_type === "rejoin" && cs[cs.length - 1].source_resource_id === null);
  const rtoken = pick((await mailBody(rejoinMail.id)).html, CONFIRM_RE);
  const page = await (await fetch(`${BASE}/confirm?token=${encodeURIComponent(rtoken)}`)).text();
  check("H4 the confirm page for a rejoin does not mention the guide unlock", !/Unlock the printable guide/.test(page) && /Join the Modern Business Architect community/.test(page));
  const ok = await confirmLead(rtoken);
  check("H5 confirming a rejoin reactivates membership but unlocks nothing new", ok.body.status === "confirmed" && !ok.body.benefit && (await leadByEmail(m.email)).ongoing_content_opt_in === true, JSON.stringify(ok.body));
  eq("H6 history is append-only: …opt_out, opt_in_requested (rejoin), opt_in", (await consents(lead.id)).map((c) => c.action).slice(-3), ["opt_out", "opt_in_requested", "opt_in"]);
  eq("H6b no delivery email was sent for the rejoin", (await mails(m.email)).filter((x) => x.subject === SUBJECT.delivery).length, sent.filter((x) => x.subject === SUBJECT.delivery).length);

  // the same neutral answer for every other state, and nothing happens
  const states = {
    unknown: sink("rejoin-unknown"),
    active: (await makeMember("rejoin-active")).email,
    pending: (async () => { const e = sink("rejoin-pending"); await request(e); return e; })(),
    suppressed: sink("rejoin-suppressed"),
  };
  states.pending = await states.pending;
  await legacyLead(states.suppressed, { ongoing_content_opt_in: false, suppressed_at: new Date().toISOString(), suppression_reason: "spam_complaint" });
  const answers = {};
  for (const [name, email] of Object.entries(states)) {
    const before = (await mails(email)).length;
    const a = await rejoin(email);
    answers[name] = a;
    check(`H7 rejoin for a ${name} address: neutral answer, no email`, a.status === 200 && JSON.stringify(a.body) === JSON.stringify(NEUTRAL) && (await mails(email)).length === before, JSON.stringify(a));
  }
  check("H8 rejoin never creates a lead for an unknown address", (await leadByEmail(states.unknown)) === null);
  check("H9 rejoin leaves a suppressed address suppressed and an active member active", !!(await leadByEmail(states.suppressed)).suppressed_at && (await leadByEmail(states.active)).ongoing_content_opt_in === true);
  eq("H10 rejoin with the wrong wording version -> 409", (await rejoin(sink("rv"), { consentVersion: "resource-guide-consent-v1.2" })).status, 409);
  eq("H11 invalid email -> 400", (await rejoin("nope")).status, 400);
  const hp = await rejoin(sink("rj-honey"), { website: "x" });
  check("H12 honeypot pretends success", hp.status === 200 && (await leadByEmail(sink("rj-honey"))) === null);
  const perEmail = sink("rj-limit");
  const rs = [];
  for (let i = 0; i < 4; i++) rs.push((await rejoin(perEmail, {}, { ip: freshIp() })).status);
  eq("H13 rejoin is rate-limited per address (2 then 429), whatever the state", rs, [200, 200, 429, 429]);
  const ipLimit = freshIp();
  const codes = [];
  for (let i = 0; i < 8; i++) codes.push((await rejoin(sink(`rj-ip${i}`), {}, { ip: ipLimit })).status);
  eq("H14 rejoin is rate-limited per connection (6 then 429)", [codes.slice(0, 6).every((c) => c === 200), codes.slice(6)], [true, [429, 429]]);
  const page2 = await fetch(`${BASE}/rejoin`);
  const html2 = await page2.text();
  check("H15 /rejoin page renders (noindex) with the explicit wording", page2.status === 200 && /Rejoin the community/.test(html2) && /Nothing changes until you confirm/.test(html2) && /noindex/.test(html2));
}

// ---------------------------------------------------------------- I. unsubscribe does not revoke what was unlocked
{
  const m = await makeMember("keep");
  const lead = await leadByEmail(m.email);
  const delivery = await mailBody((await mails(m.email)).find((x) => x.subject === SUBJECT.delivery).id);
  const signed = pick(delivery.html, DL_RE);
  const rq = (await requests(lead.id))[0];
  eq("I1 downloads before unsubscribing", (await fetch(`${BASE}/api/resources/download?token=${encodeURIComponent(signed)}`, { redirect: "manual" })).status, 307);
  const u = await post("/api/unsubscribe", { token: unsubToken(lead.id) });
  check("I2 unsubscribe works", u.status === 200 && (await leadByEmail(m.email)).ongoing_content_opt_in === false);
  const loc = (u2) => u2.headers.get("location") ?? "";
  const afterSigned = await fetch(`${BASE}/api/resources/download?token=${encodeURIComponent(signed)}`, { redirect: "manual" });
  const afterLegacy = await fetch(`${BASE}/api/resources/download?token=${rq.id}`, { redirect: "manual" });
  check("I3 the signed link STILL downloads after unsubscribing", afterSigned.status === 307 && !loc(afterSigned).endsWith(`/resources/${SLUG}`), loc(afterSigned));
  check("I4 so does the request-id link of an unlocked request (existing rules)", afterLegacy.status === 307 && !loc(afterLegacy).endsWith(`/resources/${SLUG}`));
}

// ---------------------------------------------------------------- J. v1.1 requests and issued links keep working; pending legacy leads are not contacted
{
  const email = sink("legacy-pending");
  const lead = await legacyLead(email, { ongoing_content_opt_in: false, consent_requested_at: new Date(Date.now() - 3600_000).toISOString() });
  const { data: rqRow } = await sb.from("resource_requests").insert({ lead_id: lead.id, resource_id: resource.id, resource_action: "download", opted_in_this_request: true, delivery_status: "delivered", benefit_fulfilled_at: new Date().toISOString(), requested_at: new Date(Date.now() - 3600_000).toISOString() }).select().single();
  await sb.from("consent_records").insert({ lead_id: lead.id, action: "opt_in_requested", wording_version: "resource-guide-consent-v1.1", wording_text: "v1.1 wording", method: "button_disclosure", source_type: "guide", source_resource_id: resource.id, cta_location: "top", created_at: new Date(Date.now() - 3600_000).toISOString() });
  const issued = await fetch(`${BASE}/api/resources/download?token=${rqRow.id}&via=email`, { redirect: "manual" });
  check("J1 a link issued under v1.1 (bare request id, backfilled as unlocked) still downloads", issued.status === 307 && !issued.headers.get("location").endsWith(`/resources/${SLUG}`), issued.headers.get("location"));
  const before = (await mails(email)).length;
  const res = await confirmLead(confirmToken(lead.id));
  check("J2 such a pending lead can still confirm with its original link, and receives its existing download", res.body.status === "confirmed" && /d1\./.test(res.body.benefit?.downloadUrl ?? ""), JSON.stringify(res.body));
  eq("J3 no email is sent to them (nothing newly unlocked, no backfill email)", (await mails(email)).length, before);
  eq("J4 their v1.1 consent evidence is preserved and extended, not rewritten", (await consents(lead.id)).map((c) => `${c.action}:${c.wording_version}`), ["opt_in_requested:resource-guide-consent-v1.1", "opt_in:resource-guide-consent-v1.1"]);
  eq("J5 a stale page still posting the v1.1 wording is told to reload, and nothing is stored", [(await request(sink("stale"), { consentVersion: "resource-guide-consent-v1.1" })).status, await leadByEmail(sink("stale"))], [409, null]);
  const compat = await post("/api/resources/printable-guide", { email: sink("compat"), slug: SLUG, ctaLocation: "top", consentVersion: CONSENT, sessionId: sid(), pagePath: `/resources/${SLUG}`, attribution: {}, website: "" });
  eq("J6 the old endpoint is a compatibility wrapper around the same handler (same neutral answer)", [compat.status, compat.body], [200, NEUTRAL]);
}

// ---------------------------------------------------------------- K. attribution
{
  const s = sid();
  await evt("resource_page_view", s, { referrer: "https://www.google.com/search?q=x", attribution: { source: "google", medium: "organic" } });
  const email = sink("attr-fallback");
  await request(email, { sessionId: s, attribution: { source: "direct", medium: "direct", campaign: null, referrer: null, utm: {} } });
  const rq = (await requests((await leadByEmail(email)).id))[0];
  check("K1 when the submitting page carried no attribution, the session's first page view fills the request", rq.referrer === "google.com" && rq.source === "google" && rq.medium === "organic", JSON.stringify([rq.source, rq.medium, rq.referrer]));
  const e2 = sink("attr-utm");
  await request(e2, { attribution: { source: "newsletter", medium: "email", campaign: "oct", referrer: "https://mail.example.com/x", utm: { source: "newsletter", medium: "email", campaign: "oct", content: "cta-a" } } });
  const r2 = (await requests((await leadByEmail(e2)).id))[0];
  check("K2 UTM values are persisted on the request", r2.utm_source === "newsletter" && r2.utm_medium === "email" && r2.utm_campaign === "oct" && r2.utm_content === "cta-a" && r2.referrer === "mail.example.com", JSON.stringify(r2));
  const e3 = sink("attr-direct");
  await request(e3, { attribution: { source: "direct", medium: "direct", campaign: null, referrer: null, utm: {} } });
  const r3 = (await requests((await leadByEmail(e3)).id))[0];
  check("K3 a genuinely direct visit stays direct (nothing invented)", r3.source === "direct" && r3.referrer === null);
}

// ---------------------------------------------------------------- L. invalid / abusive
{
  const bad = [["", /where to send/], ["nope", /missing an “@”/], ["a@b", /does not look right/], ["a@@b.com", /does not look right/]];
  for (const [e, re] of bad) {
    const r = await request(e);
    check(`L1 invalid email ${JSON.stringify(e)} -> 400 with helpful message`, r.status === 400 && re.test(r.body.error) && re.test(r.body.fieldErrors?.email), JSON.stringify(r));
  }
  eq("L2 wrong consent version -> 409", (await request(sink("v"), { consentVersion: "old-v0" })).status, 409);
  eq("L2b the superseded v1.0 and v1.1 wording are rejected too", [(await request(sink("v0"), { consentVersion: "resource-guide-consent-v1.0" })).status, (await request(sink("v1"), { consentVersion: "resource-guide-consent-v1.1" })).status], [409, 409]);
  eq("L3 invalid CTA -> 400", (await request(sink("c"), { ctaLocation: "popup" })).status, 400);
  eq("L4 unknown resource -> 404", (await request(sink("u"), { slug: "does-not-exist" })).status, 404);
  const honey = sink("honeypot");
  const h = await request(honey, { website: "http://spam" });
  check("L5 honeypot pretends success but stores nothing", h.status === 200 && (await leadByEmail(honey)) === null);
  eq("L6 not json -> 400", (await fetch(BASE + "/api/resources/member-access", { method: "POST", body: "x" })).status, 400);

  const dup = sink("dup");
  const ip = freshIp();
  await Promise.all([request(dup, {}, { ip }), request(dup, {}, { ip })]);
  const lead = await leadByEmail(dup);
  eq("L7 double submit: one lead, ONE consent request record", [(await sb.from("leads").select("id").eq("email", dup)).data.length, (await consents(lead.id)).length], [1, 1]);
  const reqs = await requests(lead.id);
  check("L8 double submit: at most 2 request rows and 2 emails even when truly concurrent", reqs.length <= 2 && (await mails(dup)).length <= 2, `${reqs.length} rows, ${(await mails(dup)).length} mails`);
  const c = await request(dup, {}, { ip });
  eq("L9 a later repeat re-uses the request (no new row, no extra email)", [c.body, (await requests(lead.id)).length], [NEUTRAL, reqs.length]);
  eq("L10 a re-used request is not counted as a new submission", (await events({ lead_id: lead.id, event_name: "resource_form_submitted" })).length, reqs.length);

  const limitIp = freshIp();
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await request(sink(`rl${i}`), {}, { ip: limitIp })).status);
  eq("L11 per-IP rate limit: first 10 ok, then 429", [codes.slice(0, 10).every((c) => c === 200), codes.slice(10)], [true, [429, 429]]);
  const emailLimit = sink("emaillimit");
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await request(emailLimit, {}, { ip: freshIp() })).status);
  eq("L12 per-address limit: 3 ok then 429 (the same for every state)", statuses, [200, 200, 200, 429, 429]);
  const limitMember = await makeMember("limitmember"); // their first request already counted
  const memberLimit = [];
  for (let i = 0; i < 5; i++) memberLimit.push((await request(limitMember.email, {}, { ip: freshIp() })).status);
  eq("L12b …the same limit for a confirmed member (2 more ok, then 429): the limit cannot tell states apart", memberLimit, [200, 200, 429, 429, 429]);
  check("L13 rate-limit message is helpful", /Check your inbox|try again/.test((await request(emailLimit, {}, { ip: freshIp() })).body.error));
  const confirmIp = freshIp();
  const cs = [];
  for (let i = 0; i < 32; i++) cs.push((await post("/api/confirm", { token: "c1.x.1.y" }, { ip: confirmIp })).status);
  check("L14 confirm endpoint is rate limited", cs.includes(429));
}

// ---------------------------------------------------------------- M. unsubscribe
{
  const m = await makeMember("tounsub");
  const lead = await leadByEmail(m.email);
  const t = unsubToken(lead.id);
  const page = await fetch(`${BASE}/unsubscribe?token=${encodeURIComponent(t)}`);
  const html = await page.text();
  check("M1 neutral /unsubscribe page renders for a valid token", page.status === 200 && /Unsubscribe from The Modern Business Architect/.test(html) && /stays yours/.test(html));
  eq("M2 GET never changes consent", (await leadByEmail(m.email)).ongoing_content_opt_in, true);
  eq("M3 invalid token rejected", (await post("/api/unsubscribe", { token: "v1.x.y" })).status, 400);
  const u1 = await post("/api/unsubscribe", { token: t });
  check("M4 unsubscribe works", u1.status === 200 && u1.body.success && u1.body.alreadyUnsubscribed === false);
  const l2 = await leadByEmail(m.email);
  check("M5 opted out, timestamp set, original opt-in timestamp preserved", l2.ongoing_content_opt_in === false && !!l2.ongoing_content_opt_out_at && !!l2.ongoing_content_opt_in_at);
  eq("M6 history preserved + opt_out appended", (await consents(lead.id)).map((c) => `${c.action}:${c.method}`), ["opt_in_requested:button_disclosure", "opt_in:email_confirmation", "opt_out:unsubscribe_link"]);
  const u2 = await post("/api/unsubscribe", { token: t });
  check("M7 repeat unsubscribe is idempotent (no extra record)", u2.body.alreadyUnsubscribed === true && (await consents(lead.id)).length === 3);
  const oneClick = await fetch(`${BASE}/api/unsubscribe?token=${encodeURIComponent(unsubToken((await makeMember("oneclick").then((x) => leadByEmail(x.email))).id))}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" });
  eq("M8 RFC 8058 one-click POST works", oneClick.status, 200);

  const e2 = (await makeMember("napkin-legacy")).email;
  const l3 = await leadByEmail(e2);
  const legacy = await post("/api/napkin/unsubscribe", { token: unsubToken(l3.id) });
  check("M9 legacy /api/napkin/unsubscribe still works and writes the same evidence", legacy.status === 200 && legacy.body.success && (await consents(l3.id)).map((c) => c.action).slice(-1)[0] === "opt_out");
  eq("M10 legacy /unsubscribe/napkin page still renders", (await fetch(`${BASE}/unsubscribe/napkin?token=${encodeURIComponent(unsubToken(l3.id))}`)).status, 200);

  // unsubscribing while PENDING cancels the request; the old confirmation link then no longer works
  const e3 = sink("cancel-pending");
  await request(e3);
  const l4 = await leadByEmail(e3);
  const old = confirmToken(l4.id);
  const cancel = await post("/api/unsubscribe", { token: unsubToken(l4.id) });
  check("M11 unsubscribe while pending cancels the request", cancel.status === 200 && cancel.body.alreadyUnsubscribed === false);
  const l4b = await leadByEmail(e3);
  check("M12 pending cleared, opt-out recorded", l4b.consent_requested_at === null && !!l4b.ongoing_content_opt_out_at && (await consents(l4.id)).map((c) => c.action).join() === "opt_in_requested,opt_out");
  const stale = await confirmLead(old);
  check("M13 the old confirmation link no longer works, and unlocks nothing", stale.status === 409 && (await leadByEmail(e3)).ongoing_content_opt_in === false && (await requests(l4.id)).every((r) => !r.benefit_fulfilled_at), JSON.stringify(stale));
}

// ---------------------------------------------------------------- N. provider webhook (simulated; Resend cannot reach localhost)
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

  eq("N1 unsigned webhook rejected", (await hook("email.delivered", { email_id: pid }, { sign: false })).status, 401);
  eq("N2 stale webhook rejected", (await hook("email.delivered", { email_id: pid }, { ts: 1000 })).status, 401);
  eq("N3 still queued: nothing upgraded on faith", await status(), "queued");
  await hook("email.sent", { email_id: pid });
  eq("N4 email.sent -> sent", await status(), "sent");
  const dupId = `msg_${randomUUID()}`;
  await hook("email.delivered", { email_id: pid }, { id: dupId });
  eq("N5 email.delivered -> delivered", await status(), "delivered");
  const replay = await hook("email.delivered", { email_id: pid }, { id: dupId });
  check("N5b the SAME delivery event replayed is harmless: still 200, one event row", replay.status === 200 && (await events({ request_id: rq.id, event_name: "resource_delivery_delivered" })).length === 1);
  await hook("email.sent", { email_id: pid });
  eq("N6 late/out-of-order sent does not regress delivered", await status(), "delivered");
  eq("N7 unrelated provider email ignored (account-wide webhooks)", (await hook("email.delivered", { email_id: "not-ours" })).body.ignored, true);

  // the second email (the member benefit) is tracked on its own after confirmation
  await confirmLead(confirmToken(lead.id));
  const rq2 = (await requests(lead.id))[0];
  check("N8 after unlock the benefit email gets its own provider id and starts a fresh delivery state", rq2.delivery_provider_id && rq2.delivery_provider_id !== pid && rq2.delivery_status === "queued", JSON.stringify([rq2.delivery_provider_id, pid, rq2.delivery_status]));
  await hook("email.delivered", { email_id: rq2.delivery_provider_id });
  eq("N9 the benefit email reaches delivered independently", await status(), "delivered");

  const e2 = sink("bounce");
  await request(e2);
  const l2 = await leadByEmail(e2);
  const r2 = (await requests(l2.id))[0];
  await hook("email.bounced", { email_id: r2.delivery_provider_id, bounce: { message: "mailbox full" } });
  const r2b = (await requests(l2.id))[0];
  check("N10 bounce -> bounced with error text", r2b.delivery_status === "bounced" && /mailbox/.test(r2b.delivery_error));

  const m3 = await makeMember("complaint");
  const l3 = await leadByEmail(m3.email);
  const r3 = (await requests(l3.id))[0];
  await hook("email.complained", { email_id: r3.delivery_provider_id });
  const l3b = await leadByEmail(m3.email);
  check("N11 spam complaint suppresses + opts out", l3b.suppressed_at && l3b.ongoing_content_opt_in === false && l3b.suppression_reason === "spam_complaint");
  eq("N12 complaint evidence appended", (await consents(l3.id)).map((c) => `${c.action}:${c.method}`).slice(-1), ["opt_out:spam_complaint"]);
  const before = (await mails(m3.email)).length;
  const again = await request(m3.email);
  check("N13 a suppressed address is not re-subscribed by the form (neutral answer, nothing sent)", again.status === 200 && JSON.stringify(again.body) === JSON.stringify(NEUTRAL) && (await leadByEmail(m3.email)).ongoing_content_opt_in === false && (await mails(m3.email)).length === before);
  const rj = await post("/api/membership/rejoin", { email: m3.email, consentVersion: "membership-rejoin-v1.0", website: "" });
  check("N14 …and rejoin does not reactivate a suppressed address either", rj.status === 200 && (await leadByEmail(m3.email)).ongoing_content_opt_in === false && (await mails(m3.email)).length === before);
}

// ---------------------------------------------------------------- O. marketing export contains confirmed active members only
{
  const { data: active } = await sb.from("leads").select("email").eq("ongoing_content_opt_in", true).is("suppressed_at", null);
  const emails = new Set(active.map((l) => l.email));
  check("O1 an address with only a pending request is not in the confirmed-active set", !emails.has(sink("dup").toLowerCase()) && !emails.has(sink("new-pending-never").toLowerCase()));
  check("O2 an address that never confirmed (rate-limit test address) is not in the set", !emails.has(sink("emaillimit").toLowerCase()));
  check("O3 unsubscribed and suppressed addresses are not in the set", !emails.has(unsubscribedMember.email.toLowerCase() + "x") && !emails.has(sink("suppressed").toLowerCase()));
}

// ---------------------------------------------------------------- P. append-only + RLS + anon access
{
  const { data: any } = await sb.from("consent_records").select("id").limit(1);
  const upd = await sb.from("consent_records").update({ wording_version: "tampered" }).eq("id", any[0].id);
  check("P1 consent_records rejects UPDATE (append-only)", !!upd.error && /append-only/.test(upd.error.message), JSON.stringify(upd.error));
  const anon = createClient(process.env.API_URL, process.env.ANON_KEY, { auth: { persistSession: false } });
  for (const t of ["consent_records", "resource_events", "resource_requests", "leads"]) {
    const r = await anon.from(t).select("*").limit(1);
    check(`P2 anon key reads nothing from ${t}`, !r.error && r.data.length === 0, JSON.stringify(r));
  }
  const ins = await anon.from("resource_events").insert({ event_name: "resource_page_view", resource_id: resource.id, resource_slug: SLUG, resource_type: "Guide" });
  check("P3 anon cannot insert events directly", !!ins.error);
}

// ---------------------------------------------------------------- Q. admin protection
{
  const g = await fetch(`${BASE}/admin/guides`, { redirect: "manual" });
  check("Q1 /admin/guides redirects when signed out", g.status === 307 && /\/admin$/.test(g.headers.get("location")), String(g.status));
  const d = await fetch(`${BASE}/admin/guides/${SLUG}`, { redirect: "manual" });
  check("Q2 /admin/guides/[slug] redirects when signed out", d.status === 307, String(d.status));
  const ex = await fetch(`${BASE}/api/admin/leads/export?kind=all`, { redirect: "manual" });
  eq("Q3 admin API still 401 when signed out", ex.status, 401);
}

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
