// End-to-end checks for Corporate Transition marketing consent (confirmed opt-in).
// Runs against a LOCAL app + LOCAL Supabase + the LOCAL mock Resend. Never contacts a real recipient or OpenAI.
//   MODE=production-mock   (app started with: scripts/e2e/start-local-server.sh production-mock)
//   MODE=preview-disabled  (app started with: scripts/e2e/start-local-server.sh preview-disabled)
// Env: API_URL, SERVICE_ROLE_KEY (from `supabase status -o env`).
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";
import { createHmac, randomUUID } from "node:crypto";

const MODE = process.env.MODE ?? "production-mock";
const BASE = process.env.BASE ?? "http://localhost:3000";
const MOCK = "http://127.0.0.1:4010";
const V2 = "corporate-transition-shortlist-v2";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const out = [];
const check = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  [${MODE}] ${n}${ok ? "" : "  -> " + d}`);
const eq = (n, a, b) => check(n, JSON.stringify(a) === JSON.stringify(b), `got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
process.on("unhandledRejection", (e) => { out.push(`FAIL  [${MODE}] script error: ${e?.message ?? e}`); console.log(out.join("\n")); process.exit(1); });

const run = Date.now().toString(36);
const ipBase = Math.floor(Math.random() * 200) + 20; let ipN = 0;
const ip = () => `10.${ipBase}.${ipN >> 8}.${(++ipN % 250) + 1}`;
const addr = (label) => `${label}-${run}@example.test`; // never a real mailbox; nothing is ever delivered outside the mock

const answers = (email, consent, extra = {}) => ({
  employment: "Manager", experience: "10–15 years",
  stage: "I know I want to build something of my own, but I don’t have a business idea yet.", timing: "6–12 months",
  motivation: "I want more control over what I do next and to use my experience.", help: "Working out what I could realistically build while employed.",
  country: "Canada", firstName: "Test", lastName: "Applicant", email, linkedin: "", marketingConsent: consent, ...extra,
});
async function apply(email, consent, { key = randomUUID(), extra } = {}) {
  const r = await fetch(`${BASE}/api/programs/corporate-transition/apply`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip(), "user-agent": "Mozilla/5.0 e2e" }, body: JSON.stringify({ answers: answers(email, consent, extra), attribution: {}, idempotencyKey: key, website: "" }) });
  return { status: r.status, body: await r.json().catch(() => ({})), key };
}
const post = async (path, body) => { const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip() }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const lead = async (email) => (await sb.from("leads").select("*").eq("email", email).maybeSingle()).data;
const consents = async (id) => (await sb.from("consent_records").select("*").eq("lead_id", id).order("created_at")).data;
const apps = async (id) => (await sb.from("program_applications").select("*").eq("lead_id", id).order("submitted_at")).data;
const mailTo = async (email) => (await fetch(`${MOCK}/__sent`).then((r) => r.json())).filter((m) => m.to.includes(email));
const confirmation = async (email) => (await mailTo(email)).filter((m) => m.subject === "Please confirm your email address");
const body = async (id) => fetch(`${MOCK}/emails/${id}`).then((r) => r.json());
const secret = process.env.SERVICE_ROLE_KEY; // the app signs links with the service key when no dedicated secret is set
const sign = (p) => createHmac("sha256", secret).update(p).digest("base64url");
const confirmToken = (leadId) => { const p = `c1.${leadId}.${Math.floor(Date.now() / 1000) + 86400}`; return `${p}.${sign(p)}`; };
const linkIn = (html, re) => decodeURIComponent(new URL(html.match(re)[1].replace(/&amp;/g, "&")).searchParams.get("token"));
await fetch(`${MOCK}/__reset`, { method: "POST" });

// ---------------------------------------------------------------- validation (both modes)
{
  const bad = await post("/api/programs/corporate-transition/apply", { answers: { ...answers("not-an-email", true), motivation: "short" }, website: "" });
  check("invalid answers are rejected with field errors and nothing is stored or sent", bad.status === 400 && !!bad.body.fieldErrors?.email && !!bad.body.fieldErrors?.motivation && (await fetch(`${MOCK}/__sent`).then((r) => r.json())).length === 0);
}

