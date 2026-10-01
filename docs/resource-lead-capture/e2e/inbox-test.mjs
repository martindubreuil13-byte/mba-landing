// Controlled inbox test: ONE email, to the authorised admin address only. Local app + local DB.
// Needs ADMIN_EMAIL, RESEND_API_KEY, LOCAL_ADMIN_PASSWORD, API_URL, SERVICE_ROLE_KEY in the environment.
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import { chromium } from "playwright-core";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
const BASE = "http://localhost:3000";
const TO = process.env.ADMIN_EMAIL.toLowerCase();
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const out = []; const rec = (n, ok, d = "") => { out.push(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  [" + d + "]" : ""}`); };
const started = new Date(Date.now() - 2000).toISOString();
const resend = (path) => fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }).then((r) => r.json());
const lead = async () => (await sb.from("leads").select("*").eq("email", TO).maybeSingle()).data;
const consents = async (id) => (await sb.from("consent_records").select("*").eq("lead_id", id).order("created_at")).data;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// --- send exactly one request, as the form would
const session = randomUUID();
const res = await fetch(`${BASE}/api/resources/printable-guide`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.123.7.7", "user-agent": UA }, body: JSON.stringify({ email: TO, slug: "build-the-bridge-first", ctaLocation: "top", consentVersion: "resource-guide-consent-v1.1", sessionId: session, pagePath: "/resources/build-the-bridge-first", attribution: { source: "inbox-test" }, website: "" }) });
const body = await res.json();
rec("request accepted, guide link returned, email queued", res.status === 200 && body.emailStatus === "queued" && body.consent === "pending_confirmation", JSON.stringify(body));
let l = await lead();
const rq = (await sb.from("resource_requests").select("*").eq("lead_id", l.id).single()).data;
await new Promise((r) => setTimeout(r, 4000));
const mail = await resend(`/emails/${rq.delivery_provider_id}`);
fs.writeFileSync("inbox-email.html", mail.html);

// 1. subject / sender / preview text / formatting
const preview = mail.html.match(/display:none[^>]*>([^<]+)</)?.[1];
rec("1a subject", mail.subject === "Your guide is ready: Build the Bridge First", mail.subject);
rec("1b sender name + address", mail.from === "Martin Dubreuil <martin@mindrasolutions.com>", mail.from);
rec("1c preview text (hidden preheader)", /Your printable copy of Build The Bridge First/.test(preview ?? ""), preview);
rec("1d provider reports delivered to the inbox", mail.last_event === "delivered", mail.last_event);
rec("1e has sender identification, privacy and unsubscribe, plain-text twin", /Sent by Martin Dubreuil/.test(mail.html) && /Unsubscribe/.test(mail.html) && /Privacy Policy/.test(mail.html) && !!mail.text, "");
const links = { download: mail.html.match(/href="([^"]*\/api\/resources\/download[^"]*)"/)[1].replace(/&amp;/g, "&"), confirm: mail.html.match(/href="([^"]*\/confirm\?token=[^"]+)"/)?.[1]?.replace(/&amp;/g, "&"), unsub: mail.html.match(/href="([^"]*\/unsubscribe\?token=[^"]+)"/)?.[1]?.replace(/&amp;/g, "&") };
rec("1f email contains download, confirm and unsubscribe links", !!(links.download && links.confirm && links.unsub));
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
for (const [n, w] of [["desktop", 700], ["mobile", 390]]) { const p = await (await b.newContext({ viewport: { width: w, height: 800 } })).newPage(); await p.setContent(mail.html); await p.screenshot({ path: `shots/inbox-email-${n}.png`, fullPage: true }); }

// 2. guide download works from the email link
const dl = await fetch(links.download, { redirect: "manual" });
const file = await fetch(dl.headers.get("location"));
const same = Buffer.from(await file.arrayBuffer()).equals(fs.readFileSync("/Users/martin/Documents/The Modern Business Architect (MBA)/Lead Magnets/Build-the-Bridge-First-FINAL-corrected.pdf"));
rec("2 email download link serves the corrected PDF (attachment)", dl.status === 307 && same && /attachment/.test(file.headers.get("content-disposition") ?? ""));

// 3 + 4. the confirm button opens the page but does not confirm
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, userAgent: UA });
const page = await ctx.newPage();
await page.goto(links.confirm, { waitUntil: "networkidle" });
rec("3a confirm link opens the confirmation page", await page.getByRole("heading", { name: /Join the Modern Business Architect community/ }).isVisible() && await page.getByRole("button", { name: /confirm my email/i }).isVisible());
await page.screenshot({ path: "shots/inbox-confirm-1-before.png" });
l = await lead();
rec("3b opening the page did NOT confirm", l.ongoing_content_opt_in === false && !l.ongoing_content_opt_in_at);
// admin session for UI checks
const admin = await b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
const ap = await admin.newPage();
await ap.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await ap.getByLabel("Email").fill(process.env.ADMIN_EMAIL); await ap.getByLabel("Password").fill(process.env.LOCAL_ADMIN_PASSWORD); // password of the throwaway LOCAL admin user (see seed.mjs); never a real credential
await ap.getByRole("button", { name: /sign in|log in/i }).click(); await ap.waitForURL(/\/admin\/resources/);
const exportCsv = async (kind) => (await ap.request.get(`${BASE}/api/admin/leads/export?kind=${kind}`)).text();
await ap.goto(`${BASE}/admin/leads?query=${encodeURIComponent(TO.split("@")[0])}`, { waitUntil: "networkidle" });
const rowText = await ap.locator("tbody tr").first().innerText();
rec("4a admin Leads shows the lead as 'Awaiting confirmation'", /Awaiting confirmation/.test(rowText), rowText.replace(/\s+/g, " ").slice(0, 120));
await ap.screenshot({ path: "shots/inbox-admin-1-pending.png" });
rec("4b lead is not in the subscribers export yet", !(await exportCsv("subscribers")).toLowerCase().includes(TO));
await ap.goto(`${BASE}/admin/guides/build-the-bridge-first`, { waitUntil: "networkidle" });
const guideRow = async (label) => Number((await ap.locator("tr", { has: ap.getByRole("rowheader", { name: label, exact: true }) }).first().locator("td").first().innerText()).trim());
const confirmedBefore = await guideRow("Confirmed community members");
rec("4c admin guide page lists the request with consent 'Pending'", /Pending/.test(await ap.locator("tr", { has: ap.getByRole("link", { name: TO }) }).first().innerText()));

