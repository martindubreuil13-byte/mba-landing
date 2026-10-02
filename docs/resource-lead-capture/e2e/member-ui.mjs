// Browser checks for the member-access flow (Chrome at three sizes) against the LOCAL app + mock Resend.
//   MODE=production-mock  email works (delivered to the mock): the full journey incl. confirmation and admin
//   MODE=email-failed     app started with NO_KEY=1: the form must say plainly that the email could not be sent
import { chromium } from "playwright-core";
import { createClient } from "/Users/martin/Documents/The Modern Business Architect (MBA)/mba-site/node_modules/@supabase/supabase-js/dist/index.mjs";
import fs from "node:fs";

if (!process.env.LOCAL_ADMIN_PASSWORD) throw new Error("Set LOCAL_ADMIN_PASSWORD (a throwaway value for the LOCAL admin user).");
const MODE = process.env.MODE ?? "production-mock";
const BASE = "http://localhost:3000";
const MOCK = "http://127.0.0.1:4010";
const SLUG = "build-the-bridge-first";
const URL = `${BASE}/resources/${SLUG}`;
const PDF = "/Users/martin/Documents/The Modern Business Architect (MBA)/Lead Magnets/Build-the-Bridge-First-FINAL-corrected.pdf";
const sb = createClient(process.env.API_URL, process.env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const results = [];
const check = (n, ok, d = "") => results.push(`${ok ? "PASS" : "FAIL"}  [${MODE}] ${n}${ok ? "" : "  -> " + d}`);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const sizes = { desktop: [1280, 900], tablet: [820, 1180], mobile: [390, 844] };
const BENEFIT_INTRO = /The guide is free to read online, and it stays that way\. Free members of the Modern Business Architect community also get the printable PDF to download, print, complete and keep\./;
const NOTE = /Enter your email and we’ll send you a link to confirm\. When you confirm, you become a free member/;
const DISCLOSURE = /Membership is free and starts only when you confirm from the email\./;
const mails = async (email) => (await fetch(`${MOCK}/__sent`).then((r) => r.json())).filter((m) => m.to.includes(email));
const mailBody = (id) => fetch(`${MOCK}/emails/${id}`).then((r) => r.json());
const lead = async (email) => (await sb.from("leads").select("*").eq("email", email).maybeSingle()).data;

async function newPage(size) {
  const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] }, acceptDownloads: true, deviceScaleFactor: 1, userAgent: UA });
  const page = await ctx.newPage();
  const downloads = [];
  page.on("download", (d) => downloads.push(d));
  return { ctx, page, downloads };
}

