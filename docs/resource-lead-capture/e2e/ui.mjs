import { chromium } from "playwright-core";
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import fs from "node:fs";

// Needs LOCAL_ADMIN_PASSWORD (the throwaway local admin user created by seed.mjs) in the environment.
if (!process.env.LOCAL_ADMIN_PASSWORD) throw new Error("Set LOCAL_ADMIN_PASSWORD (a throwaway value for the LOCAL admin user).");
// Which email mode the app under test is in. "sent": email delivery works (production policy or an allowlisted
// preview, against the local mock). "not-sent": email is disabled or blocked, so the accurate fallback copy is expected.
const EXPECT_SENT = process.env.EXPECT_EMAIL !== "not-sent";
const COPY_SENT = "I have also sent a copy to your inbox. If the download does not begin, use the button below.";
const COPY_NOT_SENT = "I could not send the email copy just now, so keep this page open. If the download does not begin, use the button below.";
const CONFIRM_NOTE = /To start receiving community emails, confirm your address from the link in that email/;
const BASE = "http://localhost:3000";
const URL = `${BASE}/resources/build-the-bridge-first`;
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const results = [];
const check = (n, ok, d = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : "  -> " + d}`);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const sizes = { desktop: [1280, 900], tablet: [820, 1180], mobile: [390, 844] };

async function newPage(size, { acceptDownloads = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] }, acceptDownloads, deviceScaleFactor: 1, userAgent: UA });
  const page = await ctx.newPage();
  return { ctx, page };
}
const lastLead = async (email) => (await sb.from("leads").select("*").eq("email", email).maybeSingle()).data;

for (const [name, size] of Object.entries(sizes)) {
  const { ctx, page } = await newPage(size);
  await page.goto(URL, { waitUntil: "networkidle" });

  check(`[${name}] no horizontal scroll on load`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: `shots/${name}-01-top.png` });

  // ---- CTA 1 (top): keyboard operable
  const topCta = page.locator('[data-cta-location="top"]');
  await topCta.getByRole("button", { name: /get the printable guide/i }).focus();
  await page.keyboard.press("Enter");
  const emailInput = topCta.getByLabel("Email address");
  await emailInput.waitFor();
  check(`[${name}] top CTA opens the form and focuses the email field`, await emailInput.evaluate((el) => el === document.activeElement));
  check(`[${name}] form shows the agreed copy`, await topCta.getByText("Receive the complete PDF to download, print, complete and keep.").isVisible() && await topCta.getByText(/We’ll email your guide and invite you to confirm whether you’d like to join the Modern Business Architect community\./).isVisible());
  const btn = topCta.getByRole("button", { name: /email me the printable guide/i });
  check(`[${name}] button states both actions`, await btn.isVisible());
  const disclosure = topCta.getByText(/The confirmation invitation is optional\. Marketing emails begin only if you actively confirm\. You can keep the guide either way and unsubscribe at any time\./);
  check(`[${name}] consent disclosure visible beside the form`, await disclosure.isVisible());
  check(`[${name}] privacy policy linked`, (await topCta.getByRole("link", { name: "Privacy Policy" }).getAttribute("href")) === "/privacy");
  check(`[${name}] no checkbox anywhere in the form`, (await topCta.locator('input[type="checkbox"]').count()) === 0);
  check(`[${name}] no password / account field`, (await topCta.locator('input[type="password"]').count()) === 0);
  await page.screenshot({ path: `shots/${name}-02-form.png` });

  // ---- validation: keyboard submit with a bad email
  await emailInput.fill("not-an-email");
  await page.keyboard.press("Enter");
  const alert = topCta.getByRole("alert").filter({ hasText: "@" });
  await alert.waitFor();
  check(`[${name}] bad email shows a helpful inline error`, /missing an “@”/.test(await alert.innerText()));
  check(`[${name}] field marked invalid + focus stays on it`, (await emailInput.getAttribute("aria-invalid")) === "true" && (await emailInput.evaluate((el) => el === document.activeElement)));
  await page.screenshot({ path: `shots/${name}-03-error.png` });

  // ---- valid submit with keyboard; the download should start by itself
  const email = `delivered+ui-${name}-${run}@resend.dev`;
  await emailInput.fill(email);
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.keyboard.press("Enter")]);
  check(`[${name}] download starts immediately after submit`, download.suggestedFilename() === "Build-the-Bridge-First-FINAL.pdf", download.suggestedFilename());
  const path = await download.path();
  check(`[${name}] downloaded file is the accepted PDF`, fs.readFileSync(path).equals(fs.readFileSync("/Users/martin/Documents/The Modern Business Architect (MBA)/Lead Magnets/Build-the-Bridge-First-FINAL-corrected.pdf")));
  const heading = topCta.getByRole("heading", { name: "Your printable guide is downloading." });
  await heading.waitFor();
  const shown = EXPECT_SENT ? COPY_SENT : COPY_NOT_SENT;
  const notShown = EXPECT_SENT ? COPY_NOT_SENT : COPY_SENT;
  check(`[${name}] success heading has focus and the ${EXPECT_SENT ? "email-sent" : "email-not-sent fallback"} copy is shown`, await heading.evaluate((el) => el === document.activeElement) && await topCta.getByText(shown).isVisible());
  check(`[${name}] the other mode's copy is NOT shown`, (await topCta.getByText(notShown).count()) === 0);
  const backup = topCta.getByRole("link", { name: /download the pdf/i });
  check(`[${name}] backup download button present`, await backup.isVisible());
  await page.screenshot({ path: `shots/${name}-04-success.png` });
  const [d2] = await Promise.all([page.waitForEvent("download"), backup.click()]);
  check(`[${name}] backup button downloads again`, d2.suggestedFilename().endsWith(".pdf"));
  check(`[${name}] other CTAs now offer the download instead of the form`, (await page.locator('[data-cta-location="end"]').getByText("You already have the printable guide.").count()) === 1);

  const lead = await lastLead(email);
  const c = (await sb.from("consent_records").select("*").eq("lead_id", lead.id)).data;
  check(`[${name}] DB: lead + consent REQUEST (pending, marketing off) with CTA 'top'`, lead?.ongoing_content_opt_in === false && !!lead.consent_requested_at && c.length === 1 && c[0].action === "opt_in_requested" && c[0].cta_location === "top" && c[0].method === "button_disclosure");
  const rqRow = (await sb.from("resource_requests").select("delivery_status, delivery_error, download_count").eq("lead_id", lead.id).limit(1).single()).data;
  check(`[${name}] DB: delivery_status is '${EXPECT_SENT ? "queued" : "failed"}' (truthful), and the download was counted`, rqRow.delivery_status === (EXPECT_SENT ? "queued" : "failed") && rqRow.download_count >= 1 && (EXPECT_SENT || !!rqRow.delivery_error), JSON.stringify(rqRow));
  check(`[${name}] the confirm-your-address note is ${EXPECT_SENT ? "shown (the email carries the link)" : "NOT shown (no email was sent, so there is no link to confirm)"}`, (await topCta.getByText(CONFIRM_NOTE).count()) === (EXPECT_SENT ? 1 : 0));
  const sessionEvents = (await sb.from("resource_events").select("event_name, cta_location").eq("lead_id", lead.id)).data.map((e) => `${e.event_name}:${e.cta_location ?? ""}`);
  check(`[${name}] DB: page view, CTA click and form open recorded and linked to the lead`, ["resource_page_view:", "resource_cta_clicked:top", "resource_form_opened:top", "resource_form_submitted:top"].every((e) => sessionEvents.includes(e)), sessionEvents.join(","));
  await ctx.close();
}

