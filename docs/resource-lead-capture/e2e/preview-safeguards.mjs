// Runtime checks of the preview safeguards against a locally running app.
//   MODE=production-mock | preview-disabled | preview-enabled | preview-misconfigured | prod-database
// Needs: local Supabase (seeded), mock-resend.mjs, ADMIN_EMAIL, API_URL, SERVICE_ROLE_KEY.
import { createClient } from "../../../node_modules/@supabase/supabase-js/dist/index.mjs";
import { randomUUID } from "node:crypto";

const MODE = process.env.MODE;
const BASE = process.env.BASE ?? "http://localhost:3000";
const MOCK = "http://127.0.0.1:4010";
const ADMIN = process.env.ADMIN_EMAIL.toLowerCase();
const PROD_DOMAIN = "modernbusinessarchitect.com";
const GA_ID = "G-VWKDNXD9JD";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const out = [];
const check = (n, ok, d = "") => out.push(`${ok ? "PASS" : "FAIL"}  [${MODE}] ${n}${ok ? "" : "  -> " + d}`);
const run = Date.now().toString(36);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";
const ipBase = Math.floor(Math.random() * 200) + 20; let ipN = 0;
const ip = () => `10.${ipBase}.${ipN >> 8}.${(++ipN % 250) + 1}`;
const preview = MODE.startsWith("preview") || MODE === "prod-database";

process.on("unhandledRejection", (e) => { out.push(`FAIL  [${MODE}] script error: ${e?.message ?? e}`); console.log(out.join("\n")); process.exit(1); });

const mock = async () => (await fetch(`${MOCK}/__sent`).then((r) => r.json()));
const post = async (path, body) => { const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip(), "user-agent": UA }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const guideRequest = (email) => post("/api/resources/member-access", { email, slug: "build-the-bridge-first", ctaLocation: "top", consentVersion: "resource-guide-consent-v1.2", sessionId: randomUUID(), pagePath: "/resources/build-the-bridge-first", attribution: {}, website: "" });
const legacyRequest = (email) => post("/api/resources/request", { firstName: "Sam", email, resourceSlug: "other-guide", ongoingContentOptIn: false, website: "" });
const requestRow = async (email) => { const l = (await sb.from("leads").select("id").eq("email", email).maybeSingle()).data; return l ? (await sb.from("resource_requests").select("*").eq("lead_id", l.id).order("requested_at", { ascending: false }).limit(1).maybeSingle()).data : null; };
const sink = (l) => `delivered+${l}-${run}@resend.dev`; // nothing is ever sent: the mock records, or the policy blocks

if (MODE === "prod-database") {
  // The app is configured with the PRODUCTION project URL and a fake key. It must refuse before any data access.
  const home = await fetch(`${BASE}/resources/build-the-bridge-first`);
  const text = await home.text();
  check("a resource page cannot be served: the data layer refuses", home.status === 500 || /error/i.test(text) && !/Build the bridge/i.test(text), `status ${home.status}`);
  check("no guide content leaked from anywhere", !text.includes('id="page-2"'));
  const admin = await fetch(`${BASE}/admin/guides`, { redirect: "manual" });
  check("admin routes answer 503 'not connected to an isolated database'", admin.status === 503 && /isolated database/.test(await admin.text()), `status ${admin.status}`);
  const adminApi = await fetch(`${BASE}/api/admin/leads/export?kind=all`);
  check("admin API answers 503 as well", adminApi.status === 503);
  const form = await guideRequest(sink("proddb"));
  check("a form submission fails (500) and sends nothing", form.status === 500 && (await mock()).length === 0, JSON.stringify(form.body));
  const events = await post("/api/resources/events", { event: "resource_page_view", slug: "build-the-bridge-first", sessionId: randomUUID() });
  check("analytics events cannot write either", events.status >= 400, String(events.status));
  console.log(out.join("\n"));
  process.exit(out.some((x) => x.startsWith("FAIL")) ? 1 : 0);
}

// ---------------------------------------------------------------- indexing, analytics, sitemap
const page = await fetch(`${BASE}/resources/build-the-bridge-first`, { headers: { "user-agent": UA } });
const html = await page.text();
const home = await fetch(`${BASE}/`, { headers: { "user-agent": UA } });
const homeHtml = await home.text();
const robotsTxt = await (await fetch(`${BASE}/robots.txt`)).text();
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const headerOn = async (path, init) => (await fetch(BASE + path, { redirect: "manual", ...init })).headers.get("x-robots-tag");