if (MODE === "production-mock") {
  // ------------------------------------------------------------ ticked box, new lead
  const email = addr("ticked");
  const r = await apply(email, true);
  eq("ticked: application accepted, confirmation email queued", [r.status, r.body.success, r.body.consentEmail], [200, true, "queued"]);
  let l = await lead(email);
  check("ticked: lead is PENDING and marketing is OFF", l.ongoing_content_opt_in === false && l.ongoing_content_opt_in_at === null && !!l.consent_requested_at);
  let c = await consents(l.id);
  eq("ticked: exactly one consent record, an opt_in_requested", c.map((x) => x.action), ["opt_in_requested"]);
  check("ticked: evidence has v2 wording, method checkbox, source and the exact text shown (label + footnote)", c[0].wording_version === V2 && c[0].method === "checkbox" && c[0].source_type === "program_application" && c[0].source_url === "/transition" && c[0].wording_text.includes("I understand I will get one email asking me to confirm") && c[0].wording_text.includes("unless you check the box and then confirm") && /^[0-9a-f]{32}$/.test(c[0].ip_hash ?? ""));
  const [a] = await apps(l.id);
  check("ticked: application records the confirmation email as queued", a.marketing_consent_requested === true && a.consent_email_status === "queued" && a.consent_email_error === null, JSON.stringify(a));
  const mails = await mailTo(email);
  check("ticked: the applicant received the application message AND exactly one confirmation email", mails.length === 2 && (await confirmation(email)).length === 1, JSON.stringify(mails.map((m) => m.subject)));
  const conf = await body((await confirmation(email))[0].id);
  check("ticked: confirmation email is not feature-specific and says nothing is sent unless confirmed", /Yes, confirm my email/.test(conf.html) && /only send those emails once you confirm/.test(conf.html) && !/guide|pdf|download/i.test(conf.html) && /Unsubscribe/.test(conf.html) && conf.headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click");
  check("ticked: links point at this deployment (not production)", conf.html.includes(`${BASE}/confirm?token=`) && conf.html.includes(`${BASE}/unsubscribe?token=`) && !conf.html.includes("modernbusinessarchitect.com"));
  check("ticked: the application email itself carries no confirm button", !(await body(mails.find((m) => m.subject !== "Please confirm your email address").id)).text.includes("/confirm?token="));

  // ------------------------------------------------------------ confirmation
  const token = linkIn(conf.html, /href="([^"]*\/confirm\?token=[^"]+)"/);
  const page = await fetch(`${BASE}/confirm?token=${encodeURIComponent(token)}`);
  check("confirm: opening the link shows a page and does NOT confirm", page.status === 200 && (await lead(email)).ongoing_content_opt_in === false);
  const ok = await post("/api/confirm", { token });
  eq("confirm: pressing confirm succeeds", [ok.status, ok.body.status], [200, "confirmed"]);
  l = await lead(email);
  check("confirm: marketing is now active with a timestamp", l.ongoing_content_opt_in === true && !!l.ongoing_content_opt_in_at);
  c = await consents(l.id);
  eq("confirm: history is request then confirmation (append-only)", c.map((x) => `${x.action}:${x.method}`), ["opt_in_requested:checkbox", "opt_in:email_confirmation"]);
  check("confirm: the confirmation references the request and keeps its wording and source", c[1].related_record_id === c[0].id && c[1].wording_version === V2 && c[1].wording_text === c[0].wording_text && c[1].source_type === "program_application");
  check("confirm: no guide analytics event was written", ((await sb.from("resource_events").select("id").eq("lead_id", l.id)).data ?? []).length === 0);
  // replay
  const again = await post("/api/confirm", { token });
  check("replay: the same link again is harmless ('already confirmed') and adds no consent record", again.status === 200 && again.body.status === "already_confirmed" && (await consents(l.id)).length === 2);
  eq("replay: a tampered token is rejected", (await post("/api/confirm", { token: token.slice(0, -3) + "AAA" })).status, 400);

  // ------------------------------------------------------------ unsubscribe after confirming
  const unsubToken = linkIn(conf.html, /href="([^"]*\/unsubscribe\?token=[^"]+)"/);
  const page2 = await fetch(`${BASE}/unsubscribe?token=${encodeURIComponent(unsubToken)}`);
  check("unsubscribe: the page opens without unsubscribing", page2.status === 200 && (await lead(email)).ongoing_content_opt_in === true);
  const u = await post("/api/unsubscribe", { token: unsubToken });
  check("unsubscribe: works from the confirmation email's link", u.status === 200 && u.body.success === true);
  l = await lead(email);
  check("unsubscribe: opted out, history kept and an opt_out appended", l.ongoing_content_opt_in === false && !!l.ongoing_content_opt_out_at && (await consents(l.id)).map((x) => `${x.action}:${x.method}`).join() === "opt_in_requested:checkbox,opt_in:email_confirmation,opt_out:unsubscribe_link");

  // ------------------------------------------------------------ unsubscribe while still pending cancels the request
  const e2 = addr("cancel");
  await apply(e2, true);
  const conf2 = await body((await confirmation(e2))[0].id);
  const oldConfirm = linkIn(conf2.html, /href="([^"]*\/confirm\?token=[^"]+)"/);
  await post("/api/unsubscribe", { token: linkIn(conf2.html, /href="([^"]*\/unsubscribe\?token=[^"]+)"/) });
  const l2 = await lead(e2);
  check("pending + unsubscribe: the request is cancelled and recorded", l2.consent_requested_at === null && !!l2.ongoing_content_opt_out_at && (await consents(l2.id)).map((x) => x.action).join() === "opt_in_requested,opt_out");
  const stale = await post("/api/confirm", { token: oldConfirm });
  check("pending + unsubscribe: the old confirmation link can no longer subscribe them", stale.status === 409 && (await lead(e2)).ongoing_content_opt_in === false, JSON.stringify(stale));

  // ------------------------------------------------------------ unticked
  const e3 = addr("unticked");
  const un = await apply(e3, false);
  const l3 = await lead(e3);
  const [a3] = await apps(l3.id);
  check("unticked: application accepted, no consent email reported", un.status === 200 && un.body.consentEmail === null);
  check("unticked: no confirmation email, no consent record, lead not pending", (await confirmation(e3)).length === 0 && (await consents(l3.id)).length === 0 && l3.consent_requested_at === null && l3.ongoing_content_opt_in === false);
  check("unticked: application says no marketing requested and no confirmation email", a3.marketing_consent_requested === false && a3.marketing_consent_requested_at === null && a3.consent_email_status === "not_sent");
  check("unticked: the applicant still got their application message", (await mailTo(e3)).length === 1);

  // ------------------------------------------------------------ already a confirmed subscriber
  const e4 = addr("subscriber");
  const { data: sub } = await sb.from("leads").insert({ email: e4, first_name: "Existing", ongoing_content_opt_in: true, ongoing_content_opt_in_at: "2026-09-21T10:00:00Z" }).select().single();
  await sb.from("consent_records").insert({ lead_id: sub.id, action: "opt_in", wording_version: "legacy", method: "legacy", created_at: "2026-09-21T10:00:00Z" });
  const r4 = await apply(e4, true);
  const l4 = await lead(e4);
  check("already subscribed: no confirmation email and none reported", r4.body.consentEmail === null && (await confirmation(e4)).length === 0);
  check("already subscribed: original consent date and record preserved, nothing new recorded", new Date(l4.ongoing_content_opt_in_at).toISOString() === "2026-09-21T10:00:00.000Z" && (await consents(sub.id)).length === 1 && l4.consent_requested_at === null);

  // ------------------------------------------------------------ suppressed
  const e5 = addr("suppressed");
  const { data: sup } = await sb.from("leads").insert({ email: e5, first_name: "Suppressed", ongoing_content_opt_in: false, ongoing_content_opt_out_at: "2026-09-01T10:00:00Z", suppressed_at: "2026-09-02T10:00:00Z", suppression_reason: "spam_complaint" }).select().single();
  const r5 = await apply(e5, true);
  const l5 = await lead(e5);
  check("suppressed: application is still accepted, but no confirmation email and none reported", r5.status === 200 && r5.body.consentEmail === null && (await confirmation(e5)).length === 0);
  check("suppressed: never pending, never subscribed, no consent record created", l5.ongoing_content_opt_in === false && l5.consent_requested_at === null && (await consents(sup.id)).length === 0);
  eq("suppressed: a forged confirmation link cannot activate them", (await post("/api/confirm", { token: confirmToken(sup.id) })).status, 400);

  // ------------------------------------------------------------ retries and repeats
  const e6 = addr("retry");
  const first = await apply(e6, true);
  const retry = await apply(e6, true, { key: first.key });
  const l6 = await lead(e6);
  check("idempotent retry (same key): no second application, no second confirmation email, one consent record", retry.status === 200 && (await apps(l6.id)).length === 1 && (await confirmation(e6)).length === 1 && (await consents(l6.id)).length === 1 && retry.body.consentEmail === null);
  const second = await apply(e6, true);
  check("a second application within minutes does not send a second confirmation email or a second consent record", second.status === 200 && second.body.consentEmail === null && (await confirmation(e6)).length === 1 && (await consents(l6.id)).length === 1 && (await apps(l6.id)).length === 2);

  // ------------------------------------------------------------ the admin pages can render a pending application (server renders need no browser)
  check("no stray messages: every recipient is a .test address and the mock only ever received our own sends", (await fetch(`${MOCK}/__sent`).then((r) => r.json())).every((m) => m.to.every((t) => t.endsWith("@example.test"))));
}

if (MODE === "preview-disabled") {
  // Email is off by default outside production: the application must still be saved, and the page must say so truthfully.
  const email = addr("blocked");
  const r = await apply(email, true);
  eq("blocked email: the application is still accepted", [r.status, r.body.success], [200, true]);
  eq("blocked email: the response reports the confirmation email FAILED (never queued)", r.body.consentEmail, "failed");
  const l = await lead(email);
  const [a] = await apps(l.id);
  check("blocked email: application records failed with the policy reason", a.consent_email_status === "failed" && /disabled in this non-production environment/.test(a.consent_email_error ?? ""), a.consent_email_error);
  check("blocked email: the request is recorded as PENDING (explicit consent request), marketing stays off", l.ongoing_content_opt_in === false && !!l.consent_requested_at && (await consents(l.id)).map((x) => x.action).join() === "opt_in_requested");
  check("blocked email: nothing at all reached the mail provider", (await fetch(`${MOCK}/__sent`).then((r) => r.json())).length === 0);
  const un = await apply(addr("blocked-unticked"), false);
  check("blocked email, box unticked: no confirmation state is reported", un.status === 200 && un.body.consentEmail === null);
}

console.log(out.join("\n"));
const failed = out.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${out.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