// ---- CTA 2 and CTA 3 each open the same form and attribute correctly (desktop)
for (const loc of ["mid-guide", "end"]) {
  const { ctx, page } = await newPage(sizes.desktop);
  await page.goto(URL, { waitUntil: "networkidle" });
  const cta = page.locator(`[data-cta-location="${loc}"]`);
  await cta.scrollIntoViewIfNeeded();
  if (loc === "mid-guide") await page.screenshot({ path: "shots/desktop-05-mid-cta.png" });
  if (loc === "end") await page.screenshot({ path: "shots/desktop-06-end-cta.png" });
  await cta.getByRole("button", { name: /get the printable guide/i }).click();
  await cta.getByLabel("Email address").waitFor();
  check(`[${loc}] CTA opens the SAME form component (one form on page)`, (await page.locator("[data-cta-location] form").count()) === 1 && await cta.getByRole("button", { name: /email me the printable guide/i }).isVisible());
  const email = `delivered+ui-${loc}-${run}@resend.dev`;
  await cta.getByLabel("Email address").fill(email);
  const [dl] = await Promise.all([page.waitForEvent("download"), cta.getByRole("button", { name: /email me the printable guide/i }).click()]);
  check(`[${loc}] download starts`, dl.suggestedFilename().endsWith(".pdf"));
  await cta.getByRole("heading", { name: "Your printable guide is downloading." }).waitFor();
  const lead = await lastLead(email);
  const rq = (await sb.from("resource_requests").select("cta_location, source_page_url").eq("lead_id", lead.id).single()).data;
  check(`[${loc}] DB attributes the request to '${loc}'`, rq.cta_location === loc && rq.source_page_url === "/resources/build-the-bridge-first", JSON.stringify(rq));
  await ctx.close();
}