if (preview) {
  for (const path of ["/", "/resources/build-the-bridge-first", "/privacy", "/unsubscribe", "/confirm", "/admin", "/admin/guides", "/robots.txt", "/sitemap.xml", "/llms.txt", "/api/resources/events", "/api/resources/download"]) {
    check(`X-Robots-Tag: noindex, nofollow on ${path}`, (await headerOn(path)) === "noindex, nofollow", String(await headerOn(path)));
  }
  check("X-Robots-Tag also on POST responses", (await fetch(BASE + "/api/resources/events", { method: "POST", body: "{}" })).headers.get("x-robots-tag") === "noindex, nofollow");
  check("resource page renders a robots meta tag with noindex, nofollow", /<meta name="robots" content="noindex, nofollow"\/?>/.test(html), (html.match(/<meta name="robots"[^>]*>/g) ?? []).join(" "));
  check("home page renders the same robots meta", /<meta name="robots" content="noindex, nofollow"\/?>/.test(homeHtml));
  check("no page asks to be indexed (no 'index, follow' meta)", !/<meta name="robots" content="index/.test(html) && !/<meta name="robots" content="index/.test(homeHtml));
  check("robots.txt disallows everything and advertises no sitemap", /User-Agent: \*\s+Disallow: \//i.test(robotsTxt) && !/Sitemap:/i.test(robotsTxt) && !/Allow: \//.test(robotsTxt), robotsTxt);
  check("sitemap is empty", !/<url>/.test(sitemap), sitemap.slice(0, 200));
  check("Google Analytics is not loaded (no gtag script, no measurement id) on any checked page", ![html, homeHtml].some((h) => h.includes("googletagmanager.com") || h.includes(GA_ID)));
} else {
  check("production: no X-Robots-Tag header", (await headerOn("/")) === null && (await headerOn("/resources/build-the-bridge-first")) === null);
  check("production: pages ask to be indexed", /<meta name="robots" content="index, follow"/.test(html), (html.match(/<meta name="robots"[^>]*>/g) ?? []).join(" "));
  check("production: robots.txt unchanged (allows, lists the sitemap)", /Allow: \//.test(robotsTxt) && /Sitemap:/i.test(robotsTxt));
  check("production: sitemap lists the guide", /build-the-bridge-first/.test(sitemap));
  check("production: Google Analytics loads", homeHtml.includes("googletagmanager.com") && homeHtml.includes(GA_ID));
}

// ---------------------------------------------------------------- links: every operational link is environment-aware
const legacy = await legacyRequest(sink("legacy"));
check("legacy form returns a download link on THIS deployment, not on production", legacy.status === 200 && legacy.body.downloadUrl?.startsWith(`${BASE}/api/resources/download?token=`) && !legacy.body.downloadUrl.includes(PROD_DOMAIN), legacy.body.downloadUrl);

// ---------------------------------------------------------------- email policy
// Member access: the form sends a CONFIRMATION email (no download exists before confirmation), so the email policy decides
// whether the request can be honoured: allowed -> neutral "check your inbox"; refused -> an honest error (502).
await fetch(`${MOCK}/__reset`, { method: "POST" });
const asAdmin = await guideRequest(ADMIN);
const asOther = await guideRequest(sink("other"));
const rowAdmin = await requestRow(ADMIN);
const rowOther = await requestRow(sink("other"));
const messages = await mock();
const NEUTRAL = JSON.stringify({ success: true, state: "check_inbox" });

check("no response ever carries a download URL, in any mode", ![asAdmin, asOther].some((r) => /download|token|http/i.test(JSON.stringify(r.body))));
check("the request is stored LOCKED either way (nothing is unlocked before confirmation)", [rowAdmin, rowOther].every((r) => r && r.benefit_fulfilled_at === null));

if (MODE === "production-mock") {
  check("production policy: both recipients are accepted with the same neutral answer", [asAdmin, asOther].every((r) => r.status === 200 && JSON.stringify(r.body) === NEUTRAL), JSON.stringify([asAdmin.body, asOther.body]));
  check("the mock received exactly the two confirmation messages", messages.length === 2 && messages.every((m) => /Confirm your email to unlock/.test(m.subject)) && messages.some((m) => m.to.includes(ADMIN)));
  const full = await fetch(`${MOCK}/emails/${rowOther.delivery_provider_id}`).then((r) => r.json());
  check("their links use APP_BASE_URL (confirm page + unsubscribe), contain no download link, and never point at production", full.html.includes(`${BASE}/confirm?token=`) && full.html.includes(`${BASE}/unsubscribe?token=`) && !full.html.includes("/api/resources/download") && !full.html.includes(PROD_DOMAIN), "");
}
// A repeat request (inside the 10-minute reuse window) must never claim an email was sent when it was not, and must never double-send.
const repeatOther = await guideRequest(sink("other"));
const repeatAdmin = await guideRequest(ADMIN);
const afterRepeat = await mock();

if (MODE === "preview-disabled") {
  check("email is OFF by default: both attempts are refused honestly (502), not 'check your inbox'", asAdmin.status === 502 && asOther.status === 502 && !asAdmin.body.success, `${asAdmin.status}/${asOther.status}`);
  check("a repeat request after a blocked email is refused again (never a false 'sent')", repeatAdmin.status === 502 && repeatOther.status === 502);
  check("...and exactly one request row exists per address (the retry re-used it)", (await sb.from("resource_requests").select("id").eq("lead_id", (await sb.from("leads").select("id").eq("email", ADMIN).single()).data.id)).data.length === 1);
  check("not even the admin address receives anything", messages.length === 0, JSON.stringify(messages));
  check("the reason is recorded truthfully on the request", rowAdmin?.delivery_status === "failed" && /disabled in this non-production environment/.test(rowAdmin.delivery_error ?? ""), rowAdmin?.delivery_error);
  check("the failed event is recorded and no 'queued' event exists", (await sb.from("resource_events").select("event_name").eq("request_id", rowAdmin.id)).data.every((e) => e.event_name !== "resource_delivery_queued"));
}
if (MODE === "preview-enabled") {
  check("the admin address is delivered to (neutral answer, queued with the provider)", asAdmin.status === 200 && JSON.stringify(asAdmin.body) === NEUTRAL && rowAdmin.delivery_status === "queued", `${asAdmin.status} ${rowAdmin.delivery_status}`);
  check("repeat for the admin: same neutral answer and NO second message", repeatAdmin.status === 200 && JSON.stringify(repeatAdmin.body) === NEUTRAL && afterRepeat.length === 1, `${repeatAdmin.status}, mock=${afterRepeat.length}`);
  check("any other recipient is refused, truthfully (502 + recorded reason), and still nothing is sent", asOther.status === 502 && repeatOther.status === 502 && /not on this environment's allowlist/.test(rowOther?.delivery_error ?? ""), rowOther?.delivery_error);
  check("the mock saw exactly ONE message, addressed to ADMIN_EMAIL only", messages.length === 1 && messages[0].to.length === 1 && messages[0].to[0].toLowerCase() === ADMIN, JSON.stringify(messages.map((m) => m.to)));
  const full = await fetch(`${MOCK}/emails/${rowAdmin.delivery_provider_id}`).then((r) => r.json());
  check("the admin email's links point at this deployment (confirm, unsubscribe), never production, and contain no download link", full.html.includes(`${BASE}/confirm?token=`) && full.html.includes(`${BASE}/unsubscribe?token=`) && !full.html.includes("/api/resources/download") && !full.html.includes(PROD_DOMAIN));
}
if (MODE === "preview-misconfigured") {
  check("requests stay refused and nothing is sent", asAdmin.status === 502 && asOther.status === 502 && repeatAdmin.status === 502 && afterRepeat.length === 0);
  check("an allowlist containing anyone but ADMIN_EMAIL disables email entirely, and the error says so", /may contain only the authorised admin address/.test(rowAdmin?.delivery_error ?? "") && messages.length === 0, rowAdmin?.delivery_error);
}

// ---------------------------------------------------------------- the other email-sending routes obey the same policy
if (preview) {
  await fetch(`${MOCK}/__reset`, { method: "POST" });
  await legacyRequest(sink("legacy2"));                                       // legacy resource form
  await post("/api/qualify", { name: "Test", email: sink("qualify"), situation: "x", message: "y" }); // contact form (mails Martin + the visitor)
  await post("/api/pick-my-brain/ask", { question: "Does the policy cover this route?", name: "Test", email: sink("pmb"), pagePath: "/answers" }); // Ask Martin (mails Martin)
  const napkinInputs = { businessName: "T", businessStage: "idea", whatItSells: "Coffee", currency: "USD", transactionSingular: "cup", transactionPlural: "cups", sellingPrice: 4, directCostItems: [{ id: "b", label: "Beans", amount: 1 }], monthlyCostItems: [{ id: "r", label: "Rent", amount: 1000 }], tradingDaysPerMonth: 25, openingHoursPerDay: 8, capacityUnits: 1, capacityUnitLabel: "location", expectedMonthlyVolume: 500, maxMonthlyCapacity: 800, seasonality: "not_seasonal", reachability: "yes_clearly", priceConfidence: "supported", directCostConfidence: "supported", monthlyCostConfidence: "supported", volumeEvidence: "x" };
  const submission = await post("/api/napkin/submit", { inputs: napkinInputs, attribution: {} });
  await post("/api/napkin/join", { submissionId: submission.body.submissionId, firstName: "Alex", email: sink("napkin"), website: "" }); // Napkin breakdown email
  const leaked = (await mock()).filter((m) => m.to.some((t) => t.toLowerCase() !== ADMIN));
  check("legacy form, contact form, Ask Martin and Napkin: no message reaches anyone but ADMIN_EMAIL", leaked.length === 0, JSON.stringify(leaked.map((m) => [m.subject, m.to])));
  if (MODE !== "preview-enabled") check("...and in this mode nothing at all is sent", (await mock()).length === 0);
}

console.log(out.join("\n"));
const failed = out.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${out.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