// 5. click confirm
await page.getByRole("button", { name: /confirm my email/i }).click();
await page.getByRole("status").waitFor();
await page.screenshot({ path: "shots/inbox-confirm-2-after.png" });
l = await lead();
const c = await consents(l.id);
rec("5a marketing activated after the click", l.ongoing_content_opt_in === true && !!l.ongoing_content_opt_in_at);
rec("5b history = request then linked confirmation", c.map((x) => `${x.action}:${x.method}`).join() === "opt_in_requested:button_disclosure,opt_in:email_confirmation");
rec("5c confirmation row references the request and keeps its wording/source", c[1].related_record_id === c[0].id && c[1].wording_version === "resource-guide-consent-v1.1" && c[1].wording_text === c[0].wording_text && c[1].source_type === "guide" && c[1].cta_location === "top" && /^[0-9a-f]{32}$/.test(c[1].ip_hash));

// 6. export + funnel
rec("6a lead now appears in the subscribers export", (await exportCsv("subscribers")).toLowerCase().includes(TO));
await ap.goto(`${BASE}/admin/guides/build-the-bridge-first`, { waitUntil: "networkidle" });
const confirmedAfter = await guideRow("Confirmed community members");
rec("6b funnel 'Confirmed community members' increased by 1", confirmedAfter === confirmedBefore + 1, `${confirmedBefore} -> ${confirmedAfter}`);
rec("6c lead row shows consent 'Opted in'", /Opted in/.test(await ap.locator("tr", { has: ap.getByRole("link", { name: TO }) }).first().innerText()));
await ap.screenshot({ path: "shots/inbox-admin-2-funnel.png", fullPage: true });

// 7. replay
await page.goto(links.confirm, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /confirm my email/i }).click();
await page.getByRole("status").waitFor();
const replayText = await page.getByRole("status").innerText();
const api = await fetch(`${BASE}/api/confirm`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.123.7.8" }, body: JSON.stringify({ token: new URL(links.confirm).searchParams.get("token") }) }).then((r) => r.json());
const c2 = await consents(l.id);
rec("7 replaying the link says 'already confirmed' and adds no consent record", /already confirmed/.test(replayText) && api.status === "already_confirmed" && c2.length === 2 && (await sb.from("resource_events").select("id").eq("lead_id", l.id).eq("event_name", "resource_opt_in_confirmed")).data.length === 1, replayText);

// 8. unsubscribe from the received email
await page.goto(links.unsub, { waitUntil: "networkidle" });
rec("8a unsubscribe page opens without unsubscribing", (await lead()).ongoing_content_opt_in === true && await page.getByRole("button", { name: /unsubscribe me/i }).isVisible());
await page.screenshot({ path: "shots/inbox-unsub-1-page.png" });
await page.getByRole("button", { name: /unsubscribe me/i }).click();
await page.getByRole("status").waitFor();
await page.screenshot({ path: "shots/inbox-unsub-2-done.png" });
l = await lead();
const c3 = await consents(l.id);
rec("8b unsubscribed: flag off, opt-out time set, history kept + opt_out appended", l.ongoing_content_opt_in === false && !!l.ongoing_content_opt_out_at && c3.map((x) => x.action).join() === "opt_in_requested,opt_in,opt_out" && c3[2].method === "unsubscribe_link");
rec("8c lead leaves the subscribers export; guide link still works", !(await exportCsv("subscribers")).toLowerCase().includes(TO) && (await fetch(links.download, { redirect: "manual" })).status === 307);
rec("8d the confirm link no longer reactivates marketing after unsubscribing", (await fetch(`${BASE}/api/confirm`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.123.7.9" }, body: JSON.stringify({ token: new URL(links.confirm).searchParams.get("token") }) })).status === 409 && (await lead()).ongoing_content_opt_in === false);

// 9. nobody else was emailed
const sent = (await sb.from("resource_requests").select("id, delivery_provider_id, lead_id").gte("requested_at", started)).data;
rec("9a only one request/email was created by this test", sent.length === 1 && sent[0].lead_id === l.id, String(sent.length));
const list = await resend(`/emails?limit=20`);
const mine = (list.data ?? []).filter((e) => new Date(e.created_at) >= new Date(started));
rec("9b provider log in the test window shows only the admin address", mine.length > 0 && mine.every((e) => e.to.every((t) => t.toLowerCase() === TO)), JSON.stringify(mine.map((e) => e.to)));
rec("9c no other lead or address was created", (await sb.from("leads").select("id").gte("created_at", started)).data.length === 1);
await b.close();
console.log(out.join("\n"));
const failed = out.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${out.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