// ---- read online link, anchor, and reading analytics (incl. 60s guard)
{
  const { ctx, page } = await newPage(sizes.desktop);
  await page.goto(URL, { waitUntil: "networkidle" });
  const sessionId = await page.evaluate(() => sessionStorage.getItem("mba_resource_session"));
  await page.getByRole("link", { name: "Read online" }).click();
  await page.waitForTimeout(600);
  check("READ ONLINE moves to the guide", await page.evaluate(() => location.hash === "#guide"));
  const eventsFor = async () => (await sb.from("resource_events").select("event_name").eq("session_id", sessionId)).data.map((e) => e.event_name);
  await page.locator("#page-2").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  check("scrolling into the guide records read_started", (await eventsFor()).includes("resource_read_started"));
  await page.locator("#page-9").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  check("jumping to the end quickly does NOT yet record read_completed (60s guard)", !(await eventsFor()).includes("resource_read_completed"));
  await page.waitForTimeout(62000);
  check("after 60s on the guide, reaching the end records read_completed", (await eventsFor()).includes("resource_read_completed"));
  const names = await eventsFor();
  check("page view recorded once", names.filter((n) => n === "resource_page_view").length === 1);
  await ctx.close();
}

// ---- Global Privacy Control: no analytics events
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }));
  const page = await ctx.newPage();
  let posted = 0;
  page.on("request", (r) => { if (r.url().includes("/api/resources/events")) posted++; });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator("#page-9").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  check("Global Privacy Control: no analytics requests are sent", posted === 0, String(posted));
  await ctx.close();
}

// ---- guide pages visual + overflow at each size
for (const [name, size] of Object.entries(sizes)) {
  const { ctx, page } = await newPage(size);
  await page.goto(URL, { waitUntil: "networkidle" });
  for (const id of ["page-3", "page-4", "page-7", "page-9"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await page.locator(`#${id}`).screenshot({ path: `shots/${name}-guide-${id}.png` });
  }
  check(`[${name}] no horizontal page scroll after scrolling the whole guide`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: `shots/${name}-full.png`, fullPage: true });
  await ctx.close();
}