// ---------------------------------------------------------------- the public layer and the form, at every size
for (const [name, size] of Object.entries(sizes)) {
  const { ctx, page, downloads } = await newPage(size);
  await page.goto(URL, { waitUntil: "networkidle" });
  check(`[${name}] no horizontal scroll on load`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  check(`[${name}] the complete guide is readable with no email, login or form`, (await page.locator("#page-9").count()) === 1 && (await page.getByLabel("Email address").count()) === 0);
  const topCta = page.locator('[data-cta-location="top"]');
  check(`[${name}] the member benefit is described BEFORE any email is asked for`, await topCta.getByText(/Read the complete guide here, free\. Free members of the community also get the printable PDF/).isVisible());
  await page.screenshot({ path: `shots/member-${name}-01-top.png` });

  await topCta.getByRole("button", { name: /unlock the printable guide/i }).focus();
  await page.keyboard.press("Enter");
  const input = topCta.getByLabel("Email address");
  await input.waitFor();
  check(`[${name}] opening the form focuses the email field`, await input.evaluate((el) => el === document.activeElement));
  check(`[${name}] heading, public/member explanation, note, button and disclosure are the v1.2 wording`, await topCta.getByRole("heading", { name: "Unlock the printable guide" }).isVisible() && await topCta.getByText(BENEFIT_INTRO).isVisible() && await topCta.getByText(NOTE).isVisible() && await topCta.getByRole("button", { name: /email me a confirmation link/i }).isVisible() && await topCta.getByText(DISCLOSURE).isVisible());
  check(`[${name}] there is no checkbox and no promise of an instant download in the form`, (await topCta.getByRole("checkbox").count()) === 0 && !/download (now|immediately|instantly)/i.test(await topCta.innerText()));
  await topCta.screenshot({ path: `shots/member-${name}-02-form.png` });

  await input.fill("not-an-email");
  await page.keyboard.press("Enter");
  const alert = topCta.getByRole("alert").filter({ hasText: /@/ });
  await alert.waitFor();
  check(`[${name}] a bad address shows a helpful inline error and keeps focus`, /missing an “@”/.test(await alert.innerText()) && (await input.getAttribute("aria-invalid")) === "true");

  const email = `delivered+ui-${name}-${run}@resend.dev`;
  await input.fill(email);
  await page.keyboard.press("Enter");
  if (MODE === "email-failed") {
    await topCta.getByRole("alert").filter({ hasText: /could not send the email/i }).waitFor({ timeout: 20000 });
    check(`[${name}] when the email cannot be sent the form says so plainly (no 'check your inbox')`, (await topCta.getByText("Check your inbox").count()) === 0);
    await topCta.screenshot({ path: `shots/member-${name}-03-email-failed.png` });
    await ctx.close();
    continue;
  }
  const heading = topCta.getByRole("heading", { name: "Check your inbox" });
  await heading.waitFor({ timeout: 20000 });
  check(`[${name}] submitting shows the neutral check-your-inbox state with focus on its heading`, await heading.evaluate((el) => el === document.activeElement));
  check(`[${name}] NO download starts and no download link is on the page`, downloads.length === 0 && (await page.locator('a[href*="/api/resources/download"]').count()) === 0 && !/api\/resources\/download/.test(await page.content()));
  check(`[${name}] the state explains the next step, the spam hint and the rejoin link`, await topCta.getByText(/press the confirmation button to unlock the printable PDF/).isVisible() && await topCta.getByText(/Check your spam folder/).isVisible() && (await topCta.getByRole("link", { name: /Rejoin here/ }).getAttribute("href")) === "/rejoin");
  check(`[${name}] the other CTAs now say 'check your inbox', not 'you already have the guide'`, (await page.locator('[data-cta-location="end"]').getByText(/Check your inbox for your confirmation email/).count()) === 1);
  await topCta.screenshot({ path: `shots/member-${name}-03-check-inbox.png` });
  check(`[${name}] DB: pending, marketing off, request LOCKED`, (await lead(email)).ongoing_content_opt_in === false && ((await sb.from("resource_requests").select("benefit_fulfilled_at").eq("lead_id", (await lead(email)).id)).data[0].benefit_fulfilled_at === null));
  check(`[${name}] no horizontal scroll after submitting`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await ctx.close();
}
if (MODE === "email-failed") { console.log(results.join("\n")); const f = results.filter((x) => x.startsWith("FAIL")).length; console.log(`\n${results.length - f} passed, ${f} failed`); await browser.close(); process.exit(f ? 1 : 0); }

// ---------------------------------------------------------------- all three CTAs open the SAME form
for (const loc of ["mid-guide", "end"]) {
  const { ctx, page, downloads } = await newPage(sizes.desktop);
  await page.goto(URL, { waitUntil: "networkidle" });
  const cta = page.locator(`[data-cta-location="${loc}"]`);
  await cta.scrollIntoViewIfNeeded();
  await cta.getByRole("button", { name: /unlock the printable guide/i }).click();
  check(`[${loc}] CTA opens the same form component (one form on the page)`, (await page.locator("[data-cta-location] form").count()) === 1 && await cta.getByRole("button", { name: /email me a confirmation link/i }).isVisible());
  await cta.getByLabel("Email address").fill(`delivered+ui-${loc}-${run}@resend.dev`);
  await cta.getByRole("button", { name: /email me a confirmation link/i }).click();
  await cta.getByRole("heading", { name: "Check your inbox" }).waitFor();
  check(`[${loc}] submitting here also yields the neutral state and no download`, downloads.length === 0);
  await ctx.close();
}

// ---------------------------------------------------------------- the confirmation journey in a real browser
const journey = `delivered+ui-journey-${run}@resend.dev`;
{
  const { ctx, page, downloads } = await newPage(sizes.desktop);
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator('[data-cta-location="top"]').getByRole("button", { name: /unlock the printable guide/i }).click();
  await page.getByLabel("Email address").fill(journey);
  await page.getByRole("button", { name: /email me a confirmation link/i }).click();
  await page.getByRole("heading", { name: "Check your inbox" }).waitFor();
  const conf = (await mails(journey)).find((m) => /Confirm your email to unlock/.test(m.subject));
  const mail = await mailBody(conf.id);
  const confirmUrl = mail.html.match(/href="([^"]*\/confirm\?token=[^"]+)"/)[1].replace(/&amp;/g, "&");
  const { ctx: c2, page: p2, downloads: d2 } = await newPage(sizes.desktop);
  await p2.goto(confirmUrl, { waitUntil: "networkidle" });
  check("opening the confirmation link only explains: heading, what unlocks, one button", await p2.getByRole("heading", { name: "Unlock the printable guide" }).isVisible() && await p2.getByText(/the printable PDF of Build the Bridge First unlocks straight away/).isVisible() && await p2.getByRole("button", { name: /confirm and unlock the guide/i }).isVisible());
  await p2.screenshot({ path: "shots/member-confirm-01-page.png" });
  check("…and does NOT confirm, unlock or download anything", d2.length === 0 && (await lead(journey)).ongoing_content_opt_in === false && !/api\/resources\/download/.test(await p2.content()));
  const [dl] = await Promise.all([p2.waitForEvent("download", { timeout: 20000 }), p2.getByRole("button", { name: /confirm and unlock the guide/i }).click()]);
  check("pressing the button confirms and the PDF download STARTS", dl.suggestedFilename() === "Build-the-Bridge-First-FINAL.pdf", dl.suggestedFilename());
  check("the downloaded file is the accepted PDF", fs.readFileSync(await dl.path()).equals(fs.readFileSync(PDF)));
  await p2.getByRole("heading", { name: "You are in." }).waitFor();
  check("the page then says what happened and offers the download again", await p2.getByText(/I have also emailed you a link that stays valid/).isVisible() && await p2.getByRole("link", { name: /Download the PDF/ }).isVisible());
  await p2.screenshot({ path: "shots/member-confirm-02-done.png" });
  check("DB: membership active, request unlocked, delivery email sent", (await lead(journey)).ongoing_content_opt_in === true && (await mails(journey)).some((m) => m.subject === "Your guide is ready: Build the Bridge First"));
  const [again] = await Promise.all([p2.waitForEvent("download"), p2.getByRole("link", { name: /Download the PDF/ }).click()]);
  check("the download button works again", again.suggestedFilename().endsWith(".pdf"));
  await c2.close();
  await ctx.close();
}

// ---------------------------------------------------------------- an existing member: neutral state, benefit by email
{
  const { ctx, page, downloads } = await newPage(sizes.desktop);
  await sb.from("resource_requests").update({ requested_at: new Date(Date.now() - 11 * 60_000).toISOString() }).eq("lead_id", (await lead(journey)).id);
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.locator('[data-cta-location="top"]').getByRole("button", { name: /unlock the printable guide/i }).click();
  await page.getByLabel("Email address").fill(journey);
  await page.getByRole("button", { name: /email me a confirmation link/i }).click();
  await page.getByRole("heading", { name: "Check your inbox" }).waitFor();
  check("a confirmed member sees the SAME neutral state, with no download and no 'you are a member' hint", downloads.length === 0 && (await page.getByText(/member/i).filter({ hasText: /already|welcome|you are/i }).count()) === 0);
  await page.waitForTimeout(500);
  check("…and the benefit arrives by email instead", (await mails(journey)).filter((m) => m.subject === "Your guide is ready: Build the Bridge First").length === 2);
  await ctx.close();
}

// ---------------------------------------------------------------- explicit rejoin
{
  const { ctx, page } = await newPage(sizes.mobile);
  await page.goto(`${BASE}/rejoin`, { waitUntil: "networkidle" });
  check("rejoin page: explicit wording, no checkbox, no horizontal scroll", await page.getByRole("heading", { name: "Rejoin the community" }).isVisible() && await page.getByText(/Nothing changes until you confirm/).isVisible() && (await page.getByRole("checkbox").count()) === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: "shots/member-rejoin-01-form.png" });
  await page.getByLabel("Email address").fill(`delivered+ui-rejoin-unknown-${run}@resend.dev`);
  await page.getByRole("button", { name: /email me a confirmation link/i }).click();
  await page.getByRole("heading", { name: "Check your inbox" }).waitFor();
  check("rejoin gives the same neutral answer for an address that is not on the list, and creates nothing", (await lead(`delivered+ui-rejoin-unknown-${run}@resend.dev`)) === null);
  await page.screenshot({ path: "shots/member-rejoin-02-done.png" });
  await ctx.close();
}

// ---------------------------------------------------------------- admin
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
  await page.screenshot({ path: "shots/member-admin-01-guides.png", fullPage: true });
  await page.getByRole("link", { name: "Build The Bridge First" }).click();
  await page.waitForURL(/admin\/guides\/build-the-bridge-first/);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "shots/member-admin-02-detail.png", fullPage: true });

  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) + "T00:00:00Z";
  const resource = (await sb.from("resources").select("id").eq("slug", SLUG).single()).data;
  const evs = (await sb.from("resource_events").select("event_name, session_id, metadata, lead_id").eq("resource_id", resource.id).gte("created_at", since).limit(5000)).data;
  const reqs = (await sb.from("resource_requests").select("id, opted_in_this_request, benefit_fulfilled_at, lead_id").eq("resource_id", resource.id).gte("requested_at", since).limit(5000)).data;
  const count = (n) => evs.filter((e) => e.event_name === n).length;
  const row = async (label) => Number((await page.locator("tr", { has: page.getByRole("rowheader", { name: label, exact: true }) }).first().locator("td").first().innerText()).trim());
  check("admin 'Public views' equals stored events", (await row("Public views")) === count("resource_page_view"), `${await row("Public views")} vs ${count("resource_page_view")}`);
  check("admin 'Membership requests' equals requests that asked for membership", (await row("Membership requests")) === reqs.filter((r) => r.opted_in_this_request).length);
  const pend = new Set();
  check("admin 'Confirmed members' equals distinct confirmed people", (await row("Confirmed members")) === new Set(evs.filter((e) => e.event_name === "resource_opt_in_confirmed").map((e) => e.lead_id)).size);
  check("admin 'Printable guide unlocked' equals unlock events", (await row("Printable guide unlocked")) === count("resource_benefit_fulfilled"));
  check("admin 'Download starts' equals stored events", (await row("Download starts")) === count("resource_download_started"));
  check("admin 'Printable guide CTA clicks' equals stored events", (await row("Printable guide CTA clicks")) === count("resource_cta_clicked"));
  const rates = await page.locator("section:has(h2:text('Conversion')) tbody tr td:nth-child(2)").allInnerTexts();
  const nums = rates.map((t) => t.trim()).filter((t) => t !== "—").map((t) => parseFloat(t));
  check("every displayed conversion is a percentage of the same unit, none above 100%", nums.every((n) => n >= 0 && n <= 100), rates.join(" | "));
  check("no integrity warning on consistent data", (await page.getByText("Analytics integrity warning").count()) === 0);
  check("the detail page explains every rate's units", /sessions|requests|members/.test(await page.locator("section:has(h2:text('Conversion'))").innerText()));
  check("lead rows show Source and Benefit (unlocked/locked) columns", (await page.getByRole("columnheader", { name: "Source" }).count()) === 1 && (await page.getByRole("cell", { name: "Locked" }).count()) > 0 && (await page.getByRole("cell", { name: "Unlocked" }).count()) > 0);
  const leadLink = page.getByRole("link", { name: /@resend\.dev$/ }).first();
  const href = await leadLink.getAttribute("href");
  check("lead rows link to the central lead detail", /^\/admin\/leads\/[0-9a-f-]{36}$/.test(href), href);
  await page.goto(`${BASE}/admin/guides/${SLUG}?range=custom&from=2020-01-01&to=2020-01-31`, { waitUntil: "networkidle" });
  check("a range with no data shows zeros and em-dash rates", (await row("Public views")) === 0 && /—/.test(await page.locator("section:has(h2:text('Conversion')) tbody tr td:nth-child(2)").first().innerText()));
  await page.goto(`${BASE}/admin/leads`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "shots/member-admin-03-leads.png", fullPage: true });
  await ctx.close();
}

console.log(results.join("\n"));
const failed = results.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