// ---- admin
{
  const { ctx, page } = await newPage(sizes.desktop);
  await page.goto(`${BASE}/admin/guides`, { waitUntil: "networkidle" });
  check("signed-out visitor is sent to the admin login", /\/admin$/.test(page.url()));
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL);
  await page.getByLabel("Password").fill(process.env.LOCAL_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/admin\/resources/, { timeout: 15000 });
  await page.getByRole("link", { name: "Guides" }).click();
  await page.waitForURL(/\/admin\/guides$/);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "shots/admin-01-guides.png", fullPage: true });
  await page.getByRole("link", { name: "Build The Bridge First" }).click();
  await page.waitForURL(/admin\/guides\/build-the-bridge-first/);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "shots/admin-02-detail.png", fullPage: true });

  // reconcile displayed counts with the stored events (30-day default range)
  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) + "T00:00:00Z";
  const resource = (await sb.from("resources").select("id").eq("slug", "build-the-bridge-first").single()).data;
  const evs = (await sb.from("resource_events").select("event_name, session_id, metadata").eq("resource_id", resource.id).gte("created_at", since).limit(5000)).data;
  const count = (n) => evs.filter((e) => e.event_name === n).length;
  const sessions = new Set(evs.filter((e) => e.event_name === "resource_page_view" && e.session_id).map((e) => e.session_id)).size;
  const valid = evs.filter((e) => e.event_name === "resource_form_submitted" && ["pending_confirmation", "existing"].includes(e.metadata?.consent)).length;
  const row = async (label) => Number((await page.locator("tr", { has: page.getByRole("rowheader", { name: label, exact: true }) }).first().locator("td").first().innerText()).trim());
  check("admin 'Page views' equals stored events", (await row("Page views")) === count("resource_page_view"), `${await row("Page views")} vs ${count("resource_page_view")}`);
  check("admin 'Browser sessions' equals distinct stored sessions", (await row("Browser sessions")) === sessions);
  check("admin never labels sessions as unique visitors", !/unique visitors?(?! or people)/i.test(await page.locator("main").innerText().then((t) => t.replace(/Not unique visitors or people/g, ""))));
  check("admin shows confirmed members + sign-up→confirmed rate", (await row("Confirmed community members")) >= 0 && (await page.getByRole("rowheader", { name: "Sign-up → confirmed" }).count()) === 1);
  check("admin 'Form submissions' equals stored events", (await row("Form submissions")) === count("resource_form_submitted"));
  check("admin 'Valid opt-ins' equals recorded+existing", (await row("Valid opt-ins")) === valid);
  check("admin 'PDF download starts' equals stored events", (await row("PDF download starts")) === count("resource_download_started"));
  check("admin 'Printable-guide CTA clicks' equals stored events", (await row("Printable-guide CTA clicks")) === count("resource_cta_clicked"));
  const rateText = await page.locator("tr", { has: page.getByRole("rowheader", { name: "View → opt-in" }) }).locator("td").first().innerText();
  check("admin View → opt-in = valid opt-ins ÷ sessions", rateText.trim() === `${((valid / sessions) * 100).toFixed(1)}%`, `${rateText} vs ${((valid / sessions) * 100).toFixed(1)}%`);
  const leadLink = page.getByRole("link", { name: /@resend\.dev$/ }).first();
  const href = await leadLink.getAttribute("href");
  check("lead rows link to the central lead detail", /^\/admin\/leads\/[0-9a-f-]{36}$/.test(href), href);
  // date filters
  await page.getByRole("button", { name: "Last 7 days" }).click();
  await page.waitForLoadState("networkidle");
  check("7-day filter applied", (await page.getByText(/Showing .* \(UTC days\)/).innerText()).includes(new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)));
  await page.goto(`${BASE}/admin/guides/build-the-bridge-first?range=custom&from=2020-01-01&to=2020-01-31`, { waitUntil: "networkidle" });
  check("custom range with no data shows zeros and em-dash rates", (await row("Page views")) === 0 && /—/.test(await page.locator("tr", { has: page.getByRole("rowheader", { name: "View → opt-in" }) }).locator("td").first().innerText()));
  await page.goto(`${BASE}/admin/leads/${href.split("/").pop()}`, { waitUntil: "networkidle" });
  check("central lead detail opens from the guide list", (await page.getByText(/Subscription:/).count()) > 0);
  await page.screenshot({ path: "shots/admin-03-lead-detail.png", fullPage: true });
  await ctx.close();
}

// ---- confirm page (real UI) + admin lead pages for pending / suppressed leads
{
  const { createHmac } = await import("node:crypto");
  const sign = (p) => createHmac("sha256", process.env.SERVICE_ROLE_KEY).update(p).digest("base64url");
  const tokenFor = (id) => { const p = `c1.${id}.${Math.floor(Date.now() / 1000) + 86400}`; return `${p}.${sign(p)}`; };
  const email = `delivered+ui-confirm-${run}@resend.dev`;
  const { ctx: c0, page: p0 } = await newPage(sizes.desktop);
  await p0.goto(URL, { waitUntil: "networkidle" });
  await p0.locator('[data-cta-location="top"]').getByRole("button", { name: /get the printable guide/i }).click();
  await p0.getByLabel("Email address").fill(email);
  await Promise.all([p0.waitForEvent("download"), p0.getByRole("button", { name: /email me the printable guide/i }).click()]);
  await p0.getByRole("heading", { name: "Your printable guide is downloading." }).waitFor();
  await c0.close();
  const lead = await lastLead(email);
  const { ctx, page } = await newPage(sizes.desktop);
  await page.goto(`${BASE}/confirm?token=${encodeURIComponent(tokenFor(lead.id))}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "shots/confirm-01-page.png" });
  check("confirm page asks for a click, does not confirm on load", (await lastLead(email)).ongoing_content_opt_in === false && await page.getByRole("button", { name: /confirm my email/i }).isVisible());
  await page.getByRole("button", { name: /confirm my email/i }).click();
  await page.getByRole("status").waitFor();
  await page.screenshot({ path: "shots/confirm-02-done.png" });
  check("clicking confirm activates marketing and shows the confirmation", (await lastLead(email)).ongoing_content_opt_in === true && /You are confirmed/.test(await page.getByRole("status").innerText()));
  await page.goto(`${BASE}/confirm?token=garbage`, { waitUntil: "networkidle" });
  check("an invalid confirm link shows a clear message", await page.locator(`main [role="alert"]`).isVisible());

  // admin
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL);
  await page.getByLabel("Password").fill(process.env.LOCAL_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/admin\/resources/, { timeout: 15000 });
  await page.goto(`${BASE}/admin/leads?subscription=pending_confirmation`, { waitUntil: "networkidle" });
  const pendingRows = await page.locator("tbody tr").count();
  check("admin Leads can filter 'Awaiting confirmation' and lists pending leads only", pendingRows > 0 && (await page.locator("tbody tr").allInnerTexts()).every((t) => /Awaiting confirmation/.test(t)));
  await page.screenshot({ path: "shots/admin-05-leads-pending.png" });
  const subs = await page.goto(`${BASE}/admin/leads?subscription=subscribed`, { waitUntil: "networkidle" });
  check("pending leads are NOT in the subscribed audience", !(await page.locator("tbody tr").allInnerTexts()).some((t) => /Awaiting confirmation/.test(t)));
  const { data: pend } = await sb.from("leads").select("id").not("consent_requested_at", "is", null).eq("ongoing_content_opt_in", false).is("suppressed_at", null).limit(1);
  await page.goto(`${BASE}/admin/leads/${pend[0].id}`, { waitUntil: "networkidle" });
  check("central lead detail renders for a pending lead", /Awaiting confirmation/.test(await page.locator("main").innerText()));
  const { data: sup } = await sb.from("leads").select("id").not("suppressed_at", "is", null).limit(1);
  if (sup?.length) { await page.goto(`${BASE}/admin/leads/${sup[0].id}`, { waitUntil: "networkidle" }); check("central lead detail renders for a suppressed lead", /Suppressed/.test(await page.locator("main").innerText())); }
  const { data: pendEmail } = await sb.from("leads").select("email").eq("id", pend[0].id).single();
  const { data: subEmail } = await sb.from("leads").select("email").eq("ongoing_content_opt_in", true).limit(1).single();
  const exp = await page.request.get(`${BASE}/api/admin/leads/export?kind=subscribers`);
  const csv = await exp.text();
  check("subscriber export includes confirmed subscribers", exp.status() === 200 && csv.includes(subEmail.email));
  check("subscriber export excludes unconfirmed (pending) addresses", !csv.includes(pendEmail.email));
  if (sup?.length) { const { data: se } = await sb.from("leads").select("email").eq("id", sup[0].id).single(); check("subscriber export excludes suppressed addresses", !csv.includes(se.email)); }
  await ctx.close();
}

{
  const { ctx, page } = await newPage(sizes.mobile);
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL);
  await page.getByLabel("Password").fill(process.env.LOCAL_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/admin\/resources/, { timeout: 15000 });
  await page.goto(`${BASE}/admin/guides/build-the-bridge-first`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "shots/admin-04-detail-mobile.png", fullPage: true });
  check("[mobile] admin detail has no horizontal page scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
